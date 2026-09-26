import { useEffect, useState } from "react";
import { FiActivity, FiCheckCircle, FiXCircle, FiClock, FiKey, FiSend } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Select from "../../components/ui/Select.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import AreaChart from "../../components/ui/AreaChart.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import DeveloperTabs from "./DeveloperTabs.jsx";
import DeveloperCompanyPicker from "./DeveloperCompanyPicker.jsx";
import { useDeveloperCompany } from "./useDeveloperCompany.js";

const RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export default function UsagePage() {
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useDeveloperCompany();
  const [range, setRange] = useState("7d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/developer/usage", { params: { companyId, range } })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId, range]);

  const chartData = (data?.requestsPerDay || []).map((d) => ({ label: d._id, value: d.count }));

  return (
    <div>
      <PageHeader
        title="Usage"
        description="Real request and delivery telemetry — recorded per API call, retained 30 days."
        action={
          <div className="flex items-center gap-2">
            <DeveloperCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />
            <div className="w-44">
              <Select options={RANGE_OPTIONS} value={range} onChange={(e) => setRange(e.target.value)} />
            </div>
          </div>
        }
      />

      <div className="mb-4">
        <DeveloperTabs />
      </div>

      {(loading || loadingCompanies) && (
        <div className="space-y-3">
          <SkeletonLine className="h-24 w-full" />
          <SkeletonLine className="h-48 w-full" />
        </div>
      )}
      {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !loadingCompanies && !error && !companyId && <EmptyState icon={FiActivity} title="No company selected." />}

      {!loading && !error && data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Requests" value={data.metrics.requests} icon={FiActivity} accent="primary" index={0} />
            <StatCard label="Successful" value={data.metrics.successfulRequests} icon={FiCheckCircle} accent="success" index={1} />
            <StatCard label="Failed" value={data.metrics.failedRequests} icon={FiXCircle} accent="warning" index={2} />
            <StatCard label="Rate Limited" value={data.metrics.rateLimitedRequests} icon={FiClock} accent="warning" index={3} />
            <StatCard label="Active API Keys" value={data.metrics.activeApiKeys} icon={FiKey} accent="info" index={4} />
            <StatCard label="Webhook Deliveries" value={data.metrics.webhookDeliveries} icon={FiSend} accent="info" index={5} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Requests per day</h3>
            {chartData.length > 0 ? (
              <AreaChart data={chartData} />
            ) : (
              <p className="text-sm text-gray-400">No API requests recorded in this range yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
