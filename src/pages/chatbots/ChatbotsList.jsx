import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeAccessibleCompanies } from "../../services/realtime.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import Pagination from "../../components/ui/Pagination.jsx";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "LIVE", label: "Live" },
  { value: "DRAFT", label: "Draft" },
  { value: "PAUSED", label: "Paused" },
  { value: "OFFLINE", label: "Offline" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "updated", label: "Recently Updated" },
  { value: "alphabetical", label: "Name (A-Z)" },
  { value: "status", label: "Status" },
];

export default function ChatbotsList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [chatbots, setChatbots] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    api
      .get("/chatbots", { params: { page, search: search || undefined, status: status || undefined, sort } })
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
  }, [search, status, sort]);

  // Realtime (Section 4/12) — a chatbot created/updated/deleted
  // anywhere this admin has access to silently refreshes the current
  // page in place (no jump to page 1, no loading flash). This is what
  // makes "create a chatbot -> it appears in the list without a
  // manual refresh" actually true.
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  useEffect(() => {
    const unsubscribe = subscribeAccessibleCompanies((evt) => {
      if (evt.type === "chatbot.created" || evt.type === "chatbot.updated" || evt.type === "chatbot.deleted") {
        load(paginationRef.current.page, true);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/chatbots/${deleteTarget._id}`);
      showToast(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load(paginationRef.current.page);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  };

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

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-64">
          <Input
            placeholder="Search chatbots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select options={STATUS_FILTER_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div className="w-48">
          <Select options={SORT_OPTIONS} value={sort} onChange={(e) => setSort(e.target.value)} />
        </div>
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
                  <th className="px-4 py-3 font-medium"></th>
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
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(bot);
                        }}
                        className="text-gray-400 hover:text-danger-500"
                        aria-label="Delete chatbot"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Chatbot?"
        message={`"${deleteTarget?.name}" will be removed from Chatbots and taken offline immediately. Conversation history and visitor analytics are preserved; its Bot Builder flows and individual chatbot access grants will be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
