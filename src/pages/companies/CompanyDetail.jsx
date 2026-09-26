import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import CompanyConfigTab from "./CompanyConfigTab.jsx";
import CompanyKnowledgeTab from "./CompanyKnowledgeTab.jsx";
import CompanyIntegrationsTab from "./CompanyIntegrationsTab.jsx";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TRIAL", label: "Trial" },
];

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/companies/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      await api.post(`/companies/${id}/status`, { status });
      showToast(`Company status set to ${status}.`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-32 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { company, chatbots, stats } = data;

  return (
    <div>
      <PageHeader
        title={company.name}
        description={company.website || company.domain}
        breadcrumbs={[{ label: "Companies", to: "/companies" }, { label: company.name }]}
        action={
          <Button variant="secondary" onClick={() => navigate("/companies")}>
            Back to Companies
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={<StatusBadge status={company.status} />} />
        <StatCard label="Chatbots" value={chatbots.length} />
        <StatCard label="Visitors" value={stats.visitorCount} />
        <StatCard label="Plan" value={company.plan || "—"} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <Tabs
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "chatbots", label: "Chatbots" },
            { value: "configuration", label: "Configuration" },
            { value: "knowledge", label: "Knowledge Base" },
            { value: "integrations", label: "Integrations" },
            { value: "settings", label: "Settings" },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="p-5">
          {tab === "overview" && (
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Company ID</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {company.companyId}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Domain</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {company.domain}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Contact Email</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {company.contact?.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Contact Phone</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {company.contact?.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">AI Provider</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {company.ai?.provider} / {company.ai?.model}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(company.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          )}

          {tab === "chatbots" &&
            (chatbots.length === 0 ? (
              <EmptyState
                title="No chatbots available."
                description="Chatbots for this company will appear here once created."
              />
            ) : (
              <ul className="space-y-2">
                {chatbots.map((bot) => (
                  <li
                    key={bot._id}
                    onClick={() => navigate(`/chatbots/${bot._id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <span className="text-gray-800 dark:text-gray-100">{bot.name}</span>
                    <StatusBadge status={bot.status} />
                  </li>
                ))}
              </ul>
            ))}

          {tab === "configuration" && (
            <CompanyConfigTab company={company} onSaved={load} />
          )}

          {tab === "knowledge" && <CompanyKnowledgeTab companyId={company.companyId} />}

          {tab === "integrations" && (
            <CompanyIntegrationsTab company={company} onSaved={load} />
          )}

          {tab === "settings" && (
            <div className="max-w-xs">
              {me?.role === "SUPER_ADMIN" ? (
                <Select
                  label="Company Status"
                  options={STATUS_OPTIONS}
                  value={company.status}
                  disabled={busy}
                  onChange={(e) => changeStatus(e.target.value)}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Only Super Admins can change company status.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
