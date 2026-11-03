import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FiEye, FiMessageSquare, FiClipboard, FiFileText, FiUsers, FiUserPlus, FiTrendingUp, FiDownload,
} from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import ChartCard, { LegendDot } from "../../components/charts/ChartCard.jsx";
import TrendChart from "../../components/charts/TrendChart.jsx";
import BarsChart from "../../components/charts/BarsChart.jsx";
import DonutChart from "../../components/charts/DonutChart.jsx";
import RadialGauge from "../../components/charts/RadialGauge.jsx";
import { CHART_COLORS, SERIES_PALETTE } from "../../components/charts/chartTheme.js";
import { fillDailySeries } from "../../utils/chartData.js";
import { SkeletonCards, SkeletonLine } from "../../components/ui/Skeleton.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

// ======================================================
// PHASE 6 — Energy Analytics Dashboard. Same structure as the general
// Reports.jsx page (date-range selector, StatCard/ChartCard grid, the
// shared recharts-based chart components) and the same "real
// aggregation, not estimates" ethos — every number on this page comes
// straight from GET /chatbots/:id/energy/analytics/* (see
// energyAnalytics.controller.js / energyAnalytics.service.js). No new
// chart library, no client-side math beyond date-range-preset
// conversion and dense-filling sparse daily series for the charts.
// ======================================================

const RANGE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "thisMonth", label: "This month" },
  { value: "previousMonth", label: "Previous month" },
  { value: "custom", label: "Custom range" },
];

function toDateInput(d) {
  return d.toISOString().slice(0, 10);
}

/** Resolves a preset into either {days} or {startDate,endDate} for the API — matches resolveDateRange's own contract (inclusive start, exclusive-next-day end via endDate). */
function resolvePresetParams(preset, customStart, customEnd) {
  const now = new Date();
  if (preset === "today") {
    const d = toDateInput(now);
    return { startDate: d, endDate: d };
  }
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const d = toDateInput(y);
    return { startDate: d, endDate: d };
  }
  if (preset === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toDateInput(start), endDate: toDateInput(now) };
  }
  if (preset === "previousMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: toDateInput(start), endDate: toDateInput(end) };
  }
  if (preset === "custom") {
    if (!customStart || !customEnd) return null;
    return { startDate: customStart, endDate: customEnd };
  }
  return { days: preset };
}

function metricDisplay(value, suffix = "") {
  return value === null || value === undefined ? "Not enough data" : `${value}${suffix}`;
}

const MODULES = [
  { value: "overview", label: "Overview" },
  { value: "visitors", label: "Visitors" },
  { value: "demand", label: "Fuel & Project Demand" },
  { value: "funnel", label: "Journey Funnel" },
  { value: "questions", label: "Questions" },
  { value: "solutions", label: "BOM & Solutions" },
  { value: "suppliers", label: "Supplier Matching" },
  { value: "enquiries", label: "RFQs" },
  { value: "ai-handoff", label: "AI & Handoff" },
];

