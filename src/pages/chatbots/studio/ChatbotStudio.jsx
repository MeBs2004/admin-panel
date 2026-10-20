import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { usePanel } from "../../../utils/panelPath.js";
import api, { getErrorMessage } from "../../../services/api.js";
import { subscribeChatbot } from "../../../services/realtime.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { STARTER_CHATBOT_CONFIG } from "../../../config/chatbotStarter.js";
import Button from "../../../components/ui/Button.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import StudioWorkspace from "../../../components/studio/StudioWorkspace.jsx";
import StudioTopBar from "./StudioTopBar.jsx";

export default function ChatbotStudio() {
  const { id } = useParams();
  const { navigate } = usePanel();
  const { showToast } = useToast();

  const [chatbot, setChatbot] = useState(null);
  const [company, setCompany] = useState(null);
  const [serverConfig, setServerConfig] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [deviceMode, setDeviceMode] = useState("desktop");
  const [confirmReset, setConfirmReset] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [switchingEngine, setSwitchingEngine] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${id}`)
      .then((res) => {
        setChatbot(res.data.chatbot);
        setCompany(res.data.company);
        setServerConfig(res.data.chatbot.config);
        setDraftConfig(res.data.chatbot.config);
        setConflict(false);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const hasChanges =
    !loading && draftConfig && JSON.stringify(draftConfig) !== JSON.stringify(serverConfig);

  // Multi-tab / another-admin conflict detection (Section 33/34): a
  // ref because the socket subscription below is set up once per
  // chatbot id, not re-subscribed every render, but still needs the
  // CURRENT hasChanges value when an event actually arrives.
  const hasChangesRef = useRef(hasChanges);
  hasChangesRef.current = hasChanges;

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeChatbot(id, (evt) => {
      if (evt.type !== "chatbot.config.updated" && evt.type !== "chatbot.updated") return;

      if (hasChangesRef.current) {
        // Never silently discard unsaved work — just flag it. The
        // admin decides when to reload (Reset to defaults still
        // works, or they can finish and Save, accepting they may
        // overwrite the other change).
        setConflict(true);
      } else {
        load();
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/chatbots/${id}/config`, { config: draftConfig });
      setServerConfig(res.data.config);
      setDraftConfig(res.data.config);
      setJustSaved(true);
      setConflict(false);
      showToast("Chatbot configuration saved.");
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  // Chatbots created before the config-driven widget run the old
  // hardcoded widgets, which ignore most Customize options. Switching
  // makes every option below real — for the preview and the live widget.
  const handleSwitchEngine = async () => {
    setSwitchingEngine(true);
    try {
      await api.patch(`/chatbots/${id}`, { widgetEngineVersion: "v1" });
      setChatbot((c) => ({ ...c, widgetEngineVersion: "v1" }));
      showToast("Switched to the new widget engine. Every option now applies.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSwitchingEngine(false);
    }
  };

  const handleReset = () => {
    setDraftConfig(STARTER_CHATBOT_CONFIG);
    setJustSaved(false);
    setConfirmReset(false);
  };

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

  if (!chatbot) return null;

  return (
    // This page is a standalone top-level route (see App.jsx — declared
    // outside <AdminLayout>, no sidebar/header above it), so h-screen
    // here is correct and was never the bug. The actual cause: nested
    // overflow-y-auto panes below (lines ~188-199) sat in flex items
    // with the default `min-height: auto`, so a left-control toggle
    // that changed content height (e.g. "Show greeting") could grow/
    // shrink the flex item itself instead of scrolling inside it,
    // which reflowed this whole h-screen tree and made it look like
    // the page "jumped." `min-h-0` on that chain fixes it — the actual
    // fix is below, not on this root div.
    <div className="flex h-screen flex-col bg-[var(--bg)]">
      <StudioTopBar
        chatbotName={chatbot.name}
        companyName={company?.name}
        onBack={() => navigate(`/chatbots/${id}`)}
        hasChanges={hasChanges}
        justSaved={justSaved}
        saving={saving}
        onSave={handleSave}
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
      />

      {conflict && (
        <div className="animate-fade-in-up flex items-center justify-between gap-3 border-b border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          <span>Someone else updated this chatbot. Refresh to load the latest version, or keep editing — saving will overwrite their change.</span>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={load}
              className="rounded-md border border-warning-300 px-2.5 py-1 text-xs font-medium text-warning-700 transition-colors hover:bg-warning-100 dark:border-warning-500/40 dark:text-warning-300 dark:hover:bg-warning-500/20"
            >
              Refresh
            </button>
            <button
              onClick={() => setConflict(false)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-warning-600 transition-colors hover:bg-warning-100 dark:text-warning-400 dark:hover:bg-warning-500/20"
            >
              Keep my changes
            </button>
          </div>
        </div>
      )}

      {chatbot.widgetEngineVersion !== "v1" && (
        <div className="animate-fade-in-up flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span>
            <strong>Legacy widget.</strong> This chatbot still uses the original hardcoded widget, which ignores most options here (new colors,
            animations, fonts, forms and more). Switch to the new engine so every option below takes effect.
          </span>
          <Button onClick={handleSwitchEngine} loading={switchingEngine}>
            Switch to new engine
          </Button>
        </div>
      )}

      <StudioWorkspace
        className="flex-1"
        config={draftConfig}
        onConfigChange={(updater) => {
          setJustSaved(false);
          setDraftConfig(updater);
        }}
        companyId={company?.companyId}
        engine={chatbot.widgetEngineVersion || "legacy"}
        deviceMode={deviceMode}
        footer={
          <div className="mt-8 border-t border-gray-100 pt-5 dark:border-[var(--border)]">
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              Reset to defaults
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset changes?"
        message="This resets your unsaved editor to the default configuration. Nothing is saved until you click Save changes."
        confirmLabel="Reset"
        variant="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
