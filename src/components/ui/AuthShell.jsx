import { useEffect, useState } from "react";
import { FiMessageSquare, FiRadio, FiBarChart2, FiShield } from "react-icons/fi";
import AuthBackdrop from "./AuthBackdrop.jsx";

const SLIDES = [
  { icon: FiMessageSquare, title: "Launch AI chatbots in minutes", text: "Pick a template, make it yours, and go live with a single line of code." },
  { icon: FiRadio, title: "Every conversation, live", text: "Watch visitors and chats as they happen, and step in when it matters." },
  { icon: FiBarChart2, title: "Analytics that explain themselves", text: "Visitors, conversations and AI-versus-human replies, at a glance." },
  { icon: FiShield, title: "Built for teams", text: "Roles, permissions and per-chatbot access for everyone you invite." },
];
const SLIDE_MS = 4200;

// Floating decorative chat bubbles on the brand panel.
const BUBBLES = [
  { text: "Hi! How can I help?", className: "left-[10%] top-[22%]", delay: "0s", bot: true },
  { text: "Tell me about pricing", className: "right-[12%] top-[38%]", delay: "1.2s", bot: false },
  { text: "Happy to — here you go ✨", className: "right-[9%] bottom-[20%]", delay: "2.4s", bot: true },
];

/**
 * Two-panel sign-in layout: an animated brand panel (rotating highlights,
 * drifting light, floating chat bubbles) beside the form. On phones only the
 * form shows. `children` is the form block.
 */
export default function AuthShell({ children }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused]);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside
        className="relative hidden overflow-hidden bg-brand-gradient bg-[length:220%_220%] p-12 text-white animate-gradient-shift lg:flex lg:flex-col lg:justify-between"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <span className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/15 blur-3xl animate-blob-drift" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-400/30 blur-3xl animate-blob-drift [animation-delay:-8s]" aria-hidden="true" />
        <span className="pointer-events-none absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl animate-blob-drift [animation-delay:-14s]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:28px_28px]" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
          <span className="orbit-slow absolute inset-0 rounded-full border border-white/15" />
          <span className="orbit-slower absolute inset-12 rounded-full border border-dashed border-white/20" />
          <span className="orbit-slow absolute inset-28 rounded-full border border-white/10" />
        </div>

        {BUBBLES.map((b) => (
          <div
            key={b.text}
            className={`pointer-events-none absolute animate-float-y rounded-2xl px-4 py-2.5 text-sm shadow-lift backdrop-blur ${b.className} ${
              b.bot ? "rounded-bl-md bg-white/90 text-gray-800" : "rounded-br-md bg-emerald-950/55 text-white"
            }`}
            style={{ animationDelay: b.delay }}
            aria-hidden="true"
          >
            {b.text}
          </div>
        ))}

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold shadow-lg ring-1 ring-white/30 backdrop-blur">N</div>
          <div className="leading-tight">
            <p className="text-lg font-semibold">Nuformly</p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/70">AI Chatbot Platform</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <div key={index} className="slide-fade">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">{slide.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-white/80">{slide.text}</p>
          </div>

          <div className="mt-8 flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show: ${s.title}`}
                className="group relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-all duration-300"
                style={{ width: i === index ? 44 : 14 }}
              >
                {i === index && !paused && <span key={`${index}-fill`} className="progress-fill absolute inset-0 rounded-full bg-white" />}
                {i === index && paused && <span className="absolute inset-0 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Nuformly · Secure sign-in</p>
      </aside>

      {/* Form side */}
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <AuthBackdrop />
        {children}
      </main>
    </div>
  );
}
