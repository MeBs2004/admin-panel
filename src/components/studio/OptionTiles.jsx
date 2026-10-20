import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { FieldLabel } from "./FieldGroup.jsx";

// `visual` may be a node, or a function (tick) => node. The tick
// increments every time the pointer enters the tile, so an animation
// sample can `key={tick}` itself and replay on hover.
function Tile({ opt, selected, onSelect }) {
  const [tick, setTick] = useState(0);
  const visual = typeof opt.visual === "function" ? opt.visual(tick) : opt.visual;
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setTick((t) => t + 1)}
      aria-pressed={selected}
      className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center text-[11px] font-medium transition-all duration-200 active:scale-95 ${
        selected
          ? "border-primary-400 bg-primary-50 text-primary-600 shadow-[0_6px_18px_-8px_rgba(26,138,86,0.55)] dark:border-primary-500 dark:bg-primary-500/10 dark:text-emerald-300"
          : "border-gray-200 text-gray-600 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-gray-50 dark:border-[var(--border)] dark:text-gray-300 dark:hover:bg-white/5"
      }`}
    >
      {visual && <span className="flex h-10 w-full items-center justify-center overflow-hidden">{visual}</span>}
      <span className="leading-tight">{opt.label}</span>
      {selected && (
        <span className="pop-in absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white">
          <FiCheck className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
}

/**
 * Visual option picker — choose by looking, not by reading names.
 * options: [{ value, label, visual? }]
 */
export default function OptionTiles({ label, hint, options, value, onChange, columns = 3 }) {
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[columns] || "grid-cols-3";
  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <div className={`grid gap-2 ${cols}`}>
        {options.map((opt) => (
          <Tile key={opt.value} opt={opt} selected={value === opt.value} onSelect={() => onChange(opt.value)} />
        ))}
      </div>
    </div>
  );
}
