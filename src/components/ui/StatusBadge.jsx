const STYLES = {
  ACTIVE: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  LIVE: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  ONLINE: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  TRIAL: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  INACTIVE: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  OFFLINE: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  PAUSED: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  SUSPENDED: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  HANDOFF: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  OPEN: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
  READY: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  PROCESSING: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
  FAILED: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  EMPTY: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  NEW: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
  RETURNING: "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
  CONNECTED: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  NOT_CONNECTED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  CONNECTING: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
  ERROR: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  DISCONNECTED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  PENDING: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  ACCEPTED: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  EXPIRED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  REVOKED: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  HEALTHY: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  APPROACHING: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  LIMIT_REACHED: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  OVER_LIMIT: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500",
  UNLIMITED: "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
  NOT_TRACKED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  TRIALING: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
  PAST_DUE: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  INCOMPLETE: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500",
  NOT_CONFIGURED: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
  CONFIGURED: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-500",
};

const PULSE = new Set(["LIVE", "ONLINE", "ACTIVE", "CONNECTED"]);

export default function StatusBadge({ status }) {
  const style =
    STYLES[status] || "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${style}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {PULSE.has(status) && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {status}
    </span>
  );
}
