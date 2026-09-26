import { useId, useMemo, useState } from "react";

const WIDTH = 600;
const HEIGHT = 180;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

/**
 * Lightweight dependency-free SVG area chart. No charting library —
 * this repo has none installed, and the data volume (daily points
 * over at most 90 days) doesn't warrant adding one.
 *
 * `data`: [{ label: string, value: number }] — already the real
 * series from GET /analytics, dense-filled by the caller.
 */
export default function AreaChart({ data, color = "primary" }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState(null);

  const { points, max, areaPath, linePath } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], max: 0, areaPath: "", linePath: "" };
    }

    const max = Math.max(1, ...data.map((d) => d.value));
    const stepX =
      data.length > 1 ? (WIDTH - PAD_X * 2) / (data.length - 1) : 0;
    const usableH = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const points = data.map((d, i) => ({
      x: PAD_X + stepX * i,
      y: PAD_TOP + usableH - (d.value / max) * usableH,
      ...d,
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const baseline = HEIGHT - PAD_BOTTOM;
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(1)} ${baseline} Z`
        : "";

    return { points, max, areaPath, linePath };
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const colorClass = {
    primary: { stroke: "stroke-primary-500 dark:stroke-primary-300", fill: "text-primary-500 dark:text-primary-300", dot: "fill-primary-500 dark:fill-primary-300" },
    info: { stroke: "stroke-info-500", fill: "text-info-500", dot: "fill-info-500" },
  }[color] || { stroke: "stroke-primary-500", fill: "text-primary-500", dot: "fill-primary-500" };

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-40 w-full overflow-visible"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" className={colorClass.fill} />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" className={colorClass.fill} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * f}
            y2={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * f}
            className="stroke-gray-100 dark:stroke-white/5"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} className={colorClass.fill} />
        <path
          d={linePath}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={colorClass.stroke}
        />

        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - (WIDTH / points.length) / 2}
              y={0}
              width={WIDTH / points.length}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
            {hoverIndex === i && (
              <>
                <line
                  x1={p.x}
                  x2={p.x}
                  y1={PAD_TOP}
                  y2={HEIGHT - PAD_BOTTOM}
                  className="stroke-gray-300 dark:stroke-white/20"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle cx={p.x} cy={p.y} r="4" className={`${colorClass.dot} stroke-white dark:stroke-[var(--surface)]`} strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <p className="font-semibold text-gray-800 dark:text-gray-100">{hovered.value}</p>
          <p className="text-gray-400 dark:text-gray-500">{hovered.label}</p>
        </div>
      )}

      <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
