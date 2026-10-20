import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiMessageCircle, FiMail, FiUserCheck, FiGlobe } from "react-icons/fi";
import ChatWidgetRenderer from "../../components/preview/ChatWidgetRenderer.jsx";
import Mascot from "./Mascot.jsx";
import { ScaledStage, prefersReducedMotion, useMedia } from "./motion.jsx";
import { DEMO_CONFIG, demoReply } from "./demoBot.js";
import nsLogo from "../../assets/nuformsocial/logo.svg";
import nsRocket from "../../assets/nuformsocial/rocket.png";

// The last part keeps changing: it deletes itself and types the next one.
const ROTATING = ["team member.", "sales rep.", "help desk.", "night shift.", "lead catcher."];
const HEADLINE = ["Hi 👋 I'm your ", "newest ", ROTATING[0]];

/** The headline arrives the way the widget's greeting does: dots, then typing. */
function useTyped(parts, startDelay = 700, speed = 42) {
  const total = useMemo(() => parts.reduce((n, p) => n + Array.from(p).length, 0), [parts]);
  const [count, setCount] = useState(() => (prefersReducedMotion() ? total : 0));
  const [stage, setStage] = useState(() => (prefersReducedMotion() ? "done" : "dots"));
  useEffect(() => {
    if (stage === "done") return undefined;
    if (stage === "dots") {
      const t = setTimeout(() => setStage("typing"), startDelay);
      return () => clearTimeout(t);
    }
    if (count >= total) {
      setStage("done");
      return undefined;
    }
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [stage, count, total, startDelay, speed]);
  return { count, stage };
}

/** After the first typing finishes: hold → delete → type the next word → hold … */
function useRotatingWord(words, active) {
  const [index, setIndex] = useState(0);
  const [len, setLen] = useState(() => Array.from(words[0]).length);
  const [mode, setMode] = useState("hold");
  useEffect(() => {
    if (!active || prefersReducedMotion()) return undefined;
    const full = Array.from(words[index]).length;
    let t;
    if (mode === "hold") t = setTimeout(() => setMode("delete"), 2400);
    else if (mode === "delete") {
      if (len > 0) t = setTimeout(() => setLen((n) => n - 1), 40);
      else
        t = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setMode("type");
        }, 280);
    } else if (len < full) t = setTimeout(() => setLen((n) => n + 1), 80);
    else setMode("hold");
    return () => clearTimeout(t);
  }, [active, words, index, len, mode]);
  return { text: Array.from(words[index]).slice(0, len).join(""), mode };
}

