import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight, FiArrowUp } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import Mascot from "./Mascot.jsx";
import Hero from "./Hero.jsx";
import Steps from "./Steps.jsx";
import Playground from "./Playground.jsx";
import Templates from "./Templates.jsx";
import Insights from "./Insights.jsx";
import Statement from "./Statement.jsx";
import PhoneDemo from "./PhoneDemo.jsx";
import Stats from "./Stats.jsx";
import { Channels, Pricing, Faq, FinalCta, Footer } from "./Sections.jsx";
import { useReveal, usePointerFx, useScrollProgress, useScrollFx, CursorGlow } from "./motion.jsx";
import { CAPABILITIES } from "./content.js";
import "./landing.css";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,500..800&family=Instrument+Sans:wght@400..700&family=JetBrains+Mono:wght@400;600&display=swap";

const LINKS = [
  ["#how", "How it works"],
  ["#studio", "Studio"],
  ["#templates", "Templates"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
];

/** Which of the nav's sections is in the middle of the screen right now. */
function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    const ids = ["top", ...LINKS.map(([href]) => href.slice(1))];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return active;
}

function Nav({ startHref, dashboardHref }) {
  const { progress, scrolled } = useScrollProgress();
  const active = useActiveSection();
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    // tap outside, or grow to desktop width: close
    const onDown = (e) => !headerRef.current?.contains(e.target) && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header ref={headerRef} className={`lp-nav ${scrolled || open ? "is-scrolled" : ""}`}>
      <span className="lp-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" className="flex min-h-[44px] items-center gap-2.5" aria-label="Nuformly home">
          <span className="h-9 w-7">
            <Mascot className="h-full w-full" track={false} />
          </span>
          <span className="lp-display text-[22px] text-[var(--lp-ink)]">Nuformly</span>
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className={`lp-nav-link ${active === href ? "is-active" : ""}`} aria-current={active === href ? "true" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {dashboardHref ? (
            <Link to={dashboardHref} className="lp-btn lp-btn-primary lp-btn-sm">
              Open dashboard <FiArrowRight />
            </Link>
          ) : (
            <>
              <Link to="/company/login" className="lp-nav-link hidden sm:inline-flex">
                Log in
              </Link>
              <Link to={startHref} className="lp-btn lp-btn-primary lp-btn-sm" data-magnet>
                Start free
              </Link>
            </>
          )}
          <button type="button" className="lp-burger lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="lp-menu" onClick={() => setOpen((v) => !v)}>
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      <nav id="lp-menu" aria-label="Menu" className={`lp-sheet lg:hidden ${open ? "is-open" : ""}`} inert={!open}>
        {LINKS.map(([href, label], i) => (
          <a key={href} href={href} onClick={() => setOpen(false)} style={{ "--i": i }}>
            {label}
          </a>
        ))}
        {!dashboardHref && (
          <Link to="/company/login" style={{ "--i": LINKS.length }}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}

/** Two crossed ribbons of capabilities: they loop on their own and drift with the scroll. */
function Ribbons() {
  const row = (items) =>
    [0, 1].map((copy) => (
      <div key={copy} className="lp-marquee-track" aria-hidden={copy === 1}>
        {items.map((c) => (
          <span key={c} className="lp-pill">
            <i /> {c}
          </span>
        ))}
      </div>
    ));
  const half = Math.ceil(CAPABILITIES.length / 2);
  return (
    <section className="lp-ribbons lp-skew" aria-label="What the assistant can do">
      <div className="lp-ribbon is-dark">
        <div data-drift="-0.25">
          <div className="lp-marquee-row">{row(CAPABILITIES.slice(0, half))}</div>
        </div>
      </div>
      <div className="lp-ribbon is-light">
        <div data-drift="0.25">
          <div className="lp-marquee-row is-reverse">{row(CAPABILITIES.slice(half))}</div>
        </div>
      </div>
    </section>
  );
}

/** Giant outlined words that slide in opposite directions as you scroll. */
function BigWords() {
  const line = "Ask · Answer · Convert · Ask · Answer · Convert · ";
  return (
    <div className="lp-bigwords" aria-hidden="true">
      <div className="lp-bigword" data-drift="0.6" data-drift-max="520">
        {line}
      </div>
      <div className="lp-bigword is-solid" data-drift="-0.6" data-drift-max="520">
        {line}
      </div>
    </div>
  );
}

function BackToTop() {
  const { progress } = useScrollProgress();
  const C = 2 * Math.PI * 21;
  return (
    <a href="#top" className={`lp-top ${progress > 0.06 ? "is-on" : ""}`} aria-label="Back to top">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" className="lp-top-track" />
        <circle cx="24" cy="24" r="21" className="lp-top-fill" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - progress) }} />
      </svg>
      <FiArrowUp />
    </a>
  );
}

/** Sets a <meta name> tag; returns a function that puts it back. */
function setMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  const created = !el;
  const prev = el?.getAttribute("content");
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return () => (created ? el.remove() : el.setAttribute("content", prev));
}

/** Public marketing page at "/". Logged-in staff get a shortcut back to their panel. */
export default function Landing() {
  const rootRef = useRef(null);
  const { user } = useAuth();
  useReveal(rootRef);
  usePointerFx(rootRef);
  useScrollFx(rootRef);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Nuformly — AI chat assistant for your website";
    let link = document.querySelector(`link[href="${FONTS_HREF}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONTS_HREF;
      document.head.appendChild(link);
    }
    // the admin shell may have left the dark theme on <html>
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) html.style.scrollBehavior = "smooth";
    const restoreMeta = [
      setMeta("description", "Nuformly builds an AI chat assistant that knows your business, looks like your brand and answers visitors on your website. Free to start."),
      setMeta("theme-color", "#0d5537"),
    ];
    // the page is lazy-loaded, so the browser can't honour /#pricing on its own
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "instant", block: "start" }));
    return () => {
      document.title = prevTitle;
      if (wasDark) html.classList.add("dark");
      html.style.scrollBehavior = "";
      restoreMeta.forEach((undo) => undo());
    };
  }, []);

  const dashboardHref = user ? (user.role === "SUPER_ADMIN" ? "/dashboard" : "/company/overview") : null;
  const startHref = "/company/signup";

  return (
    <div ref={rootRef} className="lp">
      <a href="#main" className="lp-skip">
        Skip to content
      </a>
      <Nav startHref={startHref} dashboardHref={dashboardHref} />
      <main id="main" tabIndex={-1}>
        <Hero startHref={startHref} />
        <Ribbons />
        <Statement />
        <Steps />
        <PhoneDemo />
        <Playground />
        <Stats />
        <Templates />
        <Insights />
        <Channels />
        <Pricing startHref={startHref} />
        <BigWords />
        <Faq />
        <FinalCta startHref={startHref} />
      </main>
      <Footer />
      <div className="lp-aura" aria-hidden="true" />
      <BackToTop />
      <CursorGlow />
    </div>
  );
}
