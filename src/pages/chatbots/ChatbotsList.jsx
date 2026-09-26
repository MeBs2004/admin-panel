import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeAccessibleCompanies } from "../../services/realtime.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import Pagination from "../../components/ui/Pagination.jsx";

export default function ChatbotsList() {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    api
      .get("/chatbots", { params: { page, search: search || undefined } })
      .then((res) => {
        setChatbots(res.data.chatbots);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(() => load(1), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Realtime (Section 4/12) — a chatbot created/updated anywhere this
  // admin has access to silently refreshes the current page in place
  // (no jump to page 1, no loading flash). This is what makes "create
  // a chatbot -> it appears in the list without a manual refresh"
  // actually true.
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  useEffect(() => {
    const unsubscribe = subscribeAccessibleCompanies((evt) => {
      if (evt.type === "chatbot.created" || evt.type === "chatbot.updated") {
        load(paginationRef.current.page, true);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Chatbots"
        description="Manage chatbots across Nuformly."
        action={
          <Button onClick={() => navigate("/chatbots/new")}>
            <FiPlus /> Add Chatbot
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search chatbots..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {loading && <SkeletonTable />}
        {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
        {!loading && !error && chatbots.length === 0 && (
          <EmptyState
            title="No chatbots yet."
            description="Create your first chatbot to start engaging visitors."
            action={
              <Button onClick={() => navigate("/chatbots/new")}>
                <FiPlus /> Create Chatbot
              </Button>
            }
          />
        )}

        {!loading && !error && chatbots.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Bot Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {chatbots.map((bot) => (
                  <tr
                    key={bot._id}
                    onClick={() => navigate(`/chatbots/${bot._id}`)}
                    className="cursor-pointer border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {bot.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {bot.companyName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={bot.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {bot.model}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(bot.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && chatbots.length > 0 && (
          <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
        )}
      </div>
    </div>
  );
}
