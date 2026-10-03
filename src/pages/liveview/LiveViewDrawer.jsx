import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiExternalLink, FiUserCheck } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Drawer from "../../components/ui/Drawer.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Button from "../../components/ui/Button.jsx";

// Reuses the exact same action endpoint/shape ConversationDetailPane
// already calls (Section 20 — no second handoff implementation).
export default function LiveViewDrawer({ visitor, permissions, onClose, onChanged }) {
  const navigate = useNavigate();
  const [taking, setTaking] = useState(false);
  const [error, setError] = useState("");

  if (!visitor) return null;

  const handleTakeOver = async () => {
    setTaking(true);
    setError("");
    try {
      await api.patch(`/conversations/${visitor.companyId}/${visitor.visitorId}`, { action: "takeOver" });
      onChanged();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTaking(false);
    }
  };

  const canTakeOver =
    permissions?.canTakeOver && visitor.conversation?.isHandoffPending;

  return (
    <Drawer
      open={Boolean(visitor)}
      onClose={onClose}
      title={visitor.name || visitor.email || visitor.visitorId.slice(0, 12)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {visitor.conversation && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/conversations/${visitor.companyId}/${visitor.visitorId}`)}
            >
              <FiExternalLink size={14} /> Open Conversation
            </Button>
          )}
          {canTakeOver && (
            <Button onClick={handleTakeOver} loading={taking}>
              <FiUserCheck size={14} /> Take Over
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5 text-sm">
        <div className="flex items-center gap-2">
          <StatusBadge status={visitor.liveStatus === "online" ? "ONLINE" : "IDLE"} />
          {visitor.conversation?.isHandoffPending && <StatusBadge status="HANDOFF" />}
        </div>

        {error && (
          <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Session</h3>
          <dl className="space-y-1.5">
            <Row label="Visitor ID" value={visitor.visitorId} />
            <Row label="Company" value={visitor.companyName} />
            <Row label="First seen" value={new Date(visitor.firstVisit).toLocaleString()} />
            <Row label="Last active" value={new Date(visitor.lastVisit).toLocaleString()} />
            <Row label="Sessions" value={visitor.totalVisits} />
            <Row label="Messages" value={visitor.totalMessages} />
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Device</h3>
          <dl className="space-y-1.5">
            <Row label="Browser" value={visitor.browser || "—"} />
            <Row label="OS" value={visitor.os || "—"} />
            <Row label="Device" value={visitor.device || "—"} />
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Location</h3>
          <dl className="space-y-1.5">
            <Row label="City" value={[visitor.city, visitor.country].filter(Boolean).join(", ") || "—"} />
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Current Page</h3>
          <p className="break-all text-gray-700 dark:text-gray-300">{visitor.page || "—"}</p>
        </section>

        {visitor.conversation && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Conversation</h3>
            <dl className="space-y-1.5">
              <Row label="Mode" value={visitor.conversation.mode} />
              <Row label="Status" value={visitor.conversation.status} />
              <Row label="Assigned to" value={visitor.conversation.assignedToName || "Unassigned"} />
              <Row label="Unread" value={visitor.conversation.unreadCount} />
            </dl>
          </section>
        )}

        <button
          onClick={() => navigate(`/visitors/${visitor._id}`)}
          className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          View full visitor profile &rarr;
        </button>
      </div>
    </Drawer>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className="truncate text-right font-medium text-gray-700 dark:text-gray-200">{value ?? "—"}</dd>
    </div>
  );
}
