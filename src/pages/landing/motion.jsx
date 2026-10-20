import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll reveals for a whole page from one observer: any element with
 * `data-reveal` (up | blur | scale | left | right | clip) gets
 * `data-in` the first time it enters the viewport. `--d` on the element
 * (or `data-delay`) staggers siblings.
 */
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = () => root.querySelectorAll("[data-reveal]:not([data-in])");
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      els().forEach((el) => el.setAttribute("data-in", ""));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          // an attribute, not a class: React re-renders className and would wipe it
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const watch = () => els().forEach((el) => io.observe(el));
    watch();
    // Safety net: anything already scrolled past or on screen (fast jumps,
    // very tall windows, full-page screenshots) is revealed, never left hidden.
    const sweep = () =>
      els().forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.setAttribute("data-in", "");
      });
    const timer = setInterval(sweep, 1200);
    // sections that mount later (lazy charts, tabs) get picked up too
    const mo = new MutationObserver(watch);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      clearInterval(timer);
      io.disconnect();
      mo.disconnect();
    };
  }, [rootRef]);
}

/** True once the element has scrolled into view (stays true). */
export function useInView(ref, margin = "0px 0px -15% 0px") {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, seen]);
  return seen;
}

/** Counts up to `to` once visible. Infinity renders as ∞. */
export function CountUp({ to, duration = 1400, format = (n) => n.toLocaleString("en-IN") }) {
  const ref = useRef(null);
  const seen = useInView(ref);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen || !Number.isFinite(to)) return undefined;
    if (prefersReducedMotion()) {
      setN(to);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(to * (1 - (1 - t) ** 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref}>{Number.isFinite(to) ? format(n) : "∞"}</span>;
}

/** 0 → 1 progress of the page scroll, for the top progress bar. */
export function useScrollProgress() {
  const [p, setP] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return { progress: p, scrolled };
}

/**
 * Pointer-follow for a whole page: cards with `data-spot` get --mx/--my
 * (for a glow that tracks the cursor) and `data-magnet` elements lean
 * slightly toward it.
 */
export function usePointerFx(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion() || !window.matchMedia?.("(hover: hover)").matches) return undefined;
    const onMove = (e) => {
      const spot = e.target.closest?.("[data-spot]");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      const mag = e.target.closest?.("[data-magnet]");
      if (mag) {
        const r = mag.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        mag.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`;
      }
    };
    const onOut = (e) => {
      const mag = e.target.closest?.("[data-magnet]");
      if (mag && !mag.contains(e.relatedTarget)) mag.style.transform = "";
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerout", onOut);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerout", onOut);
    };
  }, [rootRef]);
}

/**
 * Renders children at a fixed natural size and scales them down
 * (never up) to fit the available width — so the real widget keeps its
 * real pixel layout on a phone.
 */
export function ScaledStage({ width, height, fitViewport = 0, className = "", children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // fitViewport: also shrink so the stage fits the window height minus this many px
    // (desktop only — on phones the stage sits below the text and may scroll)
    const fit = () => {
      const byWidth = el.clientWidth / width;
      const byHeight = fitViewport && window.innerWidth >= 1024 ? Math.max(0.62, (window.innerHeight - fitViewport) / height) : Infinity;
      setScale(Math.min(1, byWidth, byHeight) || 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [width, height, fitViewport]);
  return (
    <div ref={ref} className={`flex w-full min-w-0 justify-center ${className}`}>
      <div style={{ width: width * scale, height: height * scale }}>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Scroll-linked motion for a whole page, from one rAF-throttled listener:
 *  - [data-parallax="0.1"]  moves vertically against the scroll (measured via its parent)
 *  - [data-drift="-0.3"]    slides sideways as its parent passes through the viewport
 *  - [data-progress]        gets --p (0 → 1) as it enters the viewport; children animate off it
 *  - [data-scrub]           gets --s (0 → 1) as the viewport centre passes through it
 *  - [data-exit]            gets --e (0 → 1) as it leaves through the top
 *  - the root gets --v (scroll speed, -1…1) and --sp (page progress, 0…1)
 */
export function useScrollFx(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;
    // every section mounts in one commit, so the element lists can be read once
    const lists = Object.fromEntries(["parallax", "drift", "progress", "scrub", "exit"].map((k) => [k, [...root.querySelectorAll(`[data-${k}]`)]]));
    let raf = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let vel = 0;
    let target = 0;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const now = performance.now();
      // scroll speed → --v (-1…1), eased back to 0 when scrolling stops
      const dt = Math.max(16, now - lastT);
      target = clamp((y - lastY) / dt / 2.5, -1, 1);
      lastY = y;
      lastT = now;
      vel += (target - vel) * 0.18;
      if (Math.abs(vel) < 0.004) vel = 0;
      root.style.setProperty("--v", vel.toFixed(3));
      const max = document.documentElement.scrollHeight - vh;
      root.style.setProperty("--sp", (max > 0 ? clamp(y / max) : 0).toFixed(4));

      lists.parallax.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const off = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax || 0.1);
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      });
      lists.drift.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        // measured from the viewport centre and clamped, so any window size stays in range
        const lim = Number(el.dataset.driftMax || 260);
        const x = clamp((r.top + r.height / 2 - vh / 2) * Number(el.dataset.drift || 0.2), -lim, lim);
        el.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      });
      // --p: 0 → 1 while entering the viewport
      lists.progress.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--p", clamp((vh - r.top) / (vh * 0.8)).toFixed(3));
      });
      // --s: 0 → 1 while the viewport's centre line crosses the element
      lists.scrub.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--s", clamp((vh * 0.55 - r.top) / (r.height || 1)).toFixed(3));
      });
      // --e: 0 → 1 while the element scrolls off the top
      lists.exit.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--e", clamp(-r.top / (r.height * 0.85 || 1)).toFixed(3));
      });
      if (vel !== 0) raf = requestAnimationFrame(run);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [rootRef]);
}

/** Heading text split into words that rise through a mask (parent: data-reveal="words"). */
export function SplitWords({ text }) {
  const words = text.split(" ");
  return words.map((w, i) => (
    <span key={i}>
      <span className="lp-word">
        <span style={{ "--w": i }}>{w}</span>
      </span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}

/** Soft light that follows the pointer across the page (desktop only). */
export function CursorGlow() {
  const ref = useRef(null);
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia?.("(hover: hover)").matches) return undefined;
    let raf = 0;
    let x = 0;
    let y = 0;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (ref.current) ref.current.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`;
        });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return <div ref={ref} className="lp-cursor-glow" aria-hidden="true" />;
}
