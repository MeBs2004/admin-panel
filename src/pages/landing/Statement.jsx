import { useEffect, useRef } from "react";
import Mascot from "./Mascot.jsx";
import { prefersReducedMotion } from "./motion.jsx";

// *word* = highlighted. Words light up one by one as the section scrolls past.
const TEXT =
  "Visitors ask at *midnight,* on weekends, in Hindi. Your assistant answers in *seconds* — from what you taught it. Your *team* steps in only when it matters.";

export default function Statement() {
  const ref = useRef(null);
  const words = TEXT.split(" ");
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const spans = el.querySelectorAll(".lp-sw");
    if (prefersReducedMotion()) {
      spans.forEach((s) => s.classList.add("is-lit"));
      el.style.setProperty("--p", "1");
      return undefined;
    }
    let raf = 0;
    let lastP = "";
    let lastLit = 0;
    const run = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      // no room to scroll through it (very tall window): just show it lit
      const p = total <= 40 ? 1 : Math.min(1, Math.max(0, -r.top / total));
      const pv = p.toFixed(3);
      if (pv !== lastP) el.style.setProperty("--p", (lastP = pv));
      // only touch the words whose state changed
      const lit = Math.min(spans.length, Math.ceil(p * spans.length * 1.12));
      if (lit !== lastLit) {
        for (let i = Math.min(lit, lastLit); i < Math.max(lit, lastLit); i += 1) spans[i].classList.toggle("is-lit", i < lit);
        lastLit = lit;
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  return (
    <section ref={ref} className="lp-statement" aria-label={TEXT.replace(/\*/g, "")}>
      <div className="lp-statement-sticky">
        <div className="lp-statement-glow" aria-hidden="true" />
        <p className="lp-display lp-statement-text mx-auto max-w-[1100px] px-5 sm:px-8" aria-hidden="true">
          {words.map((w, i) => {
            const hot = w.startsWith("*");
            return (
              <span key={i}>
                <span className={`lp-sw ${hot ? "is-hot" : ""}`}>{w.replace(/\*/g, "")}</span>{" "}
              </span>
            );
          })}
        </p>
        <div className="lp-statement-bar" aria-hidden="true">
          <span />
        </div>
        <div className="lp-statement-mascot" aria-hidden="true">
          <Mascot className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
