import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiSend, FiUserCheck, FiCpu, FiCheck, FiRotateCcw, FiEdit3 } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { connectRealtime } from "../../services/realtime.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const REFRESH_MS = 4000;

function Bubble({ msg }) {
  if (msg.sender === "user") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary-500 px-3.5 py-2 text-sm text-white">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.sender === "agent") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-info-500 px-3.5 py-2 text-sm text-white">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">{msg.agentName || "Agent"}</p>
          {msg.text}
        </div>
      </div>
    );
  }
  const isHandoff = msg.type === "handoff";
  const isSystem = msg.type === "system";
  return (
    <div className="mb-3 flex justify-start">
      <div
        className={`max-w-[75%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm ${
          isHandoff
            ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
            : isSystem
              ? "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
              : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

export default function ConversationDetailPane({ selected, onBack, onChanged }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = (silent = false) => {
    if (!selected) return;
    if (!silent) setLoading(true);
    setError("");
    api
      .get(`/conversations/${selected.companyId}/${selected.visitorId}`)
      .then((res) => {
        setData(res.data);
        onChanged?.();
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setData(null);
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.companyId, selected?.visitorId]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selected) return;
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, REFRESH_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.companyId, selected?.visitorId]);

  // Realtime push for THIS thread specifically — reuses the one
  // socket connection ConversationsInbox already subscribed to every
  // accessible company's room on, so this only needs to listen and
  // filter, not subscribe again. The poll above stays as the fallback
  // (Section 30).
  useEffect(() => {
    if (!selected) return;
    const socket = connectRealtime();
    if (!socket) return;

    const onEvent = (evt) => {
      if (
        evt.companyId === selected.companyId &&
        evt.conversationId === selected.visitorId &&
        (evt.type === "message.created" || evt.type.startsWith("conversation."))
      ) {
        load(true);
      }
    };

    socket.on("domain:event", onEvent);
    return () => socket.off("domain:event", onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.companyId, selected?.visitorId]);

  useEffect(() => {
    // `block: "nearest"` deliberately, not the default "start" — this
    // must only ever scroll the thread's own internal scroll
    // container, never bubble up and scroll the page itself.
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [data?.thread?.length]);

  if (!selected) {
    return (
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <EmptyState title="Select a conversation" description="Choose a conversation from the list to view its history." />
      </div>
    );
  }

  const doAction = async (action, extra = {}) => {
    setActionBusy(true);
    try {
      await api.patch(`/conversations/${selected.companyId}/${selected.visitorId}`, { action, ...extra });
      showToast(`Conversation updated.`);
      load(false);
      onChanged?.();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setActionBusy(false);
      setConfirmClose(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/conversations/${selected.companyId}/${selected.visitorId}/messages`, { text: reply.trim() });
      setReply("");
      load(true);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSending(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/conversations/${selected.companyId}/${selected.visitorId}/notes`, { text: noteText.trim() });
      setNoteText("");
      setShowNoteBox(false);
      load(true);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const perms = data?.permissions || {};
  const conv = data?.conversation;
  const isClosed = conv?.status === "CLOSED";
  const isMine = conv?.assignedTo && String(conv.assignedTo._id || conv.assignedTo) === String(user?._id);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-[var(--border)]">
        <button onClick={onBack} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-white/5">
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
            {data?.visitor?.name || data?.visitor?.email || `Visitor ${selected.visitorId.slice(0, 8)}`}
          </p>
          <p className="truncate text-[11px] text-gray-400">{selected.visitorId}</p>
        </div>
        {conv && (
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={conv.status} />
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${conv.mode === "HUMAN" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-400"}`}>
              {conv.mode === "HUMAN" ? "Human Handling" : "AI Handling"}
            </span>
          </div>
        )}
      </div>

      {loading && !data && (
        <div className="flex-1 space-y-3 p-4">
          <SkeletonLine className="h-10 w-2/3" />
          <SkeletonLine className="h-10 w-1/2 ml-auto" />
          <SkeletonLine className="h-10 w-2/3" />
        </div>
      )}

      {error && !data && <ErrorState message={error} onRetry={() => load(false)} />}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2 text-xs dark:border-[var(--border)]">
            {perms.canTakeOver && conv.mode !== "HUMAN" && (
              <Button variant="secondary" onClick={() => doAction("takeOver")} loading={actionBusy} className="!px-2.5 !py-1 !text-xs">
                <FiUserCheck className="h-3 w-3" /> Take Over
              </Button>
            )}
            {perms.canReturnToAI && conv.mode === "HUMAN" && (
              <Button variant="secondary" onClick={() => doAction("returnToAI")} loading={actionBusy} className="!px-2.5 !py-1 !text-xs">
                <FiCpu className="h-3 w-3" /> Return to AI
              </Button>
            )}
            {perms.canClose && !isClosed && (
              <Button variant="secondary" onClick={() => setConfirmClose(true)} loading={actionBusy} className="!px-2.5 !py-1 !text-xs">
                <FiCheck className="h-3 w-3" /> Close
              </Button>
            )}
            {perms.canReopen && isClosed && (
              <Button variant="secondary" onClick={() => doAction("reopen")} loading={actionBusy} className="!px-2.5 !py-1 !text-xs">
                <FiRotateCcw className="h-3 w-3" /> Reopen
              </Button>
            )}
            {perms.canTakeOver && !isMine && (
              <Button variant="secondary" onClick={() => doAction("assign", { agentId: user._id })} loading={actionBusy} className="!px-2.5 !py-1 !text-xs">
                Assign to me
              </Button>
            )}
            {perms.canAddNotes && (
              <Button variant="secondary" onClick={() => setShowNoteBox((s) => !s)} className="!px-2.5 !py-1 !text-xs">
                <FiEdit3 className="h-3 w-3" /> Note
              </Button>
            )}
            <span className="ml-auto text-[11px] text-gray-400">
              {conv.assignedTo ? `Assigned` : "Unassigned"}
            </span>
          </div>

          {showNoteBox && (
            <div className="border-b border-gray-100 bg-amber-50/50 px-4 py-2 dark:border-[var(--border)] dark:bg-amber-500/5">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Internal note — visitors never see this"
                className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:bg-[var(--surface)] dark:border-amber-500/30"
              />
              <div className="mt-1.5 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowNoteBox(false)} className="!px-2.5 !py-1 !text-xs">Cancel</Button>
                <Button onClick={addNote} disabled={!noteText.trim()} className="!px-2.5 !py-1 !text-xs">Save Note</Button>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {conv.notes?.length > 0 && (
              <div className="mb-4 space-y-1.5">
                {conv.notes.map((n) => (
                  <div key={n._id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="font-semibold">{n.authorName}:</span> {n.text}
                  </div>
                ))}
              </div>
            )}
            {data.thread.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 p-3 dark:border-[var(--border)]">
            {isClosed ? (
              <p className="text-center text-xs text-gray-400">This conversation is closed. Reopen it to reply.</p>
            ) : conv.mode !== "HUMAN" ? (
              <p className="text-center text-xs text-gray-400">AI is handling this conversation. Take over to reply as a human.</p>
            ) : !perms.canReply ? (
              <p className="text-center text-xs text-gray-400">You have read-only access to this conversation.</p>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Reply as yourself..."
                  className="max-h-24 flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
                />
                <Button onClick={sendReply} loading={sending} disabled={!reply.trim()}>
                  <FiSend className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClose}
        title="Close this conversation?"
        message="The visitor can still reopen it by sending another message — it will resume in AI mode."
        confirmLabel="Close"
        variant="primary"
        loading={actionBusy}
        onConfirm={() => doAction("close")}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}
