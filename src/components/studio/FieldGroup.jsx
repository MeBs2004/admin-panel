import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

// Collapsible settings card. Height animates via the grid-rows trick,
// so content of any size opens smoothly without measuring.
export default function FieldGroup({ title, icon: Icon, description, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-shadow duration-300 hover:shadow-card-hover dark:border-[var(--border)] dark:bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
      >
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 text-white shadow-sm">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
          {description && <span className="block truncate text-xs text-gray-400">{description}</span>}
        </span>
        <FiChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-gray-100 px-4 py-4 dark:border-[var(--border)]">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function FieldLabel({ children, hint }) {
  return (
    <div className="mb-2">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{children}</span>
      {hint && <span className="block text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
