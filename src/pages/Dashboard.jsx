import { useEffect, useRef, useState } from "react";
import {
  FiBriefcase,
  FiCpu,
  FiUsers,
  FiEye,
  FiMessageSquare,
  FiActivity,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import api, { getErrorMessage } from "../services/api.js";
import { subscribeAccessibleCompanies } from "../services/realtime.js";
import { fillDailySeries, mergeDailySeries, fillAiVsHuman, countBy, trendDelta, weekdayRows } from "../utils/chartData.js";
import { activityIconFor } from "../utils/activityIcon.js";
import StatCard from "../components/ui/StatCard.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import HeroBanner from "../components/ui/HeroBanner.jsx";
import ChartCard, { LegendDot } from "../components/charts/ChartCard.jsx";
import TrendChart from "../components/charts/TrendChart.jsx";
import BarsChart from "../components/charts/BarsChart.jsx";
import DonutChart from "../components/charts/DonutChart.jsx";
import { CHART_COLORS } from "../components/charts/chartTheme.js";
import { SkeletonCards } from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    Promise.all([api.get("/dashboard"), api.get("/analytics", { params: { days: 14 } })])
      .then(([dashRes, analyticsRes]) => {
        setData(dashRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Realtime (Section 14) — debounced, and deliberately NOT listening
  // to message.created: that fires on every single chat turn across
  // every conversation, and this endpoint runs 8 MongoDB queries per
  // call (see audit) — refetching per-message would be a request
  // storm for a busy chatbot. Chatbot/visitor/conversation-created
  // events are comparatively rare and worth reflecting quickly.
  const debounceRef = useRef(null);
  const RELEVANT = new Set(["chatbot.created", "chatbot.updated", "visitor.created", "conversation.created"]);

  useEffect(() => {
    const unsubscribe = subscribeAccessibleCompanies((evt) => {
      if (!RELEVANT.has(evt.type)) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => load(true), 1500);
    });
    return () => {
      clearTimeout(debounceRef.current);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const range = analytics?.range;
  const visitorsTrend = analytics ? fillDailySeries(analytics.trends.visitorsPerDay, range.since, range.days).map((d) => d.value) : [];
  const messagesTrend = analytics ? fillDailySeries(analytics.trends.messagesPerDay, range.since, range.days).map((d) => d.value) : [];
  const activityData = analytics
    ? mergeDailySeries({ visitors: analytics.trends.visitorsPerDay, messages: analytics.trends.messagesPerDay }, range.since, range.days)
    : [];
  const conversationBars = analytics
    ? mergeDailySeries({ conversations: analytics.trends.conversationsPerDay }, range.since, range.days)
    : [];
  const aiVsHuman = analytics ? fillAiVsHuman(analytics.trends.aiVsHumanPerDay, range.since, range.days) : [];
  const weekday = analytics ? weekdayRows(analytics.trends.visitorsPerDay, analytics.trends.messagesPerDay) : [];
  const botStatus = data ? countBy(data.botHealth, (b) => b.status) : [];
  const STATUS_COLORS = { LIVE: CHART_COLORS.emerald, ACTIVE: CHART_COLORS.emerald, DRAFT: CHART_COLORS.amber, PAUSED: CHART_COLORS.sky, SUSPENDED: CHART_COLORS.rose };

  return (
    <div>
      <HeroBanner
        eyebrow="Platform overview"
        title={<>{greeting}, {user?.name?.split(" ")[0] || "there"} <span className="wave">👋</span></>}
        subtitle="Here's what's happening across Nuformly — live."
      />

      {loading && <SkeletonCards count={5} />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard index={0} label="Companies" value={data.kpis.companies} icon={FiBriefcase} accent="primary" />
            <StatCard index={1} label="Chatbots" value={data.kpis.chatbots} icon={FiCpu} accent="info" />
            {data.kpis.adminUsers !== null && (
              <StatCard index={2} label="Admin Users" value={data.kpis.adminUsers} icon={FiUsers} accent="violet" />
            )}
            <StatCard index={3} label="Visitors" value={data.kpis.visitors} icon={FiEye} accent="warning" trend={visitorsTrend} delta={trendDelta(visitorsTrend)} deltaLabel="later half vs earlier half" />
            <StatCard index={4} label="Messages" value={data.kpis.messages} icon={FiMessageSquare} accent="rose" trend={messagesTrend} delta={trendDelta(messagesTrend)} deltaLabel="later half vs earlier half" />
          </div>

          {analytics && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartCard
                  className="lg:col-span-2"
                  index={1}
                  title={`Traffic — last ${range.days} days`}
                  subtitle={`${analytics.metrics.visitors} visitors · ${analytics.metrics.messages} messages in range`}
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.emerald} label="Visitors" />
                      <LegendDot color={CHART_COLORS.indigo} label="Messages" />
                    </div>
                  }
                >
                  <TrendChart
                    data={activityData}
                    series={[
                      { key: "visitors", name: "Visitors", color: CHART_COLORS.emerald },
                      { key: "messages", name: "Messages", color: CHART_COLORS.indigo },
                    ]}
                  />
                </ChartCard>

                <ChartCard index={2} title="Chatbot status" subtitle="Health across all bots">
                  {botStatus.length === 0 ? (
                    <EmptyState icon={FiCpu} title="No chatbots available." />
                  ) : (
                    <DonutChart
                      centerLabel="Bots"
                      data={botStatus.map((b) => ({ ...b, color: STATUS_COLORS[b.name] }))}
                    />
                  )}
                </ChartCard>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartCard index={3} title="Conversations per day" subtitle={`${analytics.metrics.conversations} in range`}>
                  <BarsChart data={conversationBars} series={[{ key: "conversations", name: "Conversations", color: CHART_COLORS.sky }]} height={200} />
                </ChartCard>
                <ChartCard
                  index={4}
                  title="AI vs human replies"
                  subtitle="Who answered visitors"
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.violet} label="AI" />
                      <LegendDot color={CHART_COLORS.amber} label="Human" />
                    </div>
                  }
                >
                  <BarsChart
                    stacked
                    height={200}
                    data={aiVsHuman}
                    series={[
                      { key: "ai", name: "AI", color: CHART_COLORS.violet },
                      { key: "human", name: "Human", color: CHART_COLORS.amber },
                    ]}
                  />
                </ChartCard>
                <ChartCard
                  index={5}
                  title="Busiest days"
                  subtitle="Visitors and messages by weekday"
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.emerald} label="Visitors" />
                      <LegendDot color={CHART_COLORS.sky} label="Messages" />
                    </div>
                  }
                >
                  <BarsChart
                    height={200}
                    data={weekday}
                    allTicks
                    series={[
                      { key: "visitors", name: "Visitors", color: CHART_COLORS.emerald },
                      { key: "messages", name: "Messages", color: CHART_COLORS.sky },
                    ]}
                  />
                </ChartCard>
              </div>
            </>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="stagger-in card-fx rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]" style={{ "--stagger-index": 5 }}>
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Bot Health
              </h2>
              {data.botHealth.length === 0 ? (
                <EmptyState
                  icon={FiCpu}
                  title="No chatbots available."
                  description="Create a chatbot from the Chatbots page to see its health here."
                />
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-white/5">
                  {data.botHealth.map((bot, i) => (
                    <li
                      key={bot._id}
                      className="stagger-in flex items-center justify-between rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                      style={{ "--stagger-index": i }}
                    >
                      <span className="flex items-center gap-2.5 text-gray-700 dark:text-gray-200">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-white">
                          <FiCpu className="h-3.5 w-3.5" />
                        </span>
                        {bot.name}
                      </span>
                      <StatusBadge status={bot.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="stagger-in card-fx rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]" style={{ "--stagger-index": 6 }}>
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Recent Activity
              </h2>
              {data.recentActivity.length === 0 ? (
                <EmptyState icon={FiActivity} title="No activity yet." />
              ) : (
                <ul className="relative space-y-3 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-px before:bg-gradient-to-b before:from-emerald-300/60 before:to-transparent">
                  {data.recentActivity.map((log, i) => {
                    const { icon: Icon, accent } = activityIconFor(log.action);
                    return (
                      <li
                        key={log._id}
                        className="stagger-in relative flex items-start gap-3 text-sm"
                        style={{ "--stagger-index": i }}
                      >
                        <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-[var(--surface)] ${accent}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate">
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                              {log.user?.name || "Unknown"}
                            </span>{" "}
                            <span className="text-gray-500 dark:text-gray-400">
                              {log.action.replaceAll("_", " ").toLowerCase()}
                            </span>
                          </p>
                          <div className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
