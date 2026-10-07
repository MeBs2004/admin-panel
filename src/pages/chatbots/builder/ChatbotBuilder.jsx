import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import api, { getErrorMessage } from "../../../services/api.js";
import { subscribeChatbot } from "../../../services/realtime.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
import BuilderToolbar from "./BuilderToolbar.jsx";
import NodeLibrary from "./NodeLibrary.jsx";
import NodeConfigPanel from "./NodeConfigPanel.jsx";
import FlowNode from "./FlowNode.jsx";
import VersionHistoryDrawer from "./VersionHistoryDrawer.jsx";
import { NODE_DEFS } from "./nodeDefs.js";

const NODE_TYPES = { flowNode: FlowNode };

function toRfNode(node) {
  return {
    id: node.id,
    type: "flowNode",
    position: node.position || { x: 0, y: 0 },
    data: { nodeType: node.type, nodeData: node.data || {}, errors: [] },
  };
}

function toRfEdge(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || undefined,
    targetHandle: edge.targetHandle || undefined,
    label: edge.label || undefined,
  };
}

function toBackendNodes(rfNodes) {
  return rfNodes.map((n) => ({ id: n.id, type: n.data.nodeType, position: n.position, data: n.data.nodeData || {} }));
}

function toBackendEdges(rfEdges) {
  return rfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || null,
    targetHandle: e.targetHandle || null,
    label: e.label || "",
  }));
}

function snapshotEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function BuilderCanvas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [errors, setErrors] = useState([]);

  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [publishedVersion, setPublishedVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const historyRef = useRef({ stack: [], index: -1 });
  const [historyTick, setHistoryTick] = useState(0);
  const addNodeOffsetRef = useRef(0);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([api.get(`/chatbots/${id}`), api.get(`/chatbots/${id}/flow`)])
      .then(([detailRes, flowRes]) => {
        setChatbot(detailRes.data.chatbot);
        const draft = flowRes.data.draft;
        const rfNodes = draft.nodes.map(toRfNode);
        const rfEdges = draft.edges.map(toRfEdge);
        setNodes(rfNodes);
        setEdges(rfEdges);
        setPublishedVersion(flowRes.data.published?.version || null);
        setVersions(flowRes.data.versions || []);
        const snapshot = { nodes: toBackendNodes(rfNodes), edges: toBackendEdges(rfEdges), startNodeId: draft.startNodeId };
        setSavedSnapshot(snapshot);
        historyRef.current = { stack: [snapshot], index: 0 };
        setHistoryTick((t) => t + 1);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  // Lightweight refresh — only the published pointer + version list,
  // never the in-progress draft (nodes/edges), so another admin
  // publishing/rolling back elsewhere never clobbers unsaved local
  // edits (Section 31's "never silently overwrite" principle, same as
  // Knowledge Base/AI Settings).
  const refreshVersions = useCallback(() => {
    api
      .get(`/chatbots/${id}/flow`)
      .then((res) => {
        setPublishedVersion(res.data.published?.version || null);
        setVersions(res.data.versions || []);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    return subscribeChatbot(id, (evt) => {
      if (evt.type === "chatbot.flow.published" || evt.type === "chatbot.flow.rolledback") {
        refreshVersions();
      }
    });
  }, [id, refreshVersions]);

  const onRollback = useCallback(
    async (version) => {
      setRollingBack(true);
      try {
        const res = await api.post(`/chatbots/${id}/flow/rollback`, { version });
        setPublishedVersion(res.data.publishedVersion);
        refreshVersions();
        showToast(`Rolled back to version ${res.data.publishedVersion}.`);
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      } finally {
        setRollingBack(false);
      }
    },
    [id, refreshVersions, showToast]
  );

  const currentSnapshot = useCallback(
    () => ({
      nodes: toBackendNodes(nodes),
      edges: toBackendEdges(edges),
      startNodeId: nodes.find((n) => n.data.nodeType === "start")?.id || null,
    }),
    [nodes, edges]
  );

  const hasChanges = savedSnapshot && !snapshotEquals(currentSnapshot(), savedSnapshot);

  const pushHistory = useCallback((snapshot) => {
    const h = historyRef.current;
    const truncated = h.stack.slice(0, h.index + 1);
    truncated.push(snapshot);
    historyRef.current = { stack: truncated.slice(-50), index: Math.min(truncated.length - 1, 49) };
    setHistoryTick((t) => t + 1);
  }, []);

  const applySnapshot = useCallback((snapshot) => {
    setNodes(snapshot.nodes.map(toRfNode));
    setEdges(snapshot.edges.map(toRfEdge));
  }, []);

  const commit = useCallback(() => {
    pushHistory(currentSnapshot());
  }, [currentSnapshot, pushHistory]);

  const onUndo = useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index -= 1;
    applySnapshot(h.stack[h.index]);
    setHistoryTick((t) => t + 1);
  }, [applySnapshot]);

  const onRedo = useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index += 1;
    applySnapshot(h.stack[h.index]);
    setHistoryTick((t) => t + 1);
  }, [applySnapshot]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    if (changes.some((c) => c.type === "remove")) setTimeout(commit, 0);
  }, [commit]);

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge({ ...connection, id: `e_${Date.now()}` }, eds));
      setTimeout(commit, 0);
    },
    [commit]
  );

  const onNodeDragStop = useCallback(() => commit(), [commit]);

  const onAddNode = useCallback(
    (type) => {
      addNodeOffsetRef.current += 1;
      const def = NODE_DEFS[type];
      const newNode = {
        id: `${type}_${Date.now()}`,
        type: "flowNode",
        position: { x: 80 + (addNodeOffsetRef.current % 5) * 40, y: 80 + addNodeOffsetRef.current * 70 },
        data: { nodeType: type, nodeData: { ...def.defaultData }, errors: [] },
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      setTimeout(commit, 0);
    },
    [commit]
  );

  const onDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
      setTimeout(commit, 0);
    },
    [commit]
  );

  const onDuplicateNode = useCallback(
    (nodeId) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source || source.data.nodeType === "start") return;
      const clone = {
        ...source,
        id: `${source.data.nodeType}_${Date.now()}`,
        position: { x: source.position.x + 40, y: source.position.y + 40 },
        selected: false,
      };
      setNodes((nds) => [...nds, clone]);
      setSelectedNodeId(clone.id);
      setTimeout(commit, 0);
    },
    [nodes, commit]
  );

  const configCommitTimerRef = useRef(null);
  const onNodeDataChange = useCallback(
    (nodeId, nextNodeData) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, nodeData: nextNodeData } } : n)));
      // Debounced so undo/redo gets one history entry per pause in
      // typing rather than one per keystroke.
      clearTimeout(configCommitTimerRef.current);
      configCommitTimerRef.current = setTimeout(commit, 700);
    },
    [commit]
  );

  const applyErrorsToNodes = useCallback((errs) => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, errors: errs.filter((e) => e.nodeId === n.id) } })));
  }, []);

  const runValidate = useCallback(
    async (silent = false) => {
      setValidating(true);
      try {
        const payload = currentSnapshot();
        const res = await api.post(`/chatbots/${id}/flow/validate`, payload);
        setErrors(res.data.errors || []);
        applyErrorsToNodes(res.data.errors || []);
        if (!silent) {
          showToast(res.data.valid ? "Flow is valid." : `${res.data.errors.length} issue(s) found.`, res.data.valid ? "success" : "error");
        }
        return res.data;
      } catch (err) {
        if (!silent) showToast(getErrorMessage(err), "error");
        return { valid: false, errors: [] };
      } finally {
        setValidating(false);
      }
    },
    [id, currentSnapshot, applyErrorsToNodes, showToast]
  );

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const payload = currentSnapshot();
      const res = await api.put(`/chatbots/${id}/flow`, payload);
      const draft = res.data.draft;
      setSavedSnapshot({ nodes: toBackendNodes(nodes), edges: toBackendEdges(edges), startNodeId: draft.startNodeId });
      setLastSavedAt(draft.updatedAt);
      showToast("Draft saved.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }, [id, currentSnapshot, nodes, edges, showToast]);

  const onPublish = useCallback(async () => {
    setPublishing(true);
    try {
      if (hasChanges) {
        const payload = currentSnapshot();
        await api.put(`/chatbots/${id}/flow`, payload);
        setSavedSnapshot(payload);
        setLastSavedAt(new Date().toISOString());
      }
      const res = await api.post(`/chatbots/${id}/flow/publish`);
      if (!res.data.success) {
        setErrors(res.data.errors || []);
        applyErrorsToNodes(res.data.errors || []);
        showToast(`Publish failed — ${res.data.errors.length} issue(s) need attention.`, "error");
        return;
      }
      setPublishedVersion(res.data.publishedVersion);
      showToast(`Published as version ${res.data.publishedVersion}.`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPublishing(false);
    }
  }, [id, hasChanges, currentSnapshot, applyErrorsToNodes, showToast, load]);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const hasStart = nodes.some((n) => n.data.nodeType === "start");

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        <SkeletonLine className="h-6 w-64" />
        <SkeletonLine className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const h = historyRef.current;

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-[var(--bg)]">
      <BuilderToolbar
        chatbotName={chatbot?.name}
        onBack={() => navigate(`/chatbots/${id}`)}
        canUndo={h.index > 0}
        canRedo={h.index < h.stack.length - 1}
        onUndo={onUndo}
        onRedo={onRedo}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView()}
        onValidate={() => runValidate(false)}
        validating={validating}
        saveState={saving ? "saving" : hasChanges ? "unsaved" : "saved"}
        lastSavedAt={lastSavedAt}
        onSaveDraft={saveDraft}
        saving={saving}
        onPublish={onPublish}
        publishing={publishing}
        publishedVersion={publishedVersion}
        onOpenHistory={() => setShowHistory(true)}
      />

      {/* Desktop builder — see section 31: this is intentionally not
          reflowed for small screens, which get an explicit message
          instead of a degraded, hard-to-use canvas. */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        <NodeLibrary onAddNode={onAddNode} hasStart={hasStart} />

        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <MiniMap pannable zoomable className="!bg-white dark:!bg-[var(--surface)]" />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="pointer-events-auto max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-center shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Build your first conversation</p>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Start with a welcome message, collect visitor information, answer questions with AI, connect webhooks,
                  and hand conversations to your team.
                </p>
                <Button className="mt-4" onClick={() => onAddNode("start")}>
                  Add Start node
                </Button>
              </div>
            </div>
          )}
        </div>

        <NodeConfigPanel
          node={selectedNode}
          errors={errors}
          onChange={(nodeId, next) => {
            onNodeDataChange(nodeId, next);
          }}
          onClose={() => setSelectedNodeId(null)}
          onDelete={onDeleteNode}
          onDuplicate={onDuplicateNode}
        />
      </div>

      <div className="flex flex-1 items-center justify-center p-8 text-center lg:hidden">
        <p className="text-sm text-gray-500">
          Bot Builder is optimized for desktop screens. Please use a larger screen for the full flow editor.
        </p>
      </div>

      <VersionHistoryDrawer
        open={showHistory}
        onClose={() => setShowHistory(false)}
        versions={versions}
        onRollback={onRollback}
        rollingBack={rollingBack}
      />
    </div>
  );
}

export default function ChatbotBuilder() {
  return (
    <ReactFlowProvider>
      <BuilderCanvas />
    </ReactFlowProvider>
  );
}
