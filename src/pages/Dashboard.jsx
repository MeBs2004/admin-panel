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
import { fillDailySeries } from "../utils/chartData.js";
import { activityIconFor } from "../utils/activityIcon.js";
import StatCard from "../components/ui/StatCard.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import AreaChart from "../components/ui/AreaChart.jsx";
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

  return (
    <div>
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Here's what's happening across Nuformly.
        </p>
      </div>

      {loading && <SkeletonCards count={5} />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard index={0} label="Companies" value={data.kpis.companies} icon={FiBriefcase} accent="primary" />
            <StatCard index={1} label="Chatbots" value={data.kpis.chatbots} icon={FiCpu} accent="info" />
            {data.kpis.adminUsers !== null && (
              <StatCard index={2} label="Admin Users" value={data.kpis.adminUsers} icon={FiUsers} accent="success" />
            )}
            <StatCard index={3} label="Visitors" value={data.kpis.visitors} icon={FiEye} accent="warning" />
            <StatCard index={4} label="Messages" value={data.kpis.messages} icon={FiMessageSquare} accent="primary" />
          </div>

          {analytics && (
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Visitors — last 14 days
                  </h2>
                  <span className="text-xs text-gray-400">{analytics.metrics.visitors} in range</span>
                </div>
                <AreaChart
                  data={fillDailySeries(analytics.trends.visitorsPerDay, analytics.range.since, analytics.range.days)}
                  color="primary"
                />
              </div>

              <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Messages — last 14 days
                  </h2>
                  <span className="text-xs text-gray-400">{analytics.metrics.messages} in range</span>
                </div>
                <AreaChart
                  data={fillDailySeries(analytics.trends.messagesPerDay, analytics.range.since, analytics.range.days)}
                  color="info"
                />
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
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
                  {data.botHealth.map((bot) => (
                    <li
                      key={bot._id}
                      className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                    >
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

            <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
              <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Recent Activity
              </h2>
              {data.recentActivity.length === 0 ? (
                <EmptyState icon={FiActivity} title="No activity yet." />
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((log, i) => {
                    const { icon: Icon, accent } = activityIconFor(log.action);
                    return (
                      <li
                        key={log._id}
                        className="stagger-in flex items-start gap-3 text-sm"
                        style={{ "--stagger-index": i }}
                      >
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${accent}`}>
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
