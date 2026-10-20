import { THEME_PRESETS } from "../../config/widgetStyle.js";
import { CountUp } from "./motion.jsx";
import { COUNTS } from "./content.js";

const ITEMS = [
  [COUNTS.launcherMotions, "launcher motions", "#1A8A56"],
  [COUNTS.autoOpenAnimations, "auto-open animations", "#34D399"],
  [COUNTS.windowAnimations, "window entrances", "#F2711C"],
  [THEME_PRESETS.length, "ready-made themes", "#6366F1"],
  [COUNTS.icons, "launcher icons", "#0EA5E9"],
  [2, "languages", "#E11D48"],
];
const MAX = Math.max(...ITEMS.map((i) => i[0])) + 2;
const C = 2 * Math.PI * 44;

export default function Stats() {
  return (
    <section className="lp-stats" aria-label="What you can customise" data-progress>
      <div className="lp-skew mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-5 sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
        {ITEMS.map(([n, label, color], i) => (
          <div key={label} className="lp-ring-stat" data-reveal="up" style={{ "--d": `${i * 90}ms`, "--c": color, "--off": C * (1 - n / MAX), "--C": C }}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="44" className="lp-ring-track" />
              <circle cx="50" cy="50" r="44" className="lp-ring-fill" />
            </svg>
            <p className="lp-display lp-ring-num">
              <CountUp to={n} duration={1600} />
            </p>
            <p className="lp-ring-label">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
