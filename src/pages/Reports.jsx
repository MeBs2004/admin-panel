import { useEffect, useState } from "react";
import { FiEye, FiMessageSquare, FiCornerUpRight, FiUserCheck, FiUserPlus, FiRepeat, FiCheckCircle, FiClock } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";
import { fillDailySeries, mergeDailySeries, fillAiVsHuman, weekdayRows } from "../utils/chartData.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Select from "../components/ui/Select.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import ChartCard, { LegendDot } from "../components/charts/ChartCard.jsx";
import TrendChart from "../components/charts/TrendChart.jsx";
import BarsChart from "../components/charts/BarsChart.jsx";
import DonutChart from "../components/charts/DonutChart.jsx";
import RadialGauge from "../components/charts/RadialGauge.jsx";
import { CHART_COLORS } from "../components/charts/chartTheme.js";
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

function metricDisplay(value, suffix = "") {
  return value === null || value === undefined ? "Not enough data" : `${value}${suffix}`;
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
            <StatCard index={1} label="Conversations" value={data.metrics.conversations} icon={FiMessageSquare} accent="info" />
            <StatCard index={2} label="Messages" value={data.metrics.messages} icon={FiCornerUpRight} accent="violet" />
            <StatCard index={3} label="AI Conversations" value={data.metrics.aiConversations} icon={FiUserCheck} accent="success" />
            <StatCard index={4} label="Human Handoffs" value={data.metrics.humanHandoffs} icon={FiUserPlus} accent="rose" />
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
            <>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Performance</h2>
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ChartCard index={0} title="Handoff rate" subtitle="Handoffs ÷ conversations">
                  <RadialGauge value={data.metrics.humanHandoffRate} color={CHART_COLORS.amber} />
                </ChartCard>
                <ChartCard index={1} title="Returning visitors" subtitle="Of visitors active in range">
                  <RadialGauge value={data.metrics.returningVisitorRate} color={CHART_COLORS.emerald} />
                </ChartCard>
                <ChartCard className="col-span-2" index={2} title="Conversation outcome" subtitle="Open vs closed in range">
                  <DonutChart
                    height={130}
                    centerLabel="Convos"
                    data={[
                      { name: "Open", value: data.metrics.openConversations, color: CHART_COLORS.sky },
                      { name: "Closed", value: data.metrics.closedConversations, color: CHART_COLORS.emerald },
                    ]}
                  />
                </ChartCard>
              </div>

              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Trends</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard
                  index={3}
                  title="Visitors & conversations"
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.amber} label="Visitors" />
                      <LegendDot color={CHART_COLORS.sky} label="Conversations" />
                    </div>
                  }
                >
                  <TrendChart
                    data={mergeDailySeries({ visitors: data.trends.visitorsPerDay, conversations: data.trends.conversationsPerDay }, data.range.since, data.range.days)}
                    series={[
                      { key: "visitors", name: "Visitors", color: CHART_COLORS.amber },
                      { key: "conversations", name: "Conversations", color: CHART_COLORS.sky },
                    ]}
                  />
                </ChartCard>
                <ChartCard index={4} title="Message volume" subtitle={`${data.metrics.messages} messages`}>
                  <BarsChart
                    data={fillDailySeries(data.trends.messagesPerDay, data.range.since, data.range.days).map((d) => ({ label: d.label, messages: d.value }))}
                    series={[{ key: "messages", name: "Messages", color: CHART_COLORS.indigo }]}
                  />
                </ChartCard>
                <ChartCard
                  index={5}
                  title="Busiest days"
                  subtitle="Visitors and messages by weekday"
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.amber} label="Visitors" />
                      <LegendDot color={CHART_COLORS.indigo} label="Messages" />
                    </div>
                  }
                >
                  <BarsChart
                    data={weekdayRows(data.trends.visitorsPerDay, data.trends.messagesPerDay)}
                    allTicks
                    series={[
                      { key: "visitors", name: "Visitors", color: CHART_COLORS.amber },
                      { key: "messages", name: "Messages", color: CHART_COLORS.indigo },
                    ]}
                  />
                </ChartCard>
                <ChartCard
                  className="lg:col-span-2"
                  index={6}
                  title="AI vs human"
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.violet} label="AI" />
                      <LegendDot color={CHART_COLORS.rose} label="Human" />
                    </div>
                  }
                >
                  <TrendChart
                    stacked
                    height={240}
                    data={fillAiVsHuman(data.trends.aiVsHumanPerDay, data.range.since, data.range.days)}
                    series={[
                      { key: "ai", name: "AI", color: CHART_COLORS.violet },
                      { key: "human", name: "Human", color: CHART_COLORS.rose },
                    ]}
                  />
                </ChartCard>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
