import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";
import { SERIES_PALETTE } from "./chartTheme.js";

/**
 * Donut with a centre total and a legend with percentages.
 * data: [{ name, value, color? }]  (zero-value slices are dropped)
 */
export default function DonutChart({ data, height = 190, centerLabel = "Total" }) {
  const slices = (data || []).filter((d) => d.value > 0).map((d, i) => ({ ...d, color: d.color || SERIES_PALETTE[i % SERIES_PALETTE.length] }));
  const total = slices.reduce((n, d) => n + d.value, 0);
  if (total === 0) {
    return <p className="py-10 text-center text-xs text-gray-400">No data in this range.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={slices.length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="none"
              animationDuration={1000}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{total.toLocaleString()}</span>
          <span className="text-[11px] uppercase tracking-wide text-gray-400">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate text-gray-600 dark:text-gray-300">{s.name}</span>
            <span className="ml-auto font-medium tabular-nums text-gray-800 dark:text-gray-100">{s.value.toLocaleString()}</span>
            <span className="w-10 text-right text-xs tabular-nums text-gray-400">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
