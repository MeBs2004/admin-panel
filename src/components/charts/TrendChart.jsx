import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE } from "./chartTheme.js";

/**
 * Smooth multi-series gradient area chart.
 * data:   [{ label, <key>: number, ... }]
 * series: [{ key, name, color }]
 */
export default function TrendChart({ data, series, height = 220, stacked = false }) {
  const uid = useId().replace(/:/g, "");
  if (!data?.length) return null;

  return (
    <div className="text-gray-500 dark:text-gray-400" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_COLORS.emerald, strokeOpacity: 0.3, strokeDasharray: "4 4" }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stackId={stacked ? "a" : undefined}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#${uid}-${s.key})`}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
