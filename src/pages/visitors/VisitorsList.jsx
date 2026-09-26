import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeAccessibleCompanies } from "../../services/realtime.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import Pagination from "../../components/ui/Pagination.jsx";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "new", label: "New" },
  { value: "returning", label: "Returning" },
];

export default function VisitorsList() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [chatbotId, setChatbotId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/chatbots", { params: { limit: 100 } })
      .then((res) => setChatbots(res.data.chatbots || []))
      .catch(() => setChatbots([]));
  }, []);

  const load = (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    api
      .get("/visitors", {
        params: {
          page,
          search: search || undefined,
          status: status || undefined,
          chatbotId: chatbotId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      })
      .then((res) => {
        setVisitors(res.data.visitors);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, chatbotId, startDate, endDate]);

  // Realtime — debounced (Section 30/14): a burst of visitor.created/
  // updated events (e.g. many visitors arriving close together)
  // coalesces into a single silent refetch of the CURRENT page,
  // rather than one request per event.
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;
  const debounceRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeAccessibleCompanies((evt) => {
      if (evt.type !== "visitor.created" && evt.type !== "visitor.updated") return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => load(paginationRef.current.page, true), 600);
    });
    return () => {
      clearTimeout(debounceRef.current);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Visitors"
        description="Chatbot end-users across every company and chatbot you can access."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="max-w-xs flex-1">
          <Input
            placeholder="Search visitor, email, last message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Select
          className="w-48"
          value={chatbotId}
          onChange={(e) => setChatbotId(e.target.value)}
          options={[{ value: "", label: "All Chatbots" }, ...chatbots.map((c) => ({ value: c._id, label: c.name }))]}
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {loading && <SkeletonTable />}
        {!loading && error && <ErrorState message={error} onRetry={() => load(1)} />}
        {!loading && !error && visitors.length === 0 && (
          <EmptyState title="No visitors match these filters." description="Try widening the date range or clearing filters." />
        )}

        {!loading && !error && visitors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Sessions</th>
                  <th className="px-4 py-3 font-medium">Messages</th>
                  <th className="px-4 py-3 font-medium">Last Seen</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr
                    key={v._id}
                    onClick={() => navigate(`/visitors/${v._id}`)}
                    className="cursor-pointer border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {v.name || v.email || v.visitorId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.companyName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.totalVisits}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.totalMessages}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(v.lastVisit).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={v.isActive ? "ACTIVE" : "INACTIVE"} />
                        <StatusBadge status={v.isReturning ? "RETURNING" : "NEW"} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && visitors.length > 0 && (
          <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
        )}
      </div>
    </div>
  );
}
