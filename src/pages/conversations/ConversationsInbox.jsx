import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeAccessibleCompanies, getRealtimeStatus, onRealtimeStatusChange } from "../../services/realtime.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import ConversationListPane from "./ConversationListPane.jsx";
import ConversationDetailPane from "./ConversationDetailPane.jsx";

// Realtime (Phase 15) turns this from the primary update mechanism
// into a safety-net fallback — kept unchanged rather than lengthened,
// so a missed/dropped socket event (Section 30 — realtime is an
// optimization, never the source of truth) is still caught within the
// same worst-case window as before.
const LIST_REFRESH_MS = 8000;

const RELEVANT_EVENT_TYPES = new Set([
  "conversation.created",
  "conversation.updated",
  "conversation.assigned",
  "conversation.closed",
  "message.created",
]);

export default function ConversationsInbox() {
  const navigate = useNavigate();
  const params = useParams();

  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", mode: "", assigned: "any", search: "", page: 1 });

  const pollRef = useRef(null);
  const selected = params.companyId && params.visitorId ? { companyId: params.companyId, visitorId: params.visitorId } : null;

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      api
        .get("/conversations", {
          params: {
            page: filters.page,
            status: filters.status || undefined,
            mode: filters.mode || undefined,
            assigned: filters.assigned !== "any" ? filters.assigned : undefined,
            search: filters.search || undefined,
          },
        })
        .then((res) => {
          setConversations(res.data.conversations);
          setPagination(res.data.pagination);
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
  }, [filters.status, filters.mode, filters.assigned, filters.search, filters.page]);

  useEffect(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, LIST_REFRESH_MS);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // Realtime push — an immediate silent refresh on top of the poll
  // above, not instead of it.
  useEffect(() => {
    const unsubscribe = subscribeAccessibleCompanies((evt) => {
      if (RELEVANT_EVENT_TYPES.has(evt.type)) load(true);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [realtimeStatus, setRealtimeStatus] = useState(getRealtimeStatus());
  useEffect(() => onRealtimeStatusChange(setRealtimeStatus), []);

  return (
    // Phase 23 — was h-[calc(100vh-4rem)], a manual "viewport minus
    // header" calc that assumed it was the one owning leftover viewport
    // space. Now that AdminLayout's <main> is itself a properly bounded
    // overflow-y-auto container (not the growing document), this page
    // just fills that real, already-correct ancestor height instead of
    // re-deriving (and, now, over-shooting past main's own padding) a
    // raw viewport calc.
    <div className="flex h-full flex-col">
      <div className="px-1 pb-3">
        <PageHeader
          title="Conversations"
          description={
            realtimeStatus === "live"
              ? "Live conversations across chatbots you have access to. Updates in real time."
              : "Live conversations across chatbots you have access to. Refreshes automatically every few seconds while realtime reconnects."
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <ConversationListPane
          conversations={conversations}
          pagination={pagination}
          loading={loading}
          error={error}
          onRetry={() => load(false)}
          filters={filters}
          onFiltersChange={setFilters}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          selectedKey={selected ? `${selected.companyId}::${selected.visitorId}` : null}
          onSelect={(c) => navigate(`/conversations/${c.companyId}/${c.visitorId}`)}
          hiddenOnMobile={Boolean(selected)}
        />
        <ConversationDetailPane
          selected={selected}
          onBack={() => navigate("/conversations")}
          onChanged={() => load(true)}
        />
      </div>
    </div>
  );
}
