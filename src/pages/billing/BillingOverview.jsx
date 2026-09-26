import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import BillingTabs from "./BillingTabs.jsx";
import { useBillingCompany } from "./useBillingCompany.js";
import BillingCompanyPicker from "../developer/DeveloperCompanyPicker.jsx";

export default function BillingOverview() {
  const navigate = useNavigate();
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useBillingCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/billing", { params: { companyId } })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  return (
    <div>
      <PageHeader
        title="Billing & Usage"
        description="Your plan, billing status, and current usage period."
        action={<BillingCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <BillingTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonLine className="h-40 w-full" />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Plan</p>
              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{data.plan.name}</p>
              <Button variant="secondary" className="mt-3" onClick={() => navigate("/billing/plans")}>
                Change Plan
              </Button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Billing Status</p>
              <div className="mt-2">
                <StatusBadge status={data.account.status} />
              </div>
              <p className="mt-2 text-xs text-gray-400">{data.account.billingInterval}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Period</p>
              <p className="mt-2 text-sm text-gray-800 dark:text-gray-100">
                {new Date(data.account.currentPeriodStart).toLocaleDateString()} –{" "}
                {new Date(data.account.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Payment Provider</p>
              <div className="mt-2">
                <StatusBadge status={data.provider.status} />
              </div>
            </div>
          </div>

          {data.provider.status === "NOT_CONFIGURED" && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-sm text-gray-500 dark:bg-white/[0.02] dark:border-[var(--border)] dark:text-gray-400">
              No payment provider is connected on this platform yet. The Free plan works fully without one — paid
              plans will be available once billing is connected. No fake charges, invoices, or renewal dates are
              shown while that's the case.
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Usage this period</h3>
              <Button variant="secondary" onClick={() => navigate("/billing/usage")}>
                View Full Usage
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
