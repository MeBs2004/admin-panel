import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUserPlus, FiMessageCircle, FiCalendar, FiMail, FiSend, FiCheck, FiMoon, FiPhoneCall, FiBriefcase, FiCpu, FiAlertTriangle, FiShield, FiActivity } from "react-icons/fi";
import Mascot from "../landing/Mascot.jsx";
import "./auth.css";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Light page, page title — restored on the way out. */
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

function Brand({ light = false }) {
  return (
    <Link to="/" className={`au-brand ${light ? "is-light" : ""}`} aria-label="Nuformly home">
      <span className="au-brand-mark">
        <Mascot className="h-full w-full" track={false} />
      </span>
      Nuformly
    </Link>
  );
}

/* ── Login / recovery scene: what the assistant did overnight (an example) ── */

const EVENTS = [
  { icon: FiUserPlus, tone: "lead", title: "New lead", detail: "Ananya left her number for a callback", time: "11:42 pm" },
  { icon: FiMessageCircle, tone: "chat", title: "Question answered", detail: "“Do you deliver on Sundays?”", time: "1:15 am" },
  { glyph: "अ", tone: "hindi", title: "Chat in Hindi", detail: "“क्या आप EMI देते हैं?” — answered in Hindi", time: "2:08 am" },
  { icon: FiCalendar, tone: "lead", title: "Demo booked", detail: "Rahul picked Friday, 11 am", time: "6:51 am" },
  { icon: FiPhoneCall, tone: "chat", title: "Handed to your team", detail: "Wholesale enquiry flagged for a call", time: "7:20 am" },
  { icon: FiMessageCircle, tone: "chat", title: "Question answered", detail: "“What are your opening hours?”", time: "8:03 am" },
];

