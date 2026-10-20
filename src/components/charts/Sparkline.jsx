import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

/** Tiny axis-less trend line for stat cards. values: number[] */
export default function Sparkline({ values, color = "#10b981", height = 36 }) {
  const uid = useId().replace(/:/g, "");
  if (!values || values.length < 2) return null;
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${uid})`} dot={false} isAnimationActive animationDuration={1200} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
