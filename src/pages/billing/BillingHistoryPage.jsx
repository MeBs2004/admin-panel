import { useEffect, useState } from "react";
import { FiFileText } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import BillingTabs from "./BillingTabs.jsx";
import BillingCompanyPicker from "../developer/DeveloperCompanyPicker.jsx";
import { useBillingCompany } from "./useBillingCompany.js";

export default function BillingHistoryPage() {
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useBillingCompany();
  const [invoices, setInvoices] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/billing/invoices", { params: { companyId } })
      .then((res) => {
        setInvoices(res.data.invoices);
        setProvider(res.data.provider);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  return (
    <div>
      <PageHeader
        title="Billing History"
        description="Real invoices issued by a connected payment provider."
        action={<BillingCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />}
      />

      <div className="mb-4">
        <BillingTabs />
      </div>

      {(loading || loadingCompanies) && <SkeletonTable />}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !companyId && <EmptyState title="No company selected." />}

      {!loading && !error && invoices && invoices.length === 0 && (
        <EmptyState
          icon={FiFileText}
          title="No billing history yet."
          description={
            provider?.status === "NOT_CONFIGURED"
              ? "No payment provider is connected — invoices will appear here once one is."
              : "No invoices have been issued yet."
          }
        />
      )}

      {!loading && !error && invoices && invoices.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Issued</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-gray-50 dark:border-white/5">
                  <td className="px-4 py-3">
                    {inv.hostedInvoiceUrl ? (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {inv.number || inv.providerInvoiceId}
                      </a>
                    ) : (
                      inv.number || inv.providerInvoiceId
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                    {inv.currency} {inv.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
