import { useCallback, useEffect, useRef, useState } from "react";
import { FiUsers, FiMessageSquare, FiCpu, FiUserCheck, FiEye } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeAccessibleCompanies, getRealtimeStatus, onRealtimeStatusChange } from "../../services/realtime.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { SkeletonCards, SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import LiveViewDrawer from "./LiveViewDrawer.jsx";

// Realtime (Section 26/30) is a push on top of this poll, never a
// replacement for it — same pattern as ConversationsInbox/VisitorsList.
// Shorter than those two pages' interval since "live" is the entire
// point of this one.
const POLL_MS = 5000;

const RELEVANT_EVENT_TYPES = new Set([
  "visitor.created",
  "visitor.updated",
  "conversation.created",
  "conversation.updated",
  "conversation.assigned",
  "conversation.closed",
  "message.created",
]);

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "online", label: "Online" },
  { value: "idle", label: "Idle" },
];

const CONVERSATION_FILTERS = [
  { value: "", label: "All" },
  { value: "none", label: "No Conversation" },
  { value: "active", label: "Active Chat" },
  { value: "handoff", label: "Human Handoff" },
];

const DEVICE_OPTIONS = [
  { value: "", label: "All Devices" },
  { value: "Desktop", label: "Desktop" },
  { value: "Mobile", label: "Mobile" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest Activity" },
  { value: "firstSeen", label: "First Seen" },
  { value: "messages", label: "Messages" },
  { value: "status", label: "Status" },
];

// Only discrete, real events are surfaced here — never a bare
// visitor.updated, which the backend heartbeat now fires every ~25s
// per active visitor (Section 5) and would otherwise misrepresent
// routine heartbeats as "page changed" activity (see
// liveView.service.js's own comment on why lastVisit, not a fabricated
// page-diff, is the freshness signal).
function describeEvent(evt) {
  const visitorId = evt.conversationId || evt.visitorId || null;
  switch (evt.type) {
    case "visitor.created":
      return { text: "New visitor arrived", visitorId };
    case "conversation.created":
      return { text: "New conversation started", visitorId };
    case "conversation.updated":
      return evt.handoff ? { text: "Human handoff requested", visitorId } : null;
    case "conversation.assigned":
      return {
        text: evt.assignedTo ? "An agent took over" : "Conversation returned to the unassigned queue",
        visitorId,
      };
    case "conversation.closed":
      return { text: "Conversation closed", visitorId };
    case "message.created":
      return {
        text: `Message (${evt.sender})${evt.preview ? `: "${evt.preview.slice(0, 60)}${evt.preview.length > 60 ? "…" : ""}"` : ""}`,
        visitorId,
      };
    default:
      return null;
  }
}

export default function LiveView() {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ activeVisitors: 0, activeChats: 0, aiConversations: 0, handoffs: 0 });
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatbots, setChatbots] = useState([]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [activity, setActivity] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", chatbotId: "", device: "", conversation: "", sort: "latest" });

  const pollRef = useRef(null);

  useEffect(() => {
    api
      .get("/chatbots", { params: { limit: 100 } })
      .then((res) => setChatbots(res.data.chatbots || []))
      .catch(() => setChatbots([]));
  }, []);

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      api
        .get("/live-view", {
          params: {
            search: filters.search || undefined,
            status: filters.status || undefined,
            chatbotId: filters.chatbotId || undefined,
            device: filters.device || undefined,
            conversation: filters.conversation || undefined,
            sort: filters.sort,
          },
        })
        .then((res) => {
          setVisitors(res.data.visitors);
          setStats(res.data.stats);
          setPermissions(res.data.permissions);
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false));
    },
    [filters]
  );

  useEffect(() => {
    const t = setTimeout(() => load(false), filters.search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.chatbotId, filters.device, filters.conversation, filters.sort]);

  useEffect(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeAccessibleCompanies((evt) => {
      if (!RELEVANT_EVENT_TYPES.has(evt.type)) return;
      load(true);

      const entry = describeEvent(evt);
      if (entry) {
        setActivity((prev) => [{ ...entry, id: `${evt.timestamp}-${Math.random()}`, at: evt.timestamp }, ...prev].slice(0, 50));
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [realtimeStatus, setRealtimeStatus] = useState(getRealtimeStatus());
  useEffect(() => onRealtimeStatusChange(setRealtimeStatus), []);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Live View"
        description="Visitors and chatbot activity on your site right now."
        badge={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
            title={
              realtimeStatus === "live"
                ? "Connected — updates arrive instantly"
                : realtimeStatus === "reconnecting"
                  ? "Reconnecting — still refreshing automatically every few seconds"
                  : "Disconnected — refreshing automatically every few seconds"
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                realtimeStatus === "live"
                  ? "animate-pulse-soft bg-success-500"
                  : realtimeStatus === "reconnecting"
                    ? "animate-pulse-soft bg-warning-500"
                    : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <span className="text-gray-500 dark:text-gray-400">
              {realtimeStatus === "live" ? "Live" : realtimeStatus === "reconnecting" ? "Reconnecting…" : "Disconnected"}
            </span>
          </span>
        }
      />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active Visitors" value={stats.activeVisitors} icon={FiUsers} accent="primary" index={0} />
          <StatCard label="Active Chats" value={stats.activeChats} icon={FiMessageSquare} accent="info" index={1} />
          <StatCard label="AI Conversations" value={stats.aiConversations} icon={FiCpu} accent="success" index={2} />
          <StatCard label="Human Handoffs" value={stats.handoffs} icon={FiUserCheck} accent="warning" index={3} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="max-w-xs flex-1">
              <Input
                placeholder="Search visitor, page, conversation..."
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </div>
            <div className="flex gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter("status", f.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filters.status === f.value
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Select
              className="w-44"
              value={filters.chatbotId}
              onChange={(e) => setFilter("chatbotId", e.target.value)}
              options={[{ value: "", label: "All Chatbots" }, ...chatbots.map((c) => ({ value: c._id, label: c.name }))]}
            />
            <Select
              className="w-36"
              value={filters.device}
              onChange={(e) => setFilter("device", e.target.value)}
              options={DEVICE_OPTIONS}
            />
            <Select
              className="w-44"
              value={filters.conversation}
              onChange={(e) => setFilter("conversation", e.target.value)}
              options={CONVERSATION_FILTERS}
            />
            <Select
              className="w-40"
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value)}
              options={SORT_OPTIONS}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
            {loading && <SkeletonTable cols={6} />}
            {!loading && error && <ErrorState message={error} onRetry={() => load(false)} />}
            {!loading && !error && visitors.length === 0 && (
              <EmptyState
                icon={FiEye}
                title="No visitors online"
                description="Your live visitor activity will appear here as soon as someone opens the chat widget on your website."
              />
            )}

            {!loading && !error && visitors.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Visitor</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Current Page</th>
                      <th className="px-4 py-3 font-medium">Device</th>
                      <th className="px-4 py-3 font-medium">Messages</th>
                      <th className="px-4 py-3 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v) => (
                      <tr
                        key={v._id}
                        onClick={() => setSelectedVisitor(v)}
                        className="cursor-pointer border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {v.name || v.email || v.visitorId.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-400">{v.companyName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <StatusBadge status={v.liveStatus === "online" ? "ONLINE" : "IDLE"} />
                            {v.conversation?.isHandoffPending && <StatusBadge status="HANDOFF" />}
                          </div>
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-gray-600 dark:text-gray-300" title={v.page}>
                          {v.page || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.device || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.totalMessages}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {new Date(v.lastVisit).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Live Activity</h3>
          {activity.length === 0 ? (
            <p className="text-xs text-gray-400">Events will appear here as they happen.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="animate-fade-in-up text-xs">
                  <p className="text-gray-700 dark:text-gray-300">{a.text}</p>
                  <p className="mt-0.5 text-gray-400">{new Date(a.at).toLocaleTimeString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <LiveViewDrawer
        visitor={selectedVisitor}
        permissions={permissions}
        onClose={() => setSelectedVisitor(null)}
        onChanged={() => load(true)}
      />
    </div>
  );
}