function TypedHeadline() {
  const { count, stage } = useTyped(HEADLINE);
  const done = stage === "done";
  const word = useRotatingWord(ROTATING, done);
  let left = count;
  const pieces = HEADLINE.map((part) => {
    const chars = Array.from(part);
    const cut = Math.max(0, Math.min(chars.length, left));
    left -= chars.length;
    return { shown: chars.slice(0, cut).join(""), hidden: chars.slice(cut).join("") };
  });
  const caretAt = stage === "typing" ? pieces.findIndex((p) => p.hidden) : -1;
  // the changing word: during the first typing it follows the typewriter, then the rotation
  const live = done ? word.text : pieces[2].shown;
  const caret = caretAt === 2 || (done && word.mode !== "hold");
  return (
    <h1 className="lp-display lp-h1" aria-label={`Hi, I'm your newest ${ROTATING[0]}`}>
      <span aria-hidden="true">
        {pieces.slice(0, 2).map(({ shown, hidden }, i) => (
          <span key={i}>
            {shown}
            {caretAt === i ? <span className="lp-caret" /> : null}
            <span className="lp-ghost">{hidden}</span>
          </span>
        ))}
        {/* every word sits invisibly in the same cell, so the box is always as wide as
            the longest one and nothing around it moves while the words change */}
        <span className="lp-rotator">
          {ROTATING.map((w) => (
            <span key={w} className="lp-rotator-sizer">
              {w}
            </span>
          ))}
          <span className={`lp-marker ${done && word.mode === "hold" ? "is-on" : ""}`}>
            {live}
            {caret ? <span className="lp-caret" /> : null}
          </span>
        </span>
      </span>
      {stage === "dots" && (
        <span className="lp-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </h1>
  );
}

/** The demo runs on a mock of nuformsocial.com — real name, logo, artwork and figures from that site. */
function MockSite({ compact }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <img decoding="async" src={nsLogo} alt="Nuform Social" className="h-[26px] w-auto" />
        <div className="flex items-center gap-4 text-[11.5px] font-medium text-gray-500">
          {!compact && (
            <>
              <span>Services</span>
              <span>Portfolio</span>
              <span>Blogs</span>
            </>
          )}
          <span className="rounded-full bg-[#B5470B] px-3 py-1.5 font-semibold text-white">Book a Meeting</span>
        </div>
      </div>
      {/* artwork on the left: it stays visible beside the open chat window */}
      <div className="relative mx-6 h-[262px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#f4f1fb] via-white to-[#eef8f2]">
        <img decoding="async" src={nsRocket} alt="" className={`absolute -left-8 bottom-0 w-auto ${compact ? "h-[170px]" : "h-[250px]"}`} />
        <div className={`absolute right-6 top-7 text-right ${compact ? "max-w-[190px]" : "max-w-[240px]"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B5470B]">Digital marketing · Delhi NCR</p>
          <p className={`mt-2 font-bold leading-[1.08] text-[#1f1d2b] ${compact ? "text-[19px]" : "text-[24px]"}`}>Empowering your growth with smart, scalable solutions</p>
          <span className="mt-4 inline-block rounded-full bg-[#0F7A47] px-4 py-2 text-[11.5px] font-semibold text-white">Book a Free Consultation</span>
        </div>
      </div>
      <div className={`grid gap-3 px-6 pt-4 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
        {[
          ["200+", "Websites delivered"],
          ["500+", "Campaigns managed"],
          ["95.5%", "Satisfied clients"],
        ]
          .slice(0, compact ? 2 : 3)
          .map(([n, l]) => (
          <div key={l} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-[18px] font-bold text-[#0F7A47]">{n}</p>
            <p className="text-xs font-medium text-gray-600">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hero layers lean with the pointer: --hx/--hy run from -1 to 1. */
function usePointerDepth(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia?.("(hover: hover)").matches) return undefined;
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty("--hx", x.toFixed(3));
          el.style.setProperty("--hy", y.toFixed(3));
        });
    };
    el.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
    };
  }, [ref]);
}

const FLOAT_CARDS = [
  { cls: "lp-fcard-1", icon: FiMail, title: "New lead captured", sub: "riya@example.com · from /pricing", tone: "mint" },
  { cls: "lp-fcard-2", icon: FiUserCheck, title: "Handed to Priya", sub: "Visitor asked for a person", tone: "signal" },
  { cls: "lp-fcard-3", icon: FiGlobe, title: "Replied in हिन्दी", sub: "Language switched automatically", tone: "indigo" },
];

export default function Hero({ startHref }) {
  const heroRef = useRef(null);
  // phones: a narrower demo stage (the chat window still fits), so it's drawn bigger
  const narrow = useMedia("(max-width: 640px)");
  const stageW = narrow ? 410 : 560;
  usePointerDepth(heroRef);
  const [demo, setDemo] = useState({ mode: "widget", n: 0 });
  // The demo opens itself a few seconds in, with one of the real auto-open animations.
  const config = useMemo(
    () => ({ ...DEMO_CONFIG, behavior: { ...DEMO_CONFIG.behavior, autoOpen: demo.n === 0, autoOpenDelay: 5, autoOpenAnimation: "elastic" } }),
    [demo.n],
  );
  const openDemo = () => {
    setDemo((d) => ({ mode: "window", n: d.n + 1 }));
    if (window.innerWidth < 1024) document.getElementById("lp-demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section ref={heroRef} className="lp-hero relative overflow-hidden" id="top" data-exit>
      <div className="lp-hero-wash" aria-hidden="true" />
      <div className="lp-orbs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="lp-float-bubbles" aria-hidden="true">
        <span style={{ "--x": "37%", "--y": "10%", "--t": "11s" }}>Need a website?</span>
      </div>

      <div className="relative mx-auto grid max-w-[1240px] items-start gap-12 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-20 lg:pt-24">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow lp-load" style={{ "--d": "0ms" }}>
            <span className="lp-live-dot" /> AI chat assistant for your website
          </p>

          <div className="mt-5 flex items-end gap-3 sm:gap-5">
            <button type="button" onClick={openDemo} className="lp-avatar lp-load" style={{ "--d": "120ms" }} aria-label="Open the demo chat">
              <span className="lp-ring" />
              <span className="lp-ring lp-ring-2" />
              <Mascot className="relative h-full w-full" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="lp-bubble lp-load" style={{ "--d": "220ms" }}>
                <TypedHeadline />
              </div>
              <p className="lp-meta lp-load" style={{ "--d": "320ms" }}>
                Nuformly Assistant · just now
              </p>
            </div>
          </div>

          <p className="lp-lede lp-load mt-5 max-w-[560px]" style={{ "--d": "420ms" }}>
            Nuformly builds an AI assistant that knows your business, looks like your brand and answers visitors on your website — day and night. Set it up in an afternoon, then paste one line of code.
          </p>

          <div className="lp-load lp-hero-ctas mt-7 flex flex-wrap items-center gap-3" style={{ "--d": "520ms" }}>
            <Link to={startHref} className="lp-btn lp-btn-primary" data-magnet>
              Start free <FiArrowRight />
            </Link>
            <button type="button" onClick={openDemo} className="lp-btn lp-btn-ghost" data-magnet>
              <FiMessageCircle /> Chat with the demo
            </button>
          </div>
          <p className="lp-load mt-4 text-sm text-[var(--lp-muted)]" style={{ "--d": "600ms" }}>
            Free plan · no card needed · English & हिन्दी
          </p>

        </div>

        <div id="lp-demo" className="lp-load relative" style={{ "--d": "300ms" }}>
          {FLOAT_CARDS.map((c, i) => (
            <div key={c.cls} className={`lp-fcard ${c.cls}`} style={{ "--d": `${1400 + i * 450}ms` }} aria-hidden="true">
              <span className={`lp-fcard-ico is-${c.tone}`}>
                <c.icon />
              </span>
              <span>
                <b>{c.title}</b>
                <small>{c.sub}</small>
              </span>
            </div>
          ))}
          <div className="lp-browser">
            <div className="lp-browser-bar">
              <i />
              <i />
              <i />
              <span>nuformsocial.com</span>
              <em>Live demo</em>
            </div>
            <ScaledStage width={stageW} height={690} fitViewport={150}>
              <div className="relative h-[690px] overflow-hidden" style={{ width: stageW }}>
                <MockSite compact={narrow} />
                <ChatWidgetRenderer key={`${demo.mode}-${demo.n}`} config={config} mode={demo.mode} replyFor={demoReply} />
              </div>
            </ScaledStage>
          </div>
          <p className="lp-note">This is the real widget, the same one your visitors get. Type into it.</p>
        </div>
      </div>
    </section>
  );
}
