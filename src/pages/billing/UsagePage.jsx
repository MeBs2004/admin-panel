import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import BillingTabs from "./BillingTabs.jsx";
import BillingCompanyPicker from "../developer/DeveloperCompanyPicker.jsx";
import { useBillingCompany } from "./useBillingCompany.js";
import UsageBar from "./UsageBar.jsx";

const GROUPS = [
  { title: "Plan-limited", metrics: ["visitors", "conversations", "aiRequests", "chatbots", "members", "apiKeys", "developerWebhooks"] },
  { title: "Additional telemetry", metrics: ["messages", "apiRequests", "webhookDeliveries", "webhookFailures", "aiTokens"] },
];

export default function UsagePage() {
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useBillingCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/billing/usage", { params: { companyId } })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  return (
    <div>
      <PageHeader
        title="Usage"
        description="Real consumption for the current billing period — every number below comes from real records."
        action={<BillingCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <BillingTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonLine className="h-64 w-full" />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && data && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Period: {new Date(data.period.start).toLocaleDateString()} – {new Date(data.period.end).toLocaleDateString()}{" "}
            ({data.planId} plan)
          </p>

          {GROUPS.map((group) => (
            <div
              key={group.title}
              className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]"
            >
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{group.title}</h3>
              {group.metrics.map((metric) => (
                <UsageBar key={metric} metric={metric} data={data.usage[metric]} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
