import { FiRotateCcw } from "react-icons/fi";

/**
 * One size control: slider + exact number box + "Auto" reset.
 * value === null means automatic (the widget's built-in size); the
 * slider then rests at `auto` so you can see where it starts.
 */
export default function SizeSlider({ label, hint, value, min, max, auto, step = 1, unit = "px", onChange }) {
  const isAuto = value === null || value === undefined;
  const shown = isAuto ? auto : value;
  const clamp = (n) => Math.min(max, Math.max(min, n));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {hint && <span className="block text-[11px] text-gray-400">{hint}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {isAuto ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">Auto</span>
          ) : (
            <button
              type="button"
              onClick={() => onChange(null)}
              title="Back to automatic"
              className="pop-in inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-600 transition-colors hover:bg-primary-100 dark:bg-primary-500/10 dark:text-emerald-300"
            >
              <FiRotateCcw className="h-3 w-3" /> Auto
            </button>
          )}
          <span className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white text-xs dark:border-[var(--border)] dark:bg-[var(--surface)]">
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={isAuto ? "" : value}
              placeholder={String(auto)}
              onChange={(e) => {
                const raw = e.target.value;
                onChange(raw === "" ? null : clamp(Number(raw)));
              }}
              aria-label={`${label} (${unit})`}
              className="w-14 bg-transparent px-2 py-1 text-right tabular-nums outline-none"
            />
            <span className="border-l border-gray-200 px-1.5 py-1 text-gray-400 dark:border-[var(--border)]">{unit}</span>
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamp(shown)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={`w-full accent-primary-500 transition-opacity ${isAuto ? "opacity-50 hover:opacity-100" : ""}`}
      />
    </div>
  );
}
