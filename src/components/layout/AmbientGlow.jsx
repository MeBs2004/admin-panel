import { useEffect } from "react";

// A soft light that trails the pointer behind the panel. Pure decoration:
// fixed, non-interactive, sits under the content. Off for reduced motion.
export default function AmbientGlow() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--gx", `${e.clientX}px`);
        document.documentElement.style.setProperty("--gy", `${e.clientY}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="ambient-glow pointer-events-none fixed inset-0 z-0" aria-hidden="true" />;
}
