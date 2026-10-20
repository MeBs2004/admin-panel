import { useState } from "react";
import { Link } from "react-router-dom";
import { FiGlobe, FiCheck, FiPlus, FiArrowRight, FiCopy } from "react-icons/fi";
import { FaTelegramPlane, FaWhatsapp, FaInstagram, FaFacebookMessenger } from "react-icons/fa";
import { WIDGET_URL } from "../../config/widget.js";
import { buildSnippet } from "../chatbots/install/installUtils.js";
import Mascot from "./Mascot.jsx";
import { CountUp, SplitWords } from "./motion.jsx";
import { CHANNELS, PLANS, PLAN_ROWS, EVERY_PLAN, FAQ } from "./content.js";

const CHANNEL_ICONS = { website: FiGlobe, telegram: FaTelegramPlane, whatsapp: FaWhatsapp, instagram: FaInstagram, messenger: FaFacebookMessenger };

const CODE = {
  Install: buildSnippet({ widgetUrl: WIDGET_URL, chatbotId: "your-chatbot-id" }),
  "Send a message": `curl -X POST https://<your-api>/api/v1/developer/chatbots/<id>/messages \\
  -H "Authorization: Bearer nf_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "text": "Do you build websites?", "visitorId": "crm-4821" }'`,
  Webhooks: `// We POST to your URL when things happen:
conversation.created
conversation.handoff     // a visitor asked for a person
message.created
visitor.created`,
};

const TABS = Object.keys(CODE);