function useCount(to, ms = 1100) {
  const [n, setN] = useState(() => (reduced() ? to : 0));
  useEffect(() => {
    if (reduced()) return undefined;
    let raf;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return n;
}

export function OvernightDigest() {
  // Newest first; a new event slides in every few seconds.
  const [head, setHead] = useState(3);
  useEffect(() => {
    if (reduced()) return undefined;
    const t = setInterval(() => setHead((h) => h + 1), 2800);
    return () => clearInterval(t);
  }, []);
  const shown = [0, 1, 2, 3].map((k) => ({ ...EVENTS[(head - k + EVENTS.length * 10) % EVENTS.length], key: head - k }));
  const chats = useCount(23);
  const leads = useCount(6);
  return (
    <div className="au-digest" aria-hidden="true">
      <div className="au-digest-head">
        <span className="au-digest-moon">
          <FiMoon />
        </span>
        <div>
          <b>While you were away</b>
          <small>Last night · 10 pm – 9 am</small>
        </div>
        <span className="au-tag">Example</span>
      </div>
      <div className="au-stats">
        <div>
          <b>{chats}</b>
          <span>conversations</span>
        </div>
        <div>
          <b>{leads}</b>
          <span>new leads</span>
        </div>
        <div>
          <b>0</b>
          <span>left waiting</span>
        </div>
      </div>
      <ol className="au-feed">
        {shown.map((e, i) => {
          const Icon = e.icon;
          return (
            <li key={e.key} className={`au-event ${i === 0 ? "is-new" : ""}`}>
              <span className={`au-event-icon is-${e.tone}`}>{Icon ? <Icon /> : <b>{e.glyph}</b>}</span>
              <div>
                <b>{e.title}</b>
                <span>{e.detail}</span>
              </div>
              <time>{e.time}</time>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Platform login scene: activity across every company (an example) ── */

const PLATFORM_EVENTS = [
  { icon: FiBriefcase, tone: "lead", title: "New company", detail: "Horizon Dental joined the platform", time: "11:58 pm" },
  { icon: FiCpu, tone: "chat", title: "Chatbot went live", detail: "Support Bot — Acme Retail", time: "12:40 am" },
  { icon: FiUserPlus, tone: "lead", title: "Admin invited", detail: "Priya added as admin at Zenith Labs", time: "1:22 am" },
  { icon: FiAlertTriangle, tone: "hindi", title: "Usage alert", detail: "Nova Finance neared its monthly message cap", time: "3:05 am" },
  { icon: FiCpu, tone: "chat", title: "Chatbot paused", detail: "Billing hold on Delta Motors", time: "5:47 am" },
  { icon: FiShield, tone: "lead", title: "Access reviewed", detail: "Role updated for 2 admins", time: "7:10 am" },
];

export function PlatformPulse() {
  const [head, setHead] = useState(3);
  useEffect(() => {
    if (reduced()) return undefined;
    const t = setInterval(() => setHead((h) => h + 1), 2800);
    return () => clearInterval(t);
  }, []);
  const shown = [0, 1, 2, 3].map((k) => ({ ...PLATFORM_EVENTS[(head - k + PLATFORM_EVENTS.length * 10) % PLATFORM_EVENTS.length], key: head - k }));
  const companies = useCount(38);
  const chatbots = useCount(97);
  const admins = useCount(54);
  return (
    <div className="au-digest" aria-hidden="true">
      <div className="au-digest-head">
        <span className="au-digest-moon">
          <FiActivity />
        </span>
        <div>
          <b>Platform pulse</b>
          <small>Across every company, right now</small>
        </div>
        <span className="au-tag">Example</span>
      </div>
      <div className="au-stats">
        <div>
          <b>{companies}</b>
          <span>companies</span>
        </div>
        <div>
          <b>{chatbots}</b>
          <span>chatbots live</span>
        </div>
        <div>
          <b>{admins}</b>
          <span>admins online</span>
        </div>
      </div>
      <ol className="au-feed">
        {shown.map((e, i) => {
          const Icon = e.icon;
          return (
            <li key={e.key} className={`au-event ${i === 0 ? "is-new" : ""}`}>
              <span className={`au-event-icon is-${e.tone}`}>{Icon ? <Icon /> : <b>{e.glyph}</b>}</span>
              <div>
                <b>{e.title}</b>
                <span>{e.detail}</span>
              </div>
              <time>{e.time}</time>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Sign-up scene: the assistant takes shape from what's typed on the right ── */

const INDUSTRY_PREVIEW = {
  Energy: { line: "I can help you find the right solar setup and book a free site survey.", chips: ["Can solar cut my bill?", "Book a site survey", "Subsidies available?", "Talk to an expert"] },
  Education: { line: "Ask me about courses, fees, admissions or campus visits.", chips: ["Which courses do you offer?", "Fees & scholarships", "Admission dates", "Book a campus visit"] },
  "Digital Marketing": { line: "I can walk you through our services and set up a strategy call.", chips: ["What does a campaign cost?", "Do you run Meta ads?", "See our work", "Book a strategy call"] },
  Technology: { line: "Tell me what you're building — I'll point you to the right team.", chips: ["Do you build mobile apps?", "Get a project quote", "Support hours", "Talk to a developer"] },
  Finance: { line: "I can answer questions about accounts, loans and investments.", chips: ["Open an account", "Check loan eligibility", "Interest rates", "Talk to an advisor"] },
  Healthcare: { line: "I can share clinic timings, doctors and help you book a visit.", chips: ["Book an appointment", "Clinic timings", "Which doctors are in?", "Insurance accepted?"] },
  "E-commerce": { line: "Ask me about orders, delivery, returns or our latest collection.", chips: ["Where is my order?", "Return policy", "Do you ship to my city?", "New arrivals"] },
  Other: { line: "Ask me anything about what we do — I reply instantly, day or night.", chips: ["What do you offer?", "Pricing", "Opening hours", "Talk to the team"] },
};

export function AssistantPreview({ company = "", industry = "", email = "", firstName = "", ready = false }) {
  const name = company.trim();
  const preview = INDUSTRY_PREVIEW[industry];
  const initial = (name.match(/[\p{L}\p{N}]/u)?.[0] || "N").toUpperCase();
  return (
    <div className="au-widget" aria-hidden="true">
      <div className="au-widget-head">
        <span key={initial} className="au-widget-av">
          {initial}
        </span>
        <div className="au-widget-title">
          <b key={name} className="au-swap">
            {name ? `${name} Assistant` : "Your Assistant"}
          </b>
          <small>
            <i /> Online · replies instantly
          </small>
        </div>
      </div>
      <div className="au-widget-body">
        <p className="au-bubble">
          Hi there! 👋 Welcome to <b>{name || "your company"}</b>.{" "}
          <span key={industry || "none"} className="au-swap">
            {preview ? preview.line : "How can I help you today?"}
          </span>
        </p>
        <div className="au-chips">
          {preview
            ? preview.chips.map((c, i) => (
                <span key={`${industry}-${c}`} className="au-chip" style={{ "--i": i }}>
                  {c}
                </span>
              ))
            : [0, 1, 2, 3].map((i) => <span key={i} className="au-chip is-ghost" style={{ "--i": i }} />)}
        </div>
        {(email || firstName) && (
          <div className="au-leadcard">
            <FiMail aria-hidden="true" />
            <span>
              New leads go to <b>{email.trim() || "your inbox"}</b>
              {firstName ? <> · {firstName} gets notified</> : null}
            </span>
          </div>
        )}
        {ready && (
          <div className="au-ready">
            <FiCheck /> Ready to go live on your website
          </div>
        )}
      </div>
      <div className="au-widget-foot">
        <span className="au-widget-input">Type a message…</span>
        <span className="au-widget-send">
          <FiSend />
        </span>
      </div>
      <p className="au-widget-brand">
        Powered by <b>Nuformly</b>
      </p>
    </div>
  );
}

const STAGE = {
  platform: {
    title: (
      <>
        Run the whole platform <em>from one place.</em>
      </>
    ),
    sub: "Sign in to manage every company, chatbot and conversation on Nuformly.",
  },
  login: {
    title: (
      <>
        Your assistant kept working <em>while you were away.</em>
      </>
    ),
    sub: "Log in to see every conversation, lead and question from your visitors.",
  },
  signup: {
    title: (
      <>
        Watch your assistant <em>take shape.</em>
      </>
    ),
    sub: "Everything you type on the right becomes your chatbot. Free plan, no card needed.",
  },
  recover: {
    title: (
      <>
        Locked out? <em>Your chatbots aren’t.</em>
      </>
    ),
    sub: "They keep answering visitors while you reset your password.",
  },
};

/**
 * Desktop: the brand stage on the left, the form on the right.
 * Below 1024px the stage is hidden and the form gets the whole screen.
 * `scene` replaces the stage's illustration (sign-up passes its live preview).
 */
export default function AuthLayout({ title, variant = "login", switcher, scene, children }) {
  usePageSetup(title);
  const stage = STAGE[variant] || STAGE.login;
  return (
    <div className="au">
      <aside className={`au-stage is-${variant}`} aria-hidden="true">
        <div className="au-stage-top">
          <Brand light />
        </div>
        <div className="au-stage-copy">
          <h2 className="au-display au-stage-title">{stage.title}</h2>
          <p className="au-stage-sub">{stage.sub}</p>
        </div>
        <div className="au-scene">{scene || <OvernightDigest />}</div>
        <div className="au-stage-foot">
          <span>Free plan</span>
          <span>English &amp; हिन्दी</span>
          <span>Set up in minutes</span>
        </div>
        <span className="au-peek">
          <Mascot className="h-full w-full" />
        </span>
      </aside>

      <main className="au-main">
        <header className="au-top">
          <span className="au-top-brand">
            <Brand />
          </span>
          {switcher}
        </header>
        <div className="au-body">
          <div className="au-card">{children}</div>
        </div>
        <footer className="au-foot">
          <span>© {new Date().getFullYear()} Nuform Social</span>
          <span>
            <Link to="/">Home</Link>
            <a href="mailto:info@nuformsocial.com">Help</a>
          </span>
        </footer>
      </main>
    </div>
  );
}
