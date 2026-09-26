import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUser, FiMessageSquare, FiCpu, FiUserCheck, FiCheckCircle } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

const EVENT_META = {
  visitor_created: { icon: FiUser, label: "Visitor first seen", accent: "text-gray-400 bg-gray-100 dark:bg-white/5" },
  message_sent: { icon: FiMessageSquare, label: "Message sent", accent: "text-primary-600 bg-primary-50 dark:bg-primary-500/10" },
  ai_response: { icon: FiCpu, label: "AI response", accent: "text-info-600 bg-info-50 dark:bg-info-500/10" },
  human_handoff: { icon: FiUserCheck, label: "Human handoff", accent: "text-warning-600 bg-warning-50 dark:bg-warning-500/10" },
  human_reply: { icon: FiUserCheck, label: "Human reply", accent: "text-success-600 bg-success-50 dark:bg-success-500/10" },
};

export default function VisitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([api.get(`/visitors/${id}`), api.get(`/visitors/${id}/timeline`)])
      .then(([detailRes, timelineRes]) => {
        setData(detailRes.data);
        setTimeline(timelineRes.data.events);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-32 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { visitor, company, stats, conversation, isActive, isReturning } = data;

  return (
    <div>
      <PageHeader
        title={visitor.name || visitor.email || visitor.visitorId}
        description={company?.name}
        breadcrumbs={[{ label: "Visitors", to: "/visitors" }, { label: visitor.name || visitor.email || visitor.visitorId }]}
        action={
          <Button variant="secondary" onClick={() => navigate("/visitors")}>
            Back to Visitors
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge status={isActive ? "ACTIVE" : "INACTIVE"} />
              <StatusBadge status={isReturning ? "RETURNING" : "NEW"} />
            </div>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Visitor ID</dt>
                <dd className="font-mono text-xs font-medium text-gray-800 dark:text-gray-100">{visitor.visitorId}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">{visitor.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Sessions</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">{visitor.totalVisits}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Messages Sent</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">{stats.messageCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">First Visit</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">{new Date(visitor.firstVisit).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Last Visit</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">{new Date(visitor.lastVisit).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Device / Browser</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {visitor.device || "—"} / {visitor.browser?.split(" ")[0] || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {[visitor.city, visitor.country].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Activity Timeline</h2>
            {!timeline || timeline.length === 0 ? (
              <EmptyState title="No recorded activity." />
            ) : (
              <ul className="space-y-3">
                {timeline.map((ev, i) => {
                  const meta = EVENT_META[ev.type] || EVENT_META.message_sent;
                  const Icon = meta.icon;
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${meta.accent}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-700 dark:text-gray-200">
                          {meta.label}
                          {ev.agentName && <span className="font-normal text-gray-400"> — {ev.agentName}</span>}
                        </p>
                        {ev.detail && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{ev.detail}</p>}
                        <p className="text-[11px] text-gray-400">{new Date(ev.at).toLocaleString()}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]">
            <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Conversation</h2>
            {!conversation ? (
              <EmptyState icon={FiMessageSquare} title="No conversation record." description="This visitor has no tracked conversation yet." />
            ) : (
              <button
                onClick={() => navigate(`/conversations/${company.companyId}/${visitor.visitorId}`)}
                className="block w-full rounded-lg border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
              >
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={conversation.status} />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${conversation.mode === "HUMAN" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-400"}`}
                  >
                    {conversation.mode}
                  </span>
                </div>
                {conversation.chatbotName && <p className="text-xs text-gray-500 dark:text-gray-400">{conversation.chatbotName}</p>}
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                  <FiCheckCircle className="h-3 w-3" /> Open in Conversations
                </p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