export function Channels() {
  const [tab, setTab] = useState("Install");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CODE[tab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  // arrow keys move between tabs, as in any tab list
  const onTabKey = (e) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + dir + TABS.length) % TABS.length];
    setTab(next);
    e.currentTarget.parentElement.querySelector(`[data-tab="${next}"]`)?.focus();
  };
  return (
    <section id="developers" className="lp-section">
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="lp-label" data-reveal="up">
            Channels & developers
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="One assistant, wherever your customers are." />
          </h2>
          <p className="lp-lede mt-4 max-w-[520px]" data-reveal="up" style={{ "--d": "160ms" }}>
            Start with your website today. Developers get API keys, scoped permissions and webhooks to plug conversations into a CRM or anything else.
          </p>

          <div className="lp-code mt-8" data-reveal="up" style={{ "--d": "240ms" }}>
            <div className="lp-code-tabs">
              <div role="tablist" aria-label="Code examples" className="flex gap-1">
              {TABS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  id={`lp-tab-${TABS.indexOf(k)}`}
                  data-tab={k}
                  aria-selected={tab === k}
                  aria-controls="lp-code-panel"
                  tabIndex={tab === k ? 0 : -1}
                  className={tab === k ? "is-on" : ""}
                  onClick={() => setTab(k)}
                  onKeyDown={onTabKey}
                >
                  {k}
                </button>
              ))}
              </div>
              <button type="button" className={`lp-copy ${copied ? "is-done" : ""}`} onClick={copy} aria-live="polite">
                {copied ? <FiCheck /> : <FiCopy />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre key={tab} id="lp-code-panel" role="tabpanel" aria-labelledby={`lp-tab-${TABS.indexOf(tab)}`} tabIndex={0} className="lp-code-swap">
              {CODE[tab]}
            </pre>
          </div>
        </div>

        <div className="lp-orbit-wrap" data-reveal="scale">
          <div className="lp-orbit" aria-hidden="true">
            <span className="lp-orbit-ring" />
            <span className="lp-orbit-ring lp-orbit-ring-2" />
          </div>
          <div className="lp-orbit-core">
            <Mascot className="h-full w-full" title="Your assistant" />
          </div>
          <ul className="lp-orbit-items">
            {CHANNELS.map((c, i) => (
              <li key={`spoke-${c.key}`} className={`lp-spoke ${c.live ? "is-live" : ""}`} style={{ "--i": i, "--n": CHANNELS.length }} aria-hidden="true">
                <i />
              </li>
            ))}
            {CHANNELS.map((c, i) => {
              const Icon = CHANNEL_ICONS[c.key];
              return (
                <li key={c.key} className="lp-orbit-item" style={{ "--i": i, "--n": CHANNELS.length }}>
                  <span className={`lp-channel ${c.live ? "is-live" : ""}`}>
                    <Icon />
                    <b>{c.label}</b>
                    <small>{c.live ? "Live" : "Soon"}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Pricing({ startHref }) {
  return (
    <section id="pricing" className="lp-section lp-pricing-band">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="lp-label" data-reveal="up">
            Pricing
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="Start free. Grow when your chats do." />
          </h2>
          <p className="lp-lede mx-auto mt-4 max-w-[560px]" data-reveal="up" style={{ "--d": "160ms" }}>
            Every plan has every feature. Plans only differ in how much you use.
          </p>
        </div>

        <div className="lp-plan-grid lp-skew mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-progress>
          {PLANS.map((p, i) => {
            const free = p.price === 0;
            return (
              <div key={p.id} className={`lp-plan ${free ? "is-free" : ""}`} data-spot data-reveal="up" style={{ "--d": `${i * 80}ms`, "--i": i }}>
                <p className="font-semibold text-[var(--lp-ink)]">{p.name}</p>
                <p className="lp-display mt-3 text-[34px] leading-none text-[var(--lp-ink)]">{free ? "₹0" : "Let's talk"}</p>
                <p className="mt-1 text-xs text-[var(--lp-muted)]">{free ? "forever" : "priced for your volume"}</p>
                <ul className="mt-6 space-y-2.5">
                  {PLAN_ROWS.map(([key, label]) => (
                    <li key={key} className="flex items-baseline gap-2 text-sm">
                      <b className="font-mono text-[var(--lp-ink)]">
                        <CountUp to={p.limits[key]} />
                      </b>
                      <span className="text-[var(--lp-muted)]">{p.limits[key] === 1 ? label.replace(/s$/, "") : label}</span>
                    </li>
                  ))}
                </ul>
                {free ? (
                  <Link to={startHref} className="lp-btn lp-btn-primary mt-7 w-full justify-center">
                    Start free
                  </Link>
                ) : (
                  <a href={`mailto:info@nuformsocial.com?subject=${encodeURIComponent(`Nuformly ${p.name} plan`)}`} className="lp-btn lp-btn-ghost mt-7 w-full justify-center">
                    Contact sales
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3" data-reveal="up">
          <span className="lp-label">On every plan</span>
          {EVERY_PLAN.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-sm text-[var(--lp-ink)]">
              <FiCheck className="text-[var(--lp-leaf)]" /> {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="lp-section">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="lp-label" data-reveal="up">
            Questions
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="Asked often, answered here." />
          </h2>
          <p className="lp-lede mt-4" data-reveal="up" style={{ "--d": "160ms" }}>
            Anything else? The assistant in the corner knows the basics too.
          </p>
        </div>
        <div className="divide-y divide-[var(--lp-line)] border-y border-[var(--lp-line)]">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} data-reveal="up" style={{ "--d": `${i * 60}ms` }}>
                <button type="button" id={`lp-faq-q${i}`} className="lp-faq-q" aria-expanded={isOpen} aria-controls={`lp-faq-a${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span>{f.q}</span>
                  <FiPlus className={`lp-faq-icon ${isOpen ? "is-open" : ""}`} />
                </button>
                <div
                  id={`lp-faq-a${i}`}
                  role="region"
                  aria-labelledby={`lp-faq-q${i}`}
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pr-10 text-[var(--lp-muted)]">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ startHref }) {
  return (
    <section className="px-5 pb-10 sm:px-8" data-progress>
      <div className="lp-final mx-auto max-w-[1240px]" data-reveal="scale">
        <div className="relative z-10 max-w-[620px]">
          <h2 className="lp-display lp-h2 text-white" data-reveal="words" style={{ "--d": "200ms" }}>
            <SplitWords text="Your visitors are asking questions right now." />
          </h2>
          <p className="mt-4 text-lg text-white/75">Give them someone to ask. Set up your assistant this afternoon — it's free to start.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={startHref} className="lp-btn lp-btn-light" data-magnet>
              Start free <FiArrowRight />
            </Link>
            <Link to="/company/login" className="lp-btn lp-btn-outline-light">
              Log in
            </Link>
          </div>
        </div>
        <div className="lp-rise" aria-hidden="true">
          {["Hi! 👋", "What's the price?", "नमस्ते", "📎 quote.pdf", "Book a visit", "Thanks! 🙌"].map((t, i) => (
            <span key={t} style={{ "--i": i }}>
              {t}
            </span>
          ))}
        </div>
        <div className="lp-final-mascot" aria-hidden="true">
          <Mascot className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-5 pb-10 pt-6 sm:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 border-t border-[var(--lp-line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-6">
            <Mascot className="h-full w-full" track={false} />
          </span>
          <span className="lp-display text-lg text-[var(--lp-ink)]">Nuformly</span>
          <a href="https://www.nuformsocial.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--lp-muted)] hover:text-[var(--lp-forest)]">
            by Nuform Social
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--lp-muted)]">
          <a href="#how">How it works</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link to="/company/login">Log in</Link>
        </nav>
        <p className="text-sm text-[var(--lp-muted)]">© {new Date().getFullYear()} Nuform Social</p>
      </div>
    </footer>
  );
}
