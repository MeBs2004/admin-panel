import { useLayoutEffect, useState } from "react";

/**
 * Position of the sliding highlight: it follows whichever link inside
 * `contentRef` is marked data-nav-active="true". `contentRef` must be the
 * positioned wrapper that holds both the links and the indicator, so link
 * boxes and the indicator share one coordinate space.
 */
export default function useNavIndicator(contentRef, deps) {
  const [style, setStyle] = useState({ opacity: 0 });
  useLayoutEffect(() => {
    const wrap = contentRef.current;
    if (!wrap) return undefined;
    const measure = () => {
      const el = wrap.querySelector('[data-nav-active="true"]');
      const link = el && el.getBoundingClientRect();
      // a folded group clips its links (overflow-hidden) but they keep their height
      let visible = !!link && link.height > 0;
      for (let p = el?.parentElement; visible && p && p !== wrap; p = p.parentElement) {
        if (getComputedStyle(p).overflowY === "visible") continue;
        const clip = p.getBoundingClientRect();
        const shown = Math.min(link.bottom, clip.bottom) - Math.max(link.top, clip.top);
        if (shown < link.height * 0.9) visible = false;
      }
      if (!visible) {
        setStyle((s) => (s.opacity === 0 ? s : { ...s, opacity: 0 }));
        return;
      }
      const box = wrap.getBoundingClientRect();
      const next = {
        opacity: 1,
        top: Math.round(link.top - box.top),
        left: Math.round(link.left - box.left),
        width: Math.round(link.width),
        height: Math.round(link.height),
      };
      setStyle((s) => (["opacity", "top", "left", "width", "height"].every((k) => s[k] === next[k]) ? s : next));
    };
    measure();
    // groups fold with a CSS transition, so re-measure while it plays out
    let timers = [];
    const settle = () => {
      measure();
      timers.forEach(clearTimeout);
      timers = [60, 160, 320, 480].map((ms) => setTimeout(measure, ms));
    };
    settle();
    const ro = new ResizeObserver(settle);
    ro.observe(wrap);
    const onTransition = (e) => {
      if (!e.target.classList?.contains("nav-indicator")) settle();
    };
    wrap.addEventListener("transitionstart", onTransition);
    wrap.addEventListener("transitionend", onTransition);
    wrap.addEventListener("click", settle);
    window.addEventListener("resize", settle);
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      wrap.removeEventListener("transitionstart", onTransition);
      wrap.removeEventListener("transitionend", onTransition);
      wrap.removeEventListener("click", settle);
      window.removeEventListener("resize", settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return style;
}

export function NavIndicator({ style }) {
  return (
    <span
      aria-hidden="true"
      className="nav-indicator pointer-events-none absolute z-0 rounded-lg bg-gradient-to-r from-primary-50 to-transparent shadow-[inset_0_0_0_1px_rgba(26,138,86,0.14)] dark:from-primary-500/20"
      style={style}
    >
      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-400 to-indigo-500" />
    </span>
  );
}