export default function EnergyAnalytics() {
  const { id: chatbotId } = useParams();
  const [tab, setTab] = useState("overview");
  const [preset, setPreset] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [exporting, setExporting] = useState(false);

  const params = useMemo(() => resolvePresetParams(preset, customStart, customEnd), [preset, customStart, customEnd]);

  const exportReport = async (format) => {
    if (!params) return;
    setExporting(true);
    try {
      const res = await api.get(`/chatbots/${chatbotId}/energy/analytics/export`, { params: { ...params, format }, responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `energy-analytics.${format === "csv" ? "csv" : "xlsx"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // A failed export isn't fatal to the dashboard — a silent no-op here is enough; the button itself provides the only feedback needed for a background file download attempt.
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Energy Analytics"
        description="Real metrics computed from this chatbot's Energy journey — visitors, demand, funnel, BOMs, suppliers and RFQs."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <Select options={RANGE_PRESETS} value={preset} onChange={(e) => setPreset(e.target.value)} />
            </div>
            {preset === "custom" && (
              <>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100" />
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100" />
              </>
            )}
            <Button variant="secondary" onClick={() => exportReport("csv")} loading={exporting}><FiDownload className="h-4 w-4" /> CSV</Button>
            <Button variant="secondary" onClick={() => exportReport("xlsx")} loading={exporting}><FiDownload className="h-4 w-4" /> Excel</Button>
          </div>
        }
      />

      <div className="animate-fade-in-up panel-card rounded-2xl border border-gray-200 bg-white shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <Tabs tabs={MODULES} active={tab} onChange={setTab} />
        <div className="p-5">
          {!params ? (
            <EmptyState title="Pick a custom date range" description="Choose both a start and end date to load this report." />
          ) : (
            <>
              {tab === "overview" && <OverviewModule chatbotId={chatbotId} params={params} />}
              {tab === "visitors" && <VisitorsModule chatbotId={chatbotId} params={params} />}
              {tab === "demand" && <DemandModule chatbotId={chatbotId} params={params} />}
              {tab === "funnel" && <FunnelModule chatbotId={chatbotId} params={params} />}
              {tab === "questions" && <QuestionsModule chatbotId={chatbotId} params={params} />}
              {tab === "solutions" && <SolutionsModule chatbotId={chatbotId} params={params} />}
              {tab === "suppliers" && <SuppliersModule chatbotId={chatbotId} params={params} />}
              {tab === "enquiries" && <EnquiriesModule chatbotId={chatbotId} params={params} />}
              {tab === "ai-handoff" && <AiHandoffModule chatbotId={chatbotId} params={params} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- shared data-loading hook ----------

function useAnalytics(chatbotId, endpoint, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${chatbotId}/energy/analytics/${endpoint}`, { params })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [chatbotId, endpoint, JSON.stringify(params)]);

  return { data, loading, error, reload: load };
}

function TrackedSinceNote({ trackedSince }) {
  if (trackedSince === undefined) return null;
  if (!trackedSince) {
    return <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">No journey events have been tracked yet in this range. This dashboard's event-based metrics are available from the moment Phase 6 tracking went live — not retroactively.</p>;
  }
  return <p className="mb-4 text-xs text-gray-400">Event-based metrics tracked since {new Date(trackedSince).toLocaleDateString()}.</p>;
}

// ---------- MODULE 1: Overview ----------

function OverviewModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "overview", params);
  if (loading) return <SkeletonCards count={8} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { metrics, deltas, trackedSince } = data;

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard index={0} label="Unique Visitors" value={metrics.uniqueVisitors} icon={FiEye} accent="warning" delta={deltas.uniqueVisitors} />
        <StatCard index={1} label="Conversations" value={metrics.conversations} icon={FiMessageSquare} accent="info" delta={deltas.conversations} />
        <StatCard index={2} label="Journey Sessions" value={metrics.journeySessions} icon={FiTrendingUp} accent="violet" delta={deltas.journeySessions} />
        <StatCard index={3} label="Enquiries / RFQs" value={metrics.enquiries} icon={FiClipboard} accent="primary" delta={deltas.enquiries} />
        <StatCard index={4} label="BOMs Generated" value={metrics.solutionsGenerated} icon={FiFileText} accent="success" delta={deltas.solutionsGenerated} />
        <StatCard index={5} label="Supplier Matches" value={metrics.supplierMatches} icon={FiUsers} accent="success" delta={deltas.supplierMatches} />
        <StatCard index={6} label="Handoff Requests" value={metrics.handoffRequests} icon={FiUserPlus} accent="rose" delta={deltas.handoffRequests} />
        <StatCard index={7} label="RFQ Conversion Rate" value={metricDisplay(metrics.rfqConversionRate, "%")} icon={FiTrendingUp} accent="neutral" hint="Enquiries ÷ journey sessions started in range" />
      </div>
    </div>
  );
}

// ---------- MODULE 2: Visitors ----------

function VisitorsModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "visitors", params);
  if (loading) return <SkeletonCards count={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { metrics, trends, trackedSince, range } = data;
  const trend = fillDailySeries(trends.sessionsPerDay, range.since, range.days).map((d) => ({ label: d.label, sessions: d.value }));

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard index={0} label="Unique Visitors" value={metrics.uniqueVisitors} icon={FiEye} accent="warning" />
        <StatCard index={1} label="New Visitors" value={metrics.newVisitors} icon={FiUserPlus} accent="success" />
        <StatCard index={2} label="Journey Sessions" value={metrics.journeySessions} icon={FiTrendingUp} accent="violet" />
        <StatCard index={3} label="Avg. Journey Completion" value={metricDisplay(metrics.avgJourneyCompletionMinutes, " min")} icon={FiClipboard} accent="info" hint="Only sessions that both started and reached confirmation" />
      </div>
      {trend.every((r) => r.sessions === 0) ? (
        <EmptyState title="No journey sessions in this range" />
      ) : (
        <ChartCard title="Journey sessions by day">
          <BarsChart data={trend} series={[{ key: "sessions", name: "Sessions", color: CHART_COLORS.indigo }]} />
        </ChartCard>
      )}
    </div>
  );
}

