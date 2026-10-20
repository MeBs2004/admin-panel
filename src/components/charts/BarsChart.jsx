import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";
import { AXIS_TICK, GRID_STROKE } from "./chartTheme.js";

/** Rounded vertical bars; `stacked` stacks the series. */
export default function BarsChart({ data, series, height = 220, stacked = false, allTicks = false }) {
  if (!data?.length) return null;
  return (
    <div className="text-gray-500 dark:text-gray-400" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke={GRID_STROKE} strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={allTicks ? 0 : 24} interval={allTicks ? 0 : "preserveEnd"} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "currentColor", fillOpacity: 0.06 }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              stackId={stacked ? "a" : undefined}
              radius={stacked ? (i === series.length - 1 ? [6, 6, 0, 0] : 0) : [6, 6, 0, 0]}
              animationDuration={900}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
