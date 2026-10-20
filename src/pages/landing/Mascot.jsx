import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion.jsx";

const EYES = [
  { cx: 104, cy: 96, r: 52 },
  { cx: 206, cy: 92, r: 50 },
];

/**
 * The Nuform "n" mascot (the starter launcher logo), redrawn as SVG so
 * its pupils can follow the visitor's pointer and it can blink.
 */
export default function Mascot({ className = "", title = "Nuformly mascot", track = true }) {
  const svgRef = useRef(null);
  const pupilRefs = useRef([]);

  useEffect(() => {
    if (!track || prefersReducedMotion()) return undefined;
    let raf = 0;
    let last = null;
    const apply = () => {
      raf = 0;
      const svg = svgRef.current;
      if (!svg || !last) return;
      const box = svg.getBoundingClientRect();
      const sx = 306 / box.width;
      EYES.forEach((eye, i) => {
        const ex = box.left + eye.cx / sx;
        const ey = box.top + eye.cy / sx;
        const dx = last.x - ex;
        const dy = last.y - ey;
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, d / 260) * 17;
        const p = pupilRefs.current[i];
        if (p) p.style.transform = `translate(${(dx / d) * reach}px, ${(dy / d) * reach}px)`;
      });
    };
    const onMove = (e) => {
      last = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [track]);

  return (
    <svg ref={svgRef} viewBox="0 0 306 419" className={className} role="img" aria-label={title}>
      <path d="M0 419V262C0 178 62 118 146 118H286Q306 118 306 138V296C306 366 268 412 214 419Z" fill="#0F7A47" />
      <path d="M70 419V250C70 214 94 188 130 188H228V419Z" fill="#fff" />
      <path d="M126 236Q153 258 180 236" fill="none" stroke="#1d1d1b" strokeWidth="10" strokeLinecap="round" />
      {EYES.map((eye, i) => (
        <g key={i} className="lp-eye" style={{ transformOrigin: `${eye.cx}px ${eye.cy}px` }}>
          <circle cx={eye.cx} cy={eye.cy} r={eye.r} fill="#DCE8E2" />
          <circle cx={eye.cx - 4} cy={eye.cy - 3} r={eye.r - 6} fill="#fff" />
          <g ref={(el) => (pupilRefs.current[i] = el)} style={{ transition: "transform 120ms ease-out" }}>
            <circle cx={eye.cx} cy={eye.cy + 4} r={30} fill="#4A3628" />
            <circle cx={eye.cx - 9} cy={eye.cy - 6} r={7} fill="#fff" opacity="0.85" />
          </g>
        </g>
      ))}
    </svg>
  );
}
