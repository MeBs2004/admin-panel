import { useEffect, useRef, useState } from "react";
import { usePanel } from "../../utils/panelPath.js";
import { FiCpu, FiEye, FiMessageSquare, FiPlus, FiZap, FiActivity } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import api, { getErrorMessage } from "../../services/api.js";
import { subscribeAccessibleCompanies } from "../../services/realtime.js";
import { fillDailySeries, mergeDailySeries, fillAiVsHuman, countBy, trendDelta, weekdayRows } from "../../utils/chartData.js";
import StatCard from "../../components/ui/StatCard.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import HeroBanner from "../../components/ui/HeroBanner.jsx";
import ChartCard, { LegendDot } from "../../components/charts/ChartCard.jsx";
import TrendChart from "../../components/charts/TrendChart.jsx";
import BarsChart from "../../components/charts/BarsChart.jsx";
import DonutChart from "../../components/charts/DonutChart.jsx";
import { CHART_COLORS } from "../../components/charts/chartTheme.js";
import { SkeletonCards } from "../../components/ui/Skeleton.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

// Every number here comes straight from GET /dashboard, /analytics,
// /conversations and /visitors — the exact same backend endpoints
// the full Super Admin Dashboard/Conversations/Visitors pages call,
// already scoped to the caller's own company via
// getAccessibleCompanyIds. Nothing here is fabricated or hardcoded;
// anything the backend can't currently supply (e.g. a real AI-usage
// counter) is simply left out rather than faked.
export default function CompanyOverview() {
  const { user } = useAuth();
  const { navigate } = usePanel();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    Promise.all([
      api.get("/dashboard"),
      api.get("/analytics", { params: { days: 14 } }),
      api.get("/conversations", { params: { page: 1 } }),
      api.get("/visitors", { params: { page: 1 } }),
    ])
      .then(([dashRes, analyticsRes, convRes, visRes]) => {
        setData(dashRes.data);
        setAnalytics(analyticsRes.data);
        setRecentConversations((convRes.data.conversations || []).slice(0, 5));
        setRecentVisitors((visRes.data.visitors || []).slice(0, 5));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const range = analytics?.range;
  const visitorsTrend = analytics ? fillDailySeries(analytics.trends.visitorsPerDay, range.since, range.days).map((d) => d.value) : [];
  const messagesTrend = analytics ? fillDailySeries(analytics.trends.messagesPerDay, range.since, range.days).map((d) => d.value) : [];
  const trafficData = analytics
    ? mergeDailySeries({ visitors: analytics.trends.visitorsPerDay, messages: analytics.trends.messagesPerDay }, range.since, range.days)
    : [];
  const aiVsHuman = analytics ? fillAiVsHuman(analytics.trends.aiVsHumanPerDay, range.since, range.days) : [];
  const weekday = analytics ? weekdayRows(analytics.trends.visitorsPerDay, analytics.trends.messagesPerDay) : [];
  const botStatus = data ? countBy(data.botHealth, (b) => b.status) : [];
  const STATUS_COLORS = { LIVE: CHART_COLORS.emerald, ACTIVE: CHART_COLORS.emerald, DRAFT: CHART_COLORS.amber, PAUSED: CHART_COLORS.sky, SUSPENDED: CHART_COLORS.rose };
  const enabledChatbots = data?.botHealth?.filter((b) => b.status === "LIVE").length ?? 0;

  return (
    <div>
      <HeroBanner
        eyebrow="Your workspace"
        title={<>{greeting}, {user?.name?.split(" ")[0] || "there"} <span className="wave">👋</span></>}
        subtitle="Here's what's happening with your chatbots."
        action={
          <button
            onClick={() => navigate("/chatbots/new")}
            className="btn-shine inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-600 shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-lg active:scale-95"
          >
            <FiPlus className="h-4 w-4" />
            Create Chatbot
          </button>
        }
      />

      {loading && <SkeletonCards count={4} />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard index={0} label="Chatbots" value={data.kpis.chatbots} icon={FiCpu} accent="info" />
            <StatCard index={1} label="Enabled" value={enabledChatbots} icon={FiZap} accent="success" />
            <StatCard index={2} label="Visitors" value={data.kpis.visitors} icon={FiEye} accent="warning" trend={visitorsTrend} delta={trendDelta(visitorsTrend)} deltaLabel="later half vs earlier half" />
            <StatCard index={3} label="Messages" value={data.kpis.messages} icon={FiMessageSquare} accent="violet" trend={messagesTrend} delta={trendDelta(messagesTrend)} deltaLabel="later half vs earlier half" />
          </div>

          {analytics && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ChartCard
                  className="lg:col-span-2"
                  index={1}
                  title={`Traffic — last ${range.days} days`}
                  subtitle={`${analytics.metrics.visitors} visitors · ${analytics.metrics.messages} messages`}
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.emerald} label="Visitors" />
                      <LegendDot color={CHART_COLORS.indigo} label="Messages" />
                    </div>
                  }
                >
                  <TrendChart
                    data={trafficData}
                    series={[
                      { key: "visitors", name: "Visitors", color: CHART_COLORS.emerald },
                      { key: "messages", name: "Messages", color: CHART_COLORS.indigo },
                    ]}
                  />
                </ChartCard>
                <ChartCard index={2} title="Chatbot status" subtitle="Your bots at a glance">
                  {botStatus.length === 0 ? (
                    <EmptyState icon={FiCpu} title="No chatbots yet." />
                  ) : (
                    <DonutChart centerLabel="Bots" data={botStatus.map((b) => ({ ...b, color: STATUS_COLORS[b.name] }))} />
                  )}
                </ChartCard>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard
                  index={3}
                  title="AI vs human replies"
                  subtitle="Who answered your visitors"
                  right={
                    <div className="flex gap-3">
                      <LegendDot color={CHART_COLORS.violet} label="AI" />
                      <LegendDot color={CHART_COLORS.amber} label="Human" />
                    </div>
                  }
                >
                  <BarsChart
                    stacked
                    height={190}
                    data={aiVsHuman}
                    series={[
                      { key: "ai", name: "AI", color: CHART_COLORS.violet },
                      { key: "human", name: "Human", color: CHART_COLORS.amber },
                    ]}
                  />
                </ChartCard>
                <ChartCard
                  index={4}
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
                    height={190}
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

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="animate-fade-in-up card-fx rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Your Chatbots</h2>
                <button onClick={() => navigate("/company/chatbots")} className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
                  View all
                </button>
              </div>
              {data.botHealth.length === 0 ? (
                <EmptyState icon={FiCpu} title="No chatbots yet." description="Create your first chatbot to get started." />
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-white/5">
                  {data.botHealth.slice(0, 5).map((bot) => (
                    <li key={bot._id} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <FiCpu className="h-3.5 w-3.5 text-gray-400" />
                        {bot.name}
                      </span>
                      <StatusBadge status={bot.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="animate-fade-in-up card-fx rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent Conversations</h2>
                <button onClick={() => navigate("/company/conversations")} className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
                  View all
                </button>
              </div>
              {recentConversations.length === 0 ? (
                <EmptyState icon={FiMessageSquare} title="No conversations yet." />
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-white/5">
                  {recentConversations.map((c) => (
                    <li key={`${c.companyId}::${c.visitorId}`} className="py-2.5 text-sm first:pt-0 last:pb-0">
                      <p className="truncate font-medium text-gray-800 dark:text-gray-100">
                        {c.visitorName || c.visitorEmail || `Visitor ${c.visitorId.slice(0, 8)}`}
                      </p>
                      <p className="truncate text-xs text-gray-400">{c.lastMessagePreview || "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="animate-fade-in-up card-fx rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent Visitors</h2>
                <button onClick={() => navigate("/company/visitors")} className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
                  View all
                </button>
              </div>
              {recentVisitors.length === 0 ? (
                <EmptyState icon={FiEye} title="No visitors yet." />
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-white/5">
                  {recentVisitors.map((v) => (
                    <li key={v._id} className="py-2.5 text-sm first:pt-0 last:pb-0">
                      <p className="truncate font-medium text-gray-800 dark:text-gray-100">
                        {v.name || v.email || v.visitorId?.slice(0, 8)}
                      </p>
                      <p className="truncate text-xs text-gray-400">{v.lastVisit ? new Date(v.lastVisit).toLocaleString() : "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6 animate-fade-in-up panel-card rounded-2xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h2>
            {data.recentActivity.length === 0 ? (
              <EmptyState icon={FiActivity} title="No activity yet." />
            ) : (
              <ul className="space-y-3">
                {data.recentActivity.slice(0, 5).map((log) => (
                  <li key={log._id} className="flex items-start gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{log.user?.name || "Unknown"}</span>{" "}
                        <span className="text-gray-500 dark:text-gray-400">{log.action.replaceAll("_", " ").toLowerCase()}</span>
                      </p>
                      <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
