import { useEffect, useRef, useState } from "react";

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Animates a numeric value counting up from 0 (or its previous
 * value) to `target` over `duration` ms. Non-numeric targets pass
 * through unchanged (dashboard KPIs can be null while loading).
 */
export default function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof target !== "number" || Number.isNaN(target)) {
      setValue(target);
      return;
    }

    if (PREFERS_REDUCED_MOTION) {
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(from + (target - from) * eased);
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
