import StatusBadge from "../../components/ui/StatusBadge.jsx";

const BAR_COLOR = {
  HEALTHY: "bg-success-500",
  APPROACHING: "bg-warning-500",
  LIMIT_REACHED: "bg-danger-500",
  OVER_LIMIT: "bg-danger-500",
  UNLIMITED: "bg-primary-500",
  NOT_TRACKED: "bg-gray-300 dark:bg-white/20",
};

const LABELS = {
  visitors: "Visitors",
  conversations: "Conversations",
  aiRequests: "AI Requests",
  chatbots: "Chatbots",
  members: "Team Members",
  apiKeys: "API Keys",
  developerWebhooks: "Developer Webhooks",
  apiRequests: "API Requests",
  webhookDeliveries: "Webhook Deliveries",
  webhookFailures: "Webhook Failures",
  messages: "Messages",
  aiTokens: "AI Tokens",
};

export default function UsageBar({ metric, data }) {
  const pct = data.unlimited ? 100 : Math.min(100, data.percent ?? 0);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-200">{LABELS[metric] || metric}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">
            {data.used.toLocaleString()}
            {data.limit !== null ? ` / ${data.limit.toLocaleString()}` : data.unlimited ? " / Unlimited" : ""}
          </span>
          <StatusBadge status={data.status} />
        </div>
      </div>
      {data.status !== "NOT_TRACKED" && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${BAR_COLOR[data.status] || "bg-gray-300"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {data.remaining !== null && !data.unlimited && (
        <p className="mt-1 text-xs text-gray-400">{data.remaining.toLocaleString()} remaining this period</p>
      )}
    </div>
  );
}
