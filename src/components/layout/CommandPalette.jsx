import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiCornerDownLeft, FiCommand } from "react-icons/fi";
import { filterItems } from "../../utils/paletteSearch.js";

/**
 * ⌘K / Ctrl+K quick navigation. `items`: [{ id, label, group, icon, to?, run? }]
 * — `to` navigates, `run` performs an action. Fully keyboard driven.
 */
export default function CommandPalette({ open, onClose, items }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => filterItems(items, query), [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open) return null;

  const choose = (item) => {
    if (!item) return;
    onClose();
    if (item.run) item.run();
    else if (item.to) navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[index]);
    }
  };

  let lastGroup = null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-900/50 px-4 pt-[14vh] backdrop-blur-sm animate-fade-in" onMouseDown={onClose} role="presentation">
      <div
        role="dialog"
        aria-label="Quick search"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="palette-in w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lift ring-1 ring-black/5 dark:border-[var(--border)] dark:bg-[var(--surface)]"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-[var(--border)]">
          <FiSearch className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
            className="h-14 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
          <kbd className="hidden rounded-md border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:block dark:border-[var(--border)]">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No matches for “{query}”</p>
              <p className="mt-1 text-xs text-gray-400">Try a page name, like “visitors” or “billing”.</p>
            </div>
          )}
          {results.map((item, i) => {
            const showGroup = item.group && item.group !== lastGroup;
            lastGroup = item.group;
            const Icon = item.icon;
            const active = i === index;
            return (
              <div key={item.id}>
                {showGroup && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{item.group}</p>}
                <button
                  type="button"
                  data-idx={i}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => choose(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-100 ${
                    active ? "bg-gradient-to-r from-primary-50 to-transparent text-primary-700 dark:from-primary-500/20 dark:text-emerald-200" : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      active ? "scale-110 bg-gradient-to-br from-emerald-400 to-indigo-500 text-white shadow-sm" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                  {active && <FiCornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-[var(--border)]">
          <span className="flex items-center gap-3">
            <span><kbd className="font-sans">↑↓</kbd> navigate</span>
            <span><kbd className="font-sans">↵</kbd> open</span>
          </span>
          <span className="flex items-center gap-1"><FiCommand className="h-3 w-3" />K to toggle</span>
        </div>
      </div>
    </div>
  );
}
