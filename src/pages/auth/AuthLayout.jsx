import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiLayers, FiDroplet, FiCode, FiGift } from "react-icons/fi";
import Mascot from "../landing/Mascot.jsx";
import "./auth.css";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Light page, landing fonts, page title — restored on the way out. */
function usePageSetup(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} · Nuformly`;
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => {
      document.title = prev;
      if (wasDark) html.classList.add("dark");
    };
  }, [title]);
}

// A short conversation that plays on a loop: what the assistant does while
// the company is away. Illustrative, like the landing page demos.
const SCRIPT = [
  { who: "me", text: "Hi! Do you deliver on Sundays?" },
  { who: "bot", text: "Yes 🙌 Orders placed before 2 pm arrive the same day." },
  { who: "me", text: "Great — can someone call me about a bulk order?" },
  { who: "sys", text: "Lead saved · your team was notified" },
];

function LiveChat() {
  const [n, setN] = useState(() => (reduced() ? SCRIPT.length : 0));
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (reduced()) return undefined;
    if (n >= SCRIPT.length) {
      const t = setTimeout(() => setN(0), 3800);
      return () => clearTimeout(t);
    }
    const next = SCRIPT[n];
    if (next.who === "bot" && !typing) {
      const t = setTimeout(() => setTyping(true), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setTyping(false);
        setN((x) => x + 1);
      },
      next.who === "bot" ? 1300 : n === 0 ? 700 : 1500,
    );
    return () => clearTimeout(t);
  }, [n, typing]);
  return (
    <div className="au-chat" aria-hidden="true">
      <div className="au-chat-head">
        <span className="au-chat-av">
          <Mascot className="h-full w-full" track={false} />
        </span>
        <span>
          <b>Your AI assistant</b>
          <small>
            <i /> Online · replies instantly
          </small>
        </span>
      </div>
      <div className="au-chat-body">
        {SCRIPT.slice(0, n).map((m, i) => (
          <p key={`${i}-${m.text}`} className={`au-msg ${m.who === "me" ? "is-me" : m.who === "sys" ? "is-sys" : ""}`}>
            {m.text}
          </p>
        ))}
        {typing && (
          <span className="au-typing">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
    </div>
  );
}

const PERKS = [
  { icon: FiGift, title: "Free plan, no card needed", sub: "1 chatbot · 200 conversations a month" },
  { icon: FiLayers, title: "Start from your industry", sub: "Templates for energy, education, marketing…" },
  { icon: FiDroplet, title: "Make it look like your brand", sub: "Colours, logo, fonts, motion — live preview" },
  { icon: FiCode, title: "Paste one line on your site", sub: "Every later change goes live on its own" },
];

function Perks({ active = 0 }) {
  return (
    <ul className="au-checks" aria-label="What you get">
      {PERKS.map((p, i) => (
        <li key={p.title} className={`au-check ${i <= active ? "is-on" : ""}`} style={{ "--i": i }}>
          <span>{i <= active ? <FiCheck /> : <p.icon />}</span>
          <div>
            {p.title}
            <small>{p.sub}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}

const ASIDE = {
  login: {
    title: (
      <>
        Your assistant kept working <em>while you were away.</em>
      </>
    ),
    sub: "Log in to see every conversation, every lead and every question your visitors asked.",
    content: <LiveChat />,
  },
  signup: {
    title: (
      <>
        Your AI assistant, <em>live this afternoon.</em>
      </>
    ),
    sub: "Create your free workspace in under a minute. No card, no code — just two short steps.",
  },
  recover: {
    title: (
      <>
        Happens to the <em>best of us.</em>
      </>
    ),
    sub: "We'll get you back into your workspace in a minute. Your chatbots keep answering visitors meanwhile.",
    content: <LiveChat />,
  },
};

/**
 * Two columns on desktop: the form on the left, a living brand panel on the
 * right (it repeats the landing page's look). Phones get the form only.
 */
export default function AuthLayout({ title, variant = "login", switcher, step = 0, children }) {
  usePageSetup(title);
  const aside = ASIDE[variant] || ASIDE.login;
  return (
    <div className="au">
      <main className="au-main">
        <header className="au-top">
          <Link to="/" className="au-brand au-display" aria-label="Nuformly home">
            <span className="au-brand-mark">
              <Mascot className="h-full w-full" track={false} />
            </span>
            Nuformly
          </Link>
          {switcher}
        </header>
        <div className="au-body">
          <div className="au-card">{children}</div>
        </div>
        <footer className="au-foot">
          <span>© {new Date().getFullYear()} Nuform Social</span>
          <span>
            <Link to="/">Home</Link>
            {" · "}
            <a href="mailto:info@nuformsocial.com">Help</a>
          </span>
        </footer>
      </main>

      <aside className="au-aside" aria-hidden="true">
        <span className="au-orb is-1" />
        <span className="au-orb is-2" />
        <div className="au-aside-head">
          <h2 className="au-display au-aside-title">{aside.title}</h2>
          <p className="au-aside-sub">{aside.sub}</p>
          {variant === "signup" ? <Perks active={step} /> : aside.content}
        </div>
        <div className="au-aside-foot">
          <div className="au-pills">
            <span>Free plan</span>
            <span>English & हिन्दी</span>
            <span>Website live chat</span>
          </div>
          <span className="au-mascot">
            <Mascot className="h-full w-full" />
          </span>
        </div>
      </aside>
    </div>
  );
}
