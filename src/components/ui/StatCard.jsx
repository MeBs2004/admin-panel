import useCountUp from "../../hooks/useCountUp.js";
import Sparkline from "../charts/Sparkline.jsx";

// Gradient icon chip + matching sparkline/glow colour per accent.
const ACCENTS = {
  primary: { chip: "from-emerald-400 to-emerald-600", color: "#10b981", glow: "group-hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)]" },
  info: { chip: "from-sky-400 to-blue-600", color: "#0ea5e9", glow: "group-hover:shadow-[0_8px_24px_-8px_rgba(14,165,233,0.55)]" },
  warning: { chip: "from-amber-400 to-orange-500", color: "#f59e0b", glow: "group-hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.55)]" },
  success: { chip: "from-teal-400 to-green-600", color: "#14b8a6", glow: "group-hover:shadow-[0_8px_24px_-8px_rgba(20,184,166,0.55)]" },
  violet: { chip: "from-violet-400 to-indigo-600", color: "#8b5cf6", glow: "group-hover:shadow-[0_8px_24px_-8px_rgba(139,92,246,0.55)]" },
  rose: { chip: "from-rose-400 to-pink-600", color: "#f43f5e", glow: "group-hover:shadow-[0_8px_24px_-8px_rgba(244,63,94,0.55)]" },
  neutral: { chip: "from-slate-400 to-slate-600", color: "#64748b", glow: "" },
};

/**
 * `trend` (optional): number[] — draws a sparkline under the value.
 * Pass real series only; omit it and the card simply has no sparkline.
 */
export default function StatCard({ label, value, hint, icon: Icon, accent = "primary", index = 0, trend, delta = null, deltaLabel = "vs earlier" }) {
  const isNumeric = typeof value === "number";
  const animated = useCountUp(isNumeric ? value : 0);
  const display = isNumeric ? animated.toLocaleString() : value;
  const a = ACCENTS[accent] || ACCENTS.neutral;

  return (
    <div
      className="stagger-in card-fx group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-card dark:border-[var(--border)] dark:bg-[var(--surface)]"
      style={{ "--stagger-index": index }}
    >
      {/* soft accent bloom in the corner */}
      <span
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-300 group-hover:opacity-30"
        style={{ background: a.color }}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 ${a.chip} ${a.glow}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="relative mt-2 flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-100">{display}</p>
        {typeof delta === "number" && (
          <span
            title={`${delta > 0 ? "+" : ""}${delta}% ${deltaLabel}`}
            className={`chip-in mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              delta > 0
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : delta < 0
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                  : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
            }`}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {hint && <p className="relative mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      {trend && trend.length > 1 && (
        <div className="relative -mx-1 mt-2">
          <Sparkline values={trend} color={a.color} />
        </div>
      )}
    </div>
  );
}
