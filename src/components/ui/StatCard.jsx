import useCountUp from "../../hooks/useCountUp.js";

const ACCENTS = {
  primary: "bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300",
  info: "bg-info-50 text-info-500 dark:bg-info-500/10 dark:text-info-500",
  warning: "bg-warning-50 text-warning-500 dark:bg-warning-500/10 dark:text-warning-500",
  success: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500",
  neutral: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
};

export default function StatCard({ label, value, hint, icon: Icon, accent = "primary", index = 0 }) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(isNumeric ? value : 0);
  const display = isNumeric ? animated.toLocaleString() : value;

  return (
    <div
      className="stagger-in group rounded-xl border border-gray-200 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]"
      style={{ "--stagger-index": index }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {Icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${ACCENTS[accent] || ACCENTS.neutral}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
        {display}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      )}
    </div>
  );
}
