import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiCheck } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import TaskFormModal from "./TaskFormModal.jsx";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function TasksList() {
  const { user: me } = useAuth();
  const { showToast } = useToast();

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const canCreate = can(me?.role, PERMISSIONS.TASKS_CREATE) || me?.role === "SUPER_ADMIN";
  const canDelete = can(me?.role, PERMISSIONS.TASKS_DELETE) || me?.role === "SUPER_ADMIN";

  useEffect(() => {
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => setCompanies(res.data.companies || []))
      .catch(() => setCompanies([]));
  }, []);

  const load = (page = 1) => {
    setLoading(true);
    setError("");
    api
      .get("/tasks", {
        params: {
          page,
          companyId: companyId || undefined,
          status: status || undefined,
          priority: priority || undefined,
          assignee: assignee || undefined,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, status, priority, assignee]);

  const toggleComplete = async (task) => {
    try {
      await api.patch(`/tasks/${task._id}`, { status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" });
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  const removeTask = async () => {
    setBusy(true);
    try {
      await api.delete(`/tasks/${deleteTarget._id}`);
      showToast("Task deleted.");
      setDeleteTarget(null);
      load(pagination.page);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Internal work items you assign to teammates — separate from conversation assignment."
        action={
          canCreate && (
            <Button
              onClick={() => {
                setEditingTask(null);
                setShowForm(true);
              }}
            >
              <FiPlus /> New Task
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="w-48">
          <Select
            options={[{ value: "", label: "All Companies" }, ...companies.map((c) => ({ value: c.companyId, label: c.name }))]}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            options={[{ value: "", label: "All Assignees" }, { value: "me", label: "Assigned to Me" }, { value: "unassigned", label: "Unassigned" }]}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div className="w-40">
          <Select options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {loading && <SkeletonTable />}
        {!loading && error && <ErrorState message={error} onRetry={() => load(1)} />}
        {!loading && !error && tasks.length === 0 && <EmptyState title="No tasks found." />}

        {!loading && !error && tasks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium"></th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr
                    key={t._id}
                    className="cursor-pointer border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(t);
                        }}
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          t.status === "COMPLETED"
                            ? "border-success-500 bg-success-500 text-white"
                            : "border-gray-300 text-transparent hover:border-primary-400"
                        }`}
                        aria-label="Toggle complete"
                      >
                        <FiCheck className="h-3 w-3" />
                      </button>
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${t.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-100"}`}
                      onClick={() => {
                        setEditingTask(t);
                        setShowForm(true);
                      }}
                    >
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.companyId}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.assigneeId?.name || "Unassigned"}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(t);
                          }}
                          className="text-gray-400 hover:text-danger-500"
                          aria-label="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
        )}
      </div>

      <TaskFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => load(pagination.page)}
        companies={companies}
        task={editingTask}
        defaultCompanyId={companyId}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeTask}
      />
    </div>
  );
}
