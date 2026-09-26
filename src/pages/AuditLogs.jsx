import { useEffect, useState } from "react";
import { FiFileText } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { activityIconFor } from "../utils/activityIcon.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { SkeletonTable } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Pagination from "../components/ui/Pagination.jsx";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [companyId, setCompanyId] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (page = 1) => {
    setLoading(true);
    setError("");
    api
      .get("/audit-logs", {
        params: { page, companyId: companyId || undefined, action: action || undefined },
      })
      .then((res) => {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => setCompanies(res.data.companies))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => load(1), [companyId, action]);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track important administrative actions across Nuformly."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            options={[{ value: "", label: "All Companies" }, ...companies.map((c) => ({ value: c.companyId, label: c.name }))]}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
        </div>
        <div className="w-56">
          <Input
            placeholder="Filter by action (e.g. LOGIN)"
            value={action}
            onChange={(e) => setAction(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {loading && <SkeletonTable />}
        {!loading && error && <ErrorState message={error} onRetry={() => load(1)} />}
        {!loading && !error && logs.length === 0 && (
          <EmptyState icon={FiFileText} title="No audit activity yet." />
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const { icon: Icon, accent } = activityIconFor(log.action);
                  return (
                    <tr
                      key={log._id}
                      className="border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${accent}`}>
                            <Icon className="h-3 w-3" />
                          </span>
                          {log.action.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {log.user?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {log.resource}
                        {log.resourceId ? ` (${log.resourceId})` : ""}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {log.companyId || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
        )}
      </div>
    </div>
  );
}
