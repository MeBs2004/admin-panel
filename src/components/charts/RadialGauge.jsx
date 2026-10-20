import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chartTheme.js";

/** Circular progress gauge (0–100). `value` null renders "—". */
export default function RadialGauge({ value, label, color = CHART_COLORS.emerald, size = 130, suffix = "%" }) {
  const has = value !== null && value !== undefined && !Number.isNaN(value);
  const pct = has ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="76%" outerRadius="100%" data={[{ v: pct }]} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="v" cornerRadius={12} fill={color} background={{ fill: "currentColor", fillOpacity: 0.08 }} animationDuration={1200} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {has ? `${pct}${suffix}` : "—"}
        </div>
      </div>
      {label && <p className="mt-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>}
    </div>
  );
}
