import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import BillingTabs from "./BillingTabs.jsx";
import BillingCompanyPicker from "../developer/DeveloperCompanyPicker.jsx";
import { useBillingCompany } from "./useBillingCompany.js";

export default function BillingSettingsPage() {
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useBillingCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/billing/settings", { params: { companyId } })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  return (
    <div>
      <PageHeader
        title="Billing Settings"
        description="Payment provider connection and billing configuration."
        action={<BillingCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <BillingTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonLine className="h-40 w-full max-w-xl" />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && data && (
        <div className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
            <span className="text-gray-500 dark:text-gray-400">Payment provider</span>
            <StatusBadge status={data.provider.status} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
            <span className="text-gray-500 dark:text-gray-400">Billing interval</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">{data.billingInterval}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5">
            <span className="text-gray-500 dark:text-gray-400">Subscription status</span>
            <StatusBadge status={data.status} />
          </div>
          {data.provider.status === "NOT_CONFIGURED" && (
            <p className="text-xs text-gray-400">
              No payment provider is connected on this platform. Once one is, checkout, invoices, and cancellation
              will work here — the underlying billing architecture already supports it without redesigning this
              page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