// ---------- MODULE 3 & 4: Fuel & project-type demand ----------

function DemandModule({ chatbotId, params }) {
  const fuels = useAnalytics(chatbotId, "fuels", params);
  const projectTypes = useAnalytics(chatbotId, "project-types", params);
  if (fuels.loading || projectTypes.loading) return <SkeletonCards count={4} />;
  if (fuels.error) return <ErrorState message={fuels.error} onRetry={fuels.reload} />;
  if (projectTypes.error) return <ErrorState message={projectTypes.error} onRetry={projectTypes.reload} />;

  return (
    <div className="space-y-6">
      <TrackedSinceNote trackedSince={fuels.data.trackedSince} />
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Fuel demand</h3>
        {fuels.data.breakdown.length === 0 ? (
          <EmptyState title="No fuel selections in this range" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Selections by fuel" subtitle={fuels.data.metrics.mostRequested ? `Most requested: ${fuels.data.metrics.mostRequested}` : undefined}>
              <BarsChart data={fuels.data.breakdown.map((f) => ({ label: f.label, sessions: f.sessions }))} series={[{ key: "sessions", name: "Sessions", color: CHART_COLORS.amber }]} />
            </ChartCard>
            <ChartCard title="Share of selections">
              <DonutChart centerLabel="Selections" data={fuels.data.breakdown.map((f, i) => ({ name: f.label, value: f.sessions, color: SERIES_PALETTE[i % SERIES_PALETTE.length] }))} />
            </ChartCard>
          </div>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Project type demand</h3>
        {projectTypes.data.breakdown.length === 0 ? (
          <EmptyState title="No project type selections in this range" />
        ) : (
          <ChartCard title="Selections by project type" subtitle={projectTypes.data.metrics.mostRequested ? `Most requested: ${projectTypes.data.metrics.mostRequested}` : undefined}>
            <BarsChart data={projectTypes.data.breakdown.map((p) => ({ label: p.label, sessions: p.sessions }))} series={[{ key: "sessions", name: "Sessions", color: CHART_COLORS.sky }]} />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

// ---------- MODULE 5: Journey funnel ----------

function FunnelModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "funnel", params);
  if (loading) return <SkeletonCards count={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { steps, overall, trackedSince } = data;
  const maxSessions = Math.max(1, ...steps.map((s) => s.sessions));

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <ChartCard title="Journey completion rate" subtitle="Confirmation ÷ journey started">
          <RadialGauge value={overall.journeyCompletionRate} color={CHART_COLORS.emerald} />
        </ChartCard>
        <ChartCard title="RFQ conversion rate" subtitle="RFQ submitted ÷ journey started">
          <RadialGauge value={overall.rfqConversionRate} color={CHART_COLORS.sky} />
        </ChartCard>
      </div>
      {steps.every((s) => s.sessions === 0) ? (
        <EmptyState title="No journey activity in this range" />
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-3">
              <span className="w-56 shrink-0 text-xs text-gray-500 dark:text-gray-400">{step.label}</span>
              <div className="h-7 flex-1 rounded-lg bg-gray-100 dark:bg-white/5">
                <div className="flex h-7 items-center rounded-lg px-2 text-xs font-medium text-white transition-all" style={{ width: `${(step.sessions / maxSessions) * 100}%`, background: SERIES_PALETTE[i % SERIES_PALETTE.length], minWidth: step.sessions > 0 ? "2.5rem" : 0 }}>
                  {step.sessions > 0 && step.sessions}
                </div>
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-gray-400">{step.conversionFromPrevious != null ? `${step.conversionFromPrevious}%` : "—"}</span>
              {i > 0 && step.dropOffFromPrevious > 0 && <span className="w-28 shrink-0 text-right text-xs text-rose-500">−{step.dropOffFromPrevious} drop-off</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- MODULE 6: Questions ----------

function QuestionsModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "questions", params);
  if (loading) return <SkeletonLine className="h-48 w-full" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { questions, trackedSince } = data;

  if (questions.length === 0) return (<><TrackedSinceNote trackedSince={trackedSince} /><EmptyState title="No question activity in this range" /></>);

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <tr><th className="px-3 py-2">Question</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Displayed</th><th className="px-3 py-2">Answered</th><th className="px-3 py-2">Completion</th><th className="px-3 py-2">&quot;I don&apos;t know&quot;</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {questions.map((q) => (
              <tr key={q.questionId}>
                <td className="px-3 py-2">{q.label}{q.required === false && <span className="ml-1.5 text-xs text-gray-400">(optional)</span>}</td>
                <td className="px-3 py-2 text-xs text-gray-400">{q.type || "—"}</td>
                <td className="px-3 py-2">{q.displayed}</td>
                <td className="px-3 py-2">{q.answered}</td>
                <td className="px-3 py-2">{metricDisplay(q.completionRate, "%")}</td>
                <td className="px-3 py-2">{q.unknownSelections}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- MODULE 7: BOM / solutions ----------

function SolutionsModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "solutions", params);
  if (loading) return <SkeletonCards count={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { metrics, mostGenerated, byFuel, trackedSince } = data;

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard index={0} label="Generated" value={metrics.generated} icon={FiFileText} accent="success" />
        <StatCard index={1} label="Failed" value={metrics.failed} icon={FiFileText} accent="rose" />
        <StatCard index={2} label="Needs Engineering Review" value={metrics.requiresEngineeringReview} icon={FiFileText} accent="warning" />
        <StatCard index={3} label="Success Rate" value={metricDisplay(metrics.successRate, "%")} icon={FiTrendingUp} accent="primary" />
      </div>
      <p className="mb-4 text-xs text-gray-400">Output is always a structured BOM — the six configurable output-type labels currently share the same generation logic; this is not a priced quotation.</p>
      {mostGenerated.length === 0 && byFuel.length === 0 ? (
        <EmptyState title="No solutions generated in this range" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {mostGenerated.length > 0 && (
            <ChartCard title="Most generated templates">
              <BarsChart data={mostGenerated.map((t) => ({ label: t.name, count: t.count }))} series={[{ key: "count", name: "Generations", color: CHART_COLORS.violet }]} />
            </ChartCard>
          )}
          {byFuel.length > 0 && (
            <ChartCard title="Generations by fuel">
              <DonutChart centerLabel="Generated" data={byFuel.map((f, i) => ({ name: f.fuelKey, value: f.count, color: SERIES_PALETTE[i % SERIES_PALETTE.length] }))} />
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- MODULE 8: Supplier matching ----------

function SuppliersModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "suppliers", params);
  if (loading) return <SkeletonCards count={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { metrics, byFuel, trackedSince } = data;

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard index={0} label="Requested" value={metrics.requested} icon={FiUsers} accent="info" />
        <StatCard index={1} label="Successful Matches" value={metrics.successful} icon={FiUsers} accent="success" />
        <StatCard index={2} label="No Match Found" value={metrics.noMatch} icon={FiUsers} accent="rose" />
        <StatCard index={3} label="Match Success Rate" value={metricDisplay(metrics.successRate, "%")} icon={FiTrendingUp} accent="primary" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard index={4} label="Total Matched Suppliers" value={metrics.totalMatchedSuppliers} icon={FiUsers} accent="success" />
        <StatCard index={5} label="Unmatched Equipment Items" value={metrics.totalUnmatchedEquipment} icon={FiUsers} accent="warning" />
      </div>
      {byFuel.length === 0 ? (
        <EmptyState title="No supplier matching activity in this range" />
      ) : (
        <ChartCard title="Match success rate by fuel">
          <BarsChart data={byFuel.map((f) => ({ label: f.fuelKey, successRate: f.successRate || 0 }))} series={[{ key: "successRate", name: "Success rate %", color: CHART_COLORS.teal }]} />
        </ChartCard>
      )}
    </div>
  );
}

// ---------- MODULE 9: RFQ / enquiries ----------

const STATUS_LABELS = { new: "New", under_review: "Under review", supplier_contacted: "Supplier contacted", quotation_in_progress: "Quotation in progress", quotation_sent: "Quotation sent", won: "Won", lost: "Lost", closed: "Closed" };

function EnquiriesModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "enquiries", params);
  if (loading) return <SkeletonCards count={4} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { metrics, byFuel, byLocation, recent } = data;

  const statusBreakdown = Object.entries(STATUS_LABELS).map(([key, label], i) => ({ name: label, value: metrics[{ new: "new", under_review: "underReview", supplier_contacted: "supplierContacted", quotation_in_progress: "quotationInProgress", quotation_sent: "quotationSent", won: "won", lost: "lost", closed: "closed" }[key]], color: SERIES_PALETTE[i % SERIES_PALETTE.length] }));

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard index={0} label="Total RFQs" value={metrics.total} icon={FiClipboard} accent="primary" />
        <StatCard index={1} label="New" value={metrics.new} icon={FiClipboard} accent="info" />
        <StatCard index={2} label="Won" value={metrics.won} icon={FiClipboard} accent="success" />
        <StatCard index={3} label="Avg. Processing Time" value={metricDisplay(metrics.avgProcessingDays, " days")} icon={FiClipboard} accent="neutral" hint="Submission to won/lost/closed" />
      </div>

      {metrics.total === 0 ? (
        <EmptyState title="No RFQs submitted in this range" />
      ) : (
        <>
          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Status breakdown">
              <DonutChart centerLabel="RFQs" data={statusBreakdown} />
            </ChartCard>
            {byFuel.length > 0 && (
              <ChartCard title="RFQs by fuel">
                <BarsChart data={byFuel.map((f) => ({ label: f.fuelKey, count: f.count }))} series={[{ key: "count", name: "RFQs", color: CHART_COLORS.amber }]} />
              </ChartCard>
            )}
          </div>
          {byLocation.length > 0 && (
            <ChartCard className="mb-4" title="RFQs by location" subtitle="Structured city when available, otherwise the entered address — not geocoded">
              <BarsChart data={byLocation.map((l) => ({ label: l.location, count: l.count }))} allTicks series={[{ key: "count", name: "RFQs", color: CHART_COLORS.rose }]} />
            </ChartCard>
          )}

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recent RFQs</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/5 dark:text-gray-400">
                <tr><th className="px-3 py-2">Reference</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Fuel</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Submitted</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {recent.map((e) => (
                  <tr key={e._id}>
                    <td className="px-3 py-2 font-mono text-xs"><a href={`/chatbots/${chatbotId}/energy/enquiries`} className="text-primary-500 hover:underline">{e.referenceId}</a></td>
                    <td className="px-3 py-2">{e.customer?.name}</td>
                    <td className="px-3 py-2">{e.fuelKey}</td>
                    <td className="px-3 py-2">{STATUS_LABELS[e.status] || e.status}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- MODULE 10: AI & human handoff ----------

function AiHandoffModule({ chatbotId, params }) {
  const { data, loading, error, reload } = useAnalytics(chatbotId, "ai-handoff", params);
  if (loading) return <SkeletonCards count={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { metrics, trends, trackedSince, range } = data;
  const trend = fillDailySeries(trends.aiRequestsPerDay, range.since, range.days).map((d, i) => ({
    label: d.label,
    ai: d.value,
    handoff: fillDailySeries(trends.handoffPerDay, range.since, range.days)[i]?.value || 0,
  }));

  return (
    <div>
      <TrackedSinceNote trackedSince={trackedSince} />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard index={0} label="AI Assistance Requests" value={metrics.aiAssistanceRequests} icon={FiMessageSquare} accent="violet" />
        <StatCard index={1} label="Human Handoff Requests" value={metrics.humanHandoffRequests} icon={FiUserPlus} accent="rose" />
        <StatCard index={2} label="Handoff Rate" value={metricDisplay(metrics.handoffRate, "%")} icon={FiTrendingUp} accent="neutral" hint="Handoffs ÷ conversations started in range" />
      </div>
      {trend.every((r) => r.ai === 0 && r.handoff === 0) ? (
        <EmptyState title="No AI assistance or handoff activity in this range" />
      ) : (
        <ChartCard title="AI requests vs. human handoffs" right={<div className="flex gap-3"><LegendDot color={CHART_COLORS.violet} label="AI" /><LegendDot color={CHART_COLORS.rose} label="Handoff" /></div>}>
          <TrendChart data={trend} series={[{ key: "ai", name: "AI requests", color: CHART_COLORS.violet }, { key: "handoff", name: "Handoffs", color: CHART_COLORS.rose }]} />
        </ChartCard>
      )}
    </div>
  );
}
