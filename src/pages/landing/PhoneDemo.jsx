import { useEffect, useRef, useState } from "react";
import { FiBookOpen, FiImage, FiMic, FiMail, FiUserCheck, FiPause, FiPlay } from "react-icons/fi";
import Mascot from "./Mascot.jsx";
import { SplitWords, prefersReducedMotion } from "./motion.jsx";
import nsServices from "../../assets/nuformsocial/services.png";

const FEATURES = [
  { icon: FiBookOpen, title: "Answers from your knowledge", body: "Services, portfolio, process — straight from what you wrote." },
  { icon: FiImage, title: "Reads photos & PDFs", body: "Visitors attach a file; the assistant understands it." },
  { icon: FiMic, title: "Voice & Hindi", body: "Speak instead of typing, in English or हिन्दी." },
  { icon: FiMail, title: "Captures the lead", body: "Asks for an email at the right moment and saves it." },
  { icon: FiUserCheck, title: "Hands off to your team", body: "A person joins the same chat when it matters." },
];

// One scripted conversation; `f` lights up the matching feature.
const SCRIPT = [
  { who: "user", text: "Do you build websites?", f: 0 },
  { who: "bot", text: "Yes! Website design & development is one of our core services — 200+ websites delivered so far.", f: 0 },
  { who: "user", kind: "image", text: "reference.png", f: 1 },
  { who: "bot", text: "Love this style — bold, playful and clear. We can design something just like it for your brand. 🚀", f: 1 },
  { who: "user", kind: "voice", text: "क्या आप SEO भी करते हैं?", f: 2 },
  { who: "bot", text: "हाँ! SEO, सोशल मीडिया और परफॉर्मेंस मार्केटिंग — सब एक ही जगह।", f: 2 },
  { who: "bot", text: "📧 Share your email and we'll send you a proposal.", f: 3 },
  { who: "user", text: "riya@example.com", f: 3 },
  { who: "sys", text: "Lead saved · Priya from your team joined", f: 4 },
  { who: "agent", text: "Hi Riya, Priya here 👋 Your proposal is on its way!", f: 4 },
];

function Bubble({ m }) {
  if (m.who === "sys") {
    return (
      <p className="lp-ph-sys">
        <span className="lp-live-dot" /> {m.text}
      </p>
    );
  }
  const mine = m.who === "user";
  return (
    <div className={`lp-ph-row ${mine ? "is-mine" : ""}`}>
      {!mine && (
        <span className={`lp-ph-av ${m.who === "agent" ? "is-agent" : ""}`}>{m.who === "agent" ? "P" : <Mascot className="h-full w-full" track={false} />}</span>
      )}
      {m.kind === "image" ? (
        <div className="lp-ph-img">
          <img src={nsServices} alt="" />
          <small>{m.text}</small>
        </div>
      ) : m.kind === "voice" ? (
        <div className="lp-ph-msg is-mine">
          <span className="lp-ph-wave" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ "--i": i }} />
            ))}
          </span>
          <span className="mt-1 block">{m.text}</span>
        </div>
      ) : (
        <div className={`lp-ph-msg ${mine ? "is-mine" : ""} ${m.who === "agent" ? "is-agent" : ""}`}>{m.text}</div>
      )}
    </div>
  );
}

export default function PhoneDemo() {
  const ref = useRef(null);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [playing, setPlaying] = useState(false);
  // auto-playing content must be pausable (WCAG 2.2.2)
  const [paused, setPaused] = useState(false);

  // Plays only while on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStep(SCRIPT.length);
      return undefined;
    }
    if (!playing || paused) return undefined;
    if (step >= SCRIPT.length) {
      const t = setTimeout(() => setStep(0), 4200);
      return () => clearTimeout(t);
    }
    const next = SCRIPT[step];
    const botLike = next.who === "bot" || next.who === "agent";
    if (botLike && !typing) {
      const t = setTimeout(() => setTyping(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setTyping(false);
        setStep((s) => s + 1);
      },
      botLike ? 1300 : 1100,
    );
    return () => clearTimeout(t);
  }, [step, typing, playing, paused]);

  const shown = SCRIPT.slice(0, step);
  const activeF = shown.length ? shown[shown.length - 1].f : 0;

  return (
    <section ref={ref} className="lp-section lp-phone-band" data-progress>
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="lp-label" data-reveal="up">
            Watch it work
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="One conversation, everything it can do." />
          </h2>
          <ul className="mt-10 grid gap-3">
            {FEATURES.map((f, i) => (
              <li key={f.title} className={`lp-ph-feature ${activeF === i && step > 0 ? "is-on" : ""}`} data-reveal="left" style={{ "--d": `${i * 80}ms` }}>
                <span className="lp-mini-icon">
                  <f.icon />
                </span>
                <span>
                  <b>{f.title}</b>
                  <small>{f.body}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
        <div className="lp-phone" data-reveal="scale">
          <div className="lp-phone-notch" />
          <div className="lp-ph-head">
            <span className="lp-ph-av is-head">
              <Mascot className="h-full w-full" track={false} />
            </span>
            <span>
              <b>Nuform Social Assistant</b>
              <small>
                <i /> Online
              </small>
            </span>
          </div>
          <div className="lp-ph-body">
            <div className="lp-ph-stack">
              <div className="lp-ph-row">
                <span className="lp-ph-av">
                  <Mascot className="h-full w-full" track={false} />
                </span>
                <div className="lp-ph-msg">👋 Hi! Ask me anything about growing your brand online.</div>
              </div>
              {shown.map((m, i) => (
                <Bubble key={`${i}-${m.text}`} m={m} />
              ))}
              {typing && (
                <div className="lp-ph-row">
                  <span className="lp-ph-av">
                    <Mascot className="h-full w-full" track={false} />
                  </span>
                  <div className="lp-ph-msg lp-ph-typing">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lp-ph-input">
            <span>Type a message…</span>
            <i />
          </div>
        </div>
        <div className="lp-phone-ctrl">
          <button type="button" className="lp-chip" onClick={() => setPaused((v) => !v)} aria-pressed={paused}>
            {paused ? <FiPlay className="mr-1.5 inline" /> : <FiPause className="mr-1.5 inline" />}
            {paused ? "Play the demo" : "Pause the demo"}
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}
