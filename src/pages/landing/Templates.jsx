import { SplitWords } from "./motion.jsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { TEMPLATES } from "./content.js";

const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="text-[var(--lp-muted)]">{label}</span>
        <b className="font-mono text-[var(--lp-ink)]">{format(value)}</b>
      </span>
      <input type="range" className="lp-range mt-2 w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** Same formulas as backend/services/sectors/marketingCalculator.service.js. */
function MarketingCalculator() {
  const [spend, setSpend] = useState(50000);
  const [clicks, setClicks] = useState(4000);
  const [revenue, setRevenue] = useState(180000);
  const results = [
    ["ROAS", `${(revenue / spend).toFixed(2)}×`, "attributed revenue / advertising spend"],
    ["ROI", `${(((revenue - spend) / spend) * 100).toFixed(0)}%`, "(revenue − cost) / cost × 100%"],
    ["CPC", inr(spend / clicks), "advertising spend / clicks"],
  ];
  return (
    <div className="lp-calc" data-reveal="right" style={{ "--d": "120ms" }}>
      <div className="space-y-5">
        <Slider label="Ad spend" value={spend} min={5000} max={200000} step={1000} onChange={setSpend} format={inr} />
        <Slider label="Clicks" value={clicks} min={200} max={20000} step={100} onChange={setClicks} format={(v) => v.toLocaleString("en-IN")} />
        <Slider label="Revenue from ads" value={revenue} min={0} max={600000} step={5000} onChange={setRevenue} format={inr} />
      </div>
      <div className="lp-calc-reply">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-leaf-ink)]">Assistant</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {results.map(([k, v, f]) => (
            <div key={k} className="lp-calc-out" title={`${k} = ${f}`}>
              <p className="text-xs font-semibold text-[var(--lp-muted)]">{k}</p>
              <p key={v} className="lp-display lp-tick text-2xl text-[var(--lp-ink)]">
                {v}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--lp-ink)]">
          {revenue >= spend * 3
            ? "Strong return — every rupee in ads brings back three or more. Worth scaling the best campaign."
            : revenue >= spend
              ? "You're profitable, but thin. Lowering CPC or lifting conversion would help most."
              : "Ads are costing more than they earn right now. Let's look at targeting before spending more."}
        </p>
      </div>
    </div>
  );
}

export default function Templates() {
  return (
    <section id="templates" className="lp-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="max-w-[720px]">
          <p className="lp-label" data-reveal="up">
            Templates
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="Starts out knowing your industry." />
          </h2>
          <p className="lp-lede mt-4" data-reveal="up" style={{ "--d": "160ms" }}>
            Every template looks the same on day one, then you make it yours. What changes is what it knows and the tools it brings.
          </p>
        </div>

        <div className="lp-tpl-grid lp-skew mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4" data-progress>
          {TEMPLATES.map((t, i) => (
            <article key={t.key} className="lp-tpl" data-spot data-reveal="up" style={{ "--d": `${i * 90}ms`, "--i": i }}>
              <div className="lp-tpl-photo">
                <div className="lp-tpl-parallax" data-parallax="-0.08">
                  <img decoding="async" src={t.photo} alt="" loading="lazy" />
                </div>
                <span className="lp-tpl-tag">{t.asks[0]}</span>
              </div>
              <div className="relative p-5">
                <h3 className="lp-display text-2xl text-[var(--lp-ink)]">{t.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">{t.line}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.asks.map((a) => (
                    <span key={a} className="lp-ask">
                      {a}
                    </span>
                  ))}
                </div>
                <Link to="/company/signup" className="lp-tpl-cta">
                  Start with {t.name} <FiArrowRight />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
          <div data-reveal="left">
            <p className="lp-label">Digital Marketing template</p>
            <h3 className="lp-display lp-h3 mt-3">Calculators that do the maths, not guesses.</h3>
            <p className="lp-lede mt-4 max-w-[480px]">
              When a visitor asks about ROAS or CPC, the numbers come from real formulas — the AI only explains them. The Energy template does the same for system sizing. Move the sliders.
            </p>
          </div>
          <MarketingCalculator />
        </div>
      </div>
    </section>
  );
}
