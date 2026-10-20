import { useLayoutEffect, useRef, useState } from "react";

// Tabs with a single underline that glides from tab to tab.
export default function Tabs({ tabs, active, onChange }) {
  const wrapRef = useRef(null);
  const [bar, setBar] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const measure = () => {
      const el = wrap.querySelector('[data-tab-active="true"]');
      if (el) setBar({ left: el.offsetLeft + 8, width: Math.max(0, el.offsetWidth - 16), ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [active, tabs.length]);

  return (
    <div ref={wrapRef} className="relative flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-[var(--border)]">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            data-tab-active={isActive}
            onClick={() => onChange(tab.value)}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
              isActive ? "text-primary-500" : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-px h-0.5 rounded-full bg-gradient-to-r from-primary-400 to-indigo-500 ${bar.ready ? "transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]" : ""}`}
        style={{ left: 0, width: bar.width, transform: `translateX(${bar.left}px)`, opacity: bar.ready ? 1 : 0 }}
      />
    </div>
  );
}
