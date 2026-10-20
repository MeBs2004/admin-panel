import { SplitWords } from "./motion.jsx";
import { useEffect, useRef, useState } from "react";
import { FiZap, FiBookOpen, FiBarChart2, FiMessageSquare, FiCheck, FiCopy } from "react-icons/fi";
import { THEME_PRESETS } from "../../config/widgetStyle.js";
import { WIDGET_URL } from "../../config/widget.js";
import { buildSnippet } from "../chatbots/install/installUtils.js";
import { STEPS, TEMPLATES } from "./content.js";

const TEMPLATE_ICONS = { energy: FiZap, education: FiBookOpen, digital_marketing: FiBarChart2, general: FiMessageSquare };
const SNIPPET = buildSnippet({ widgetUrl: WIDGET_URL, chatbotId: "your-chatbot-id" });

function TemplateVisual() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TEMPLATES.map((t, i) => {
        const Icon = TEMPLATE_ICONS[t.key];
        return (
          <div key={t.key} className={`lp-mini-card ${i === 2 ? "is-picked" : ""}`} style={{ "--i": i }}>
            <span className="lp-mini-icon">
              <Icon />
            </span>
            <p className="mt-3 font-semibold text-[var(--lp-ink)]">{t.name}</p>
            <p className="mt-1 text-xs text-[var(--lp-muted)]">{t.asks[0]}</p>
            {i === 2 && (
              <span className="lp-picked">
                <FiCheck /> Picked
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KnowledgeVisual() {
  const lines = ["Website design & development", "SEO, social media & performance marketing", "Mobile app development", "Corporate AV & influencer marketing", "Delhi NCR · free consultation on request"];
  return (
    <div className="relative">
      <div className="lp-doc">
        <p className="lp-label">Knowledge base · services.txt</p>
        <div className="lp-scan" />
        {lines.map((l, i) => (
          <p key={l} className="lp-doc-line" style={{ "--i": i }}>
            {l}
          </p>
        ))}
      </div>
      <div className="lp-answer">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-leaf-ink)]">Visitor asked: “Do you do SEO?”</p>
        <p className="mt-1.5 text-sm text-[var(--lp-ink)]">Yes! SEO is one of our core services, alongside social media and performance marketing. Shall I book you a free consultation?</p>
      </div>
    </div>
  );
}

function StudioVisual() {
  const presets = THEME_PRESETS.slice(0, 6);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % presets.length), 1300);
    return () => clearInterval(t);
  }, [presets.length]);
  const [from, to] = presets[i].swatch;
  return (
    <div className="lp-studio-mini" style={{ "--a": from, "--b": to }}>
      <div className="lp-studio-win">
        <div className="lp-studio-head">
          <span className="h-7 w-7 rounded-full bg-white/25" />
          <span>
            <b>Your assistant</b>
            <small>Online</small>
          </span>
        </div>
        <div className="space-y-2 p-3">
          <div className="lp-studio-msg">Hi! How can I help today?</div>
          <div className="lp-studio-msg is-user">Show me your prices</div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, n) => (
            <span key={p.id} className={`lp-swatch ${n === i ? "is-on" : ""}`} style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }} title={p.name} />
          ))}
        </div>
        {["Launcher size", "Corner radius", "Font size"].map((l, n) => (
          <div key={l}>
            <p className="text-xs font-medium text-[var(--lp-muted)]">{l}</p>
            <div className="lp-slider">
              <span style={{ width: `${30 + ((i * 17 + n * 23) % 60)}%` }} />
            </div>
          </div>
        ))}
        <span className="lp-launch-dot" />
      </div>
    </div>
  );
}

function SnippetVisual() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= SNIPPET.length) return undefined;
    const t = setTimeout(() => setN((x) => x + 2), 22);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="lp-code">
      <div className="lp-code-bar">
        <span>index.html</span>
        <span className="flex items-center gap-1.5">
          {n >= SNIPPET.length ? <FiCheck /> : <FiCopy />} {n >= SNIPPET.length ? "Copied" : "Copy"}
        </span>
      </div>
      <pre>
        <span className="text-[#7c8b84]">{"<!-- before </body> -->"}</span>
        {"\n"}
        {SNIPPET.slice(0, n)}
        <span className="lp-caret lp-caret-light" />
      </pre>
      {n >= SNIPPET.length && <p className="lp-code-ok">✓ Widget connected · nuformsocial.com</p>}
    </div>
  );
}

const VISUALS = [TemplateVisual, KnowledgeVisual, StudioVisual, SnippetVisual];

export default function Steps() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number(e.target.dataset.step))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const Visual = VISUALS[active];

  return (
    <section id="how" className="lp-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="max-w-[720px]">
          <p className="lp-label" data-reveal="up">
            How it works
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="From sign-up to your first reply, in four steps." />
          </h2>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <ol className="relative" data-scrub>
            <span className="lp-step-rail" aria-hidden="true">
              <span />
            </span>
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                ref={(el) => (refs.current[i] = el)}
                data-step={i}
                className={`lp-step ${active === i ? "is-active" : ""}`}
              >
                <span className="lp-step-num">{i + 1}</span>
                <div>
                  <h3 className="lp-display text-2xl text-[var(--lp-ink)] sm:text-[28px]">{s.title}</h3>
                  <p className="mt-2 max-w-[440px] text-[var(--lp-muted)]">{s.body}</p>
                  <div className="lp-step-visual-inline lg:hidden">{(() => {
                    const V = VISUALS[i];
                    return <V />;
                  })()}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="hidden lg:block">
            <div className="lp-step-stage">
              <div key={active} className="lp-step-swap">
                <Visual />
              </div>
              <div className="lp-step-pips">
                {STEPS.map((s, i) => (
                  <span key={s.title} className={i === active ? "is-on" : ""} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
