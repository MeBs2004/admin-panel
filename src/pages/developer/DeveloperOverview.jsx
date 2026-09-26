import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiKey, FiActivity, FiSend, FiXCircle } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import DeveloperTabs from "./DeveloperTabs.jsx";
import DeveloperCompanyPicker from "./DeveloperCompanyPicker.jsx";
import { useDeveloperCompany } from "./useDeveloperCompany.js";

const QUICK_START = [
  { label: "Create an API key", to: "/developer/api-keys" },
  { label: "Choose its scopes and chatbot access", to: "/developer/api-keys" },
  { label: "Make your first API request", to: "/developer/docs" },
  { label: "Configure a webhook", to: "/developer/webhooks" },
  { label: "Read the API documentation", to: "/developer/docs" },
];

export default function DeveloperOverview() {
  const navigate = useNavigate();
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useDeveloperCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/developer/usage", { params: { companyId, range: "7d" } })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  return (
    <div>
      <PageHeader
        title="Developer"
        description="Build on Nuformly — API keys, webhooks, and documentation for external integrations."
        action={<DeveloperCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <DeveloperTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonLine className="h-24 w-full" />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && data && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Active API Keys" value={data.metrics.activeApiKeys} icon={FiKey} accent="primary" index={0} />
          <StatCard label="API Requests (7d)" value={data.metrics.requests} icon={FiActivity} accent="info" index={1} />
          <StatCard label="Webhook Deliveries (7d)" value={data.metrics.webhookDeliveries} icon={FiSend} accent="success" index={2} />
          <StatCard label="Webhook Failures (7d)" value={data.metrics.webhookFailures} icon={FiXCircle} accent="warning" index={3} />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Quick Start</h3>
        <ol className="space-y-2">
          {QUICK_START.map((step, i) => (
            <li key={step.label}>
              <button
                onClick={() => navigate(step.to)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                  {i + 1}
                </span>
                {step.label}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
