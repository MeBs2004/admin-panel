export function SkeletonLine({ className = "" }) {
  return (
    <div
      className={`skeleton-shimmer rounded bg-gray-200 dark:bg-white/10 ${className}`}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 border-b border-gray-100 px-4 py-3 dark:border-[var(--border)]"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]"
        >
          <SkeletonLine className="mb-3 h-3 w-2/3" />
          <SkeletonLine className="h-6 w-1/3" />
        </div>
      ))}
    </div>
  );
}
