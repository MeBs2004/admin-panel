import { useEffect, useState } from "react";
import { FiEye, FiMessageSquare, FiCornerUpRight, FiUserCheck, FiUserPlus, FiRepeat, FiCheckCircle, FiClock } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { fillDailySeries } from "../utils/chartData.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
import { SkeletonCards } from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const RANGE_OPTIONS = [
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
];

function ChartCard({ title, children }) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {children}
    </div>
  );
}

function metricDisplay(value, suffix = "") {
  return value === null || value === undefined ? "Not enough data" : `${value}${suffix}`;
}

function AiVsHumanChart({ series, since, days }) {
  const dense = {};
  for (const row of series) dense[row._id] = row;
  const points = [];
  const start = new Date(since);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = dense[key] || { ai: 0, human: 0 };
    points.push({ label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), ai: row.ai, human: row.human });
  }
  const max = Math.max(1, ...points.map((p) => p.ai + p.human));

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-info-500" /> AI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Human
        </span>
      </div>
      <div className="flex h-32 items-end gap-1">
        {points.map((p, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-0.5" style={{ height: "100%" }}>
            <div className="flex w-full flex-1 flex-col-reverse justify-start overflow-hidden rounded-sm bg-gray-50 dark:bg-white/5">
              {p.ai + p.human > 0 && (
                <>
                  <div className="w-full bg-amber-400" style={{ height: `${(p.human / max) * 100}%` }} />
                  <div className="w-full bg-info-500" style={{ height: `${(p.ai / max) * 100}%` }} />
                </>
              )}
            </div>
            <span className="pointer-events-none absolute -top-6 hidden rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
              {p.ai} AI · {p.human} human
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export default function Reports() {
  const [rangePreset, setRangePreset] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chatbotId, setChatbotId] = useState("");
  const [chatbots, setChatbots] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/chatbots", { params: { limit: 100 } }).then((res) => setChatbots(res.data.chatbots || [])).catch(() => setChatbots([]));
  }, []);

  const load = () => {
    if (rangePreset === "custom" && (!customStart || !customEnd)) return;
    setLoading(true);
    setError("");
    const params =
      rangePreset === "custom"
        ? { startDate: customStart, endDate: customEnd, chatbotId: chatbotId || undefined }
        : { days: rangePreset, chatbotId: chatbotId || undefined };
    api
      .get("/analytics", { params })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [rangePreset, customStart, customEnd, chatbotId]);

  const hasTrendData =
    data &&
    (data.trends.visitorsPerDay.length > 0 || data.trends.messagesPerDay.length > 0 || data.trends.conversationsPerDay.length > 0);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Real metrics computed from visitors, conversations, messages and handoffs — not estimates."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select
                options={[{ value: "", label: "All Chatbots" }, ...chatbots.map((c) => ({ value: c._id, label: c.name }))]}
                value={chatbotId}
                onChange={(e) => setChatbotId(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Select options={RANGE_OPTIONS} value={rangePreset} onChange={(e) => setRangePreset(e.target.value)} />
            </div>
            {rangePreset === "custom" && (
              <>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100" />
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100" />
              </>
            )}
          </div>
        }
      />

      {loading && <SkeletonCards count={6} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          {data.scope.note && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              {data.scope.note}
            </p>
          )}

          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Key Metrics</h2>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard index={0} label="Visitors" value={data.metrics.visitors} icon={FiEye} accent="warning" />
            <StatCard index={1} label="Conversations" value={data.metrics.conversations} icon={FiMessageSquare} accent="primary" />
            <StatCard index={2} label="Messages" value={data.metrics.messages} icon={FiCornerUpRight} accent="info" />
            <StatCard index={3} label="AI Conversations" value={data.metrics.aiConversations} icon={FiUserCheck} accent="success" />
            <StatCard index={4} label="Human Handoffs" value={data.metrics.humanHandoffs} icon={FiUserPlus} accent="warning" />
            <StatCard index={5} label="Closed" value={data.metrics.closedConversations} icon={FiCheckCircle} accent="neutral" hint={`${data.metrics.openConversations} currently open`} />
          </div>

          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Additional Metrics</h2>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard index={0} label="Avg Messages / Conversation" value={metricDisplay(data.metrics.avgMessagesPerConversation)} icon={FiMessageSquare} accent="primary" />
            <StatCard index={1} label="Avg Conversation Duration" value={metricDisplay(data.metrics.avgConversationDurationMinutes, " min")} icon={FiClock} accent="info" />
            <StatCard index={2} label="Human Handoff Rate" value={metricDisplay(data.metrics.humanHandoffRate, "%")} icon={FiUserCheck} accent="warning" hint="Handoffs ÷ conversations started in range" />
            <StatCard index={3} label="Returning Visitor Rate" value={metricDisplay(data.metrics.returningVisitorRate, "%")} icon={FiRepeat} accent="success" hint="Of visitors active in range" />
          </div>

          {!hasTrendData ? (
            <EmptyState title="Not enough data yet." description="Charts will appear once visitors start chatting in this range." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Visitor Trend">
                <AreaChart data={fillDailySeries(data.trends.visitorsPerDay, data.range.since, data.range.days)} color="primary" />
              </ChartCard>
              <ChartCard title="Conversation Trend">
                <AreaChart data={fillDailySeries(data.trends.conversationsPerDay, data.range.since, data.range.days)} color="info" />
              </ChartCard>
              <ChartCard title="Message Volume">
                <AreaChart data={fillDailySeries(data.trends.messagesPerDay, data.range.since, data.range.days)} color="primary" />
              </ChartCard>
              <ChartCard title="AI vs Human">
                <AiVsHumanChart series={data.trends.aiVsHumanPerDay} since={data.range.since} days={data.range.days} />
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
