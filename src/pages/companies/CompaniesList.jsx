import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import CompanyFormModal from "./CompanyFormModal.jsx";

export default function CompaniesList() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = (page = 1) => {
    setLoading(true);
    setError("");
    api
      .get("/companies", { params: { page, search: search || undefined } })
      .then((res) => {
        setCompanies(res.data.companies);
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

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Manage organizations using Nuformly."
        action={
          me?.role === "SUPER_ADMIN" && (
            <Button onClick={() => setShowForm(true)}>
              <FiPlus /> Add Company
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {loading && <SkeletonTable />}
        {!loading && error && <ErrorState message={error} onRetry={() => load(1)} />}
        {!loading && !error && companies.length === 0 && (
          <EmptyState
            title="No companies yet."
            description="Create your first company to start managing chatbots."
          />
        )}

        {!loading && !error && companies.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Chatbots</th>
                  <th className="px-4 py-3 font-medium">Visitors</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.companyId}
                    onClick={() => navigate(`/companies/${c.companyId}`)}
                    className="cursor-pointer border-b border-gray-50 transition-colors duration-150 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.website || c.domain}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.chatbotCount}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.visitorCount}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status || (c.isActive ? "ACTIVE" : "INACTIVE")} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && companies.length > 0 && (
          <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
        )}
      </div>

      <CompanyFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => load(1)}
      />
    </div>
  );
}
