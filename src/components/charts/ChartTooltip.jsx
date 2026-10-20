export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="animate-scale-in panel-card rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-lift backdrop-blur dark:border-[var(--border)] dark:bg-[var(--surface)]/95 animate-fade-in-up">
      {label !== undefined && label !== "" && (
        <p className="mb-1 font-medium text-gray-400 dark:text-gray-500">{label}</p>
      )}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill || p.payload?.fill }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">
            {formatter ? formatter(p.value) : Number(p.value).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}
