// Shared frame for every chart: consistent title/subtitle/legend slot
// plus the lift-on-hover and entrance animation.
export default function ChartCard({ title, subtitle, right, children, className = "", index = 0 }) {
  return (
    <div
      className={`stagger-in card-fx rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-[var(--border)] dark:bg-[var(--surface)] ${className}`}
      style={{ "--stagger-index": index }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
