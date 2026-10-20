import { useRef } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { FiInbox, FiUserCheck, FiActivity, FiUsers, FiPieChart } from "react-icons/fi";
import { useInView, CountUp, SplitWords } from "./motion.jsx";

// Illustrative numbers only — labelled "Sample data" on the page.
const SERIES = [18, 22, 19, 27, 31, 26, 34, 39, 36, 44, 41, 49, 53, 58].map((v, i) => ({ day: `D${i + 1}`, chats: v, handoffs: Math.round(v * 0.18) }));

const THREADS = [
  { name: "Riya S.", text: "Do you build websites?", tag: "AI replied", tone: "ai", t: "2m" },
  { name: "Arjun M.", text: "I'd like to talk to someone", tag: "Needs you", tone: "hand", t: "4m" },
  { name: "Visitor 2841", text: "Do you run Google Ads?", tag: "AI replied", tone: "ai", t: "9m" },
  { name: "Neha K.", text: "Thanks, consultation booked!", tag: "Closed", tone: "done", t: "21m" },
];

const FEATURES = [
  { icon: FiInbox, title: "Shared inbox", body: "Every chat from your website, in one list." },
  { icon: FiUserCheck, title: "Human handoff", body: "Step in the moment a visitor asks for a person." },
  { icon: FiActivity, title: "Live View", body: "See who's on your site right now, and what page they're on." },
  { icon: FiUsers, title: "Visitor profiles", body: "Names, emails and form answers saved with each chat." },
  { icon: FiPieChart, title: "Reports", body: "Busiest days, handoff rate and AI usage at a glance." },
];

export default function Insights() {
  const chartRef = useRef(null);
  const chartIn = useInView(chartRef);
  return (
    <section id="inbox" className="lp-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="lp-label" data-reveal="up">
            Inbox & insights
          </p>
          <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="The bot handles the questions. Your team handles the people." />
          </h2>
        </div>

        <div className="lp-app-stage mt-14" data-progress>
        <div className="lp-app">
          <div className="lp-app-bar">
            <i />
            <i />
            <i />
            <span>Nuformly · Conversations</span>
            <em>Sample data</em>
          </div>
          <div className="grid lg:grid-cols-[300px_1fr_300px]">
            <ul className="lp-app-list">
              {THREADS.map((t, i) => (
                <li key={t.name} className={i === 1 ? "is-on" : ""} data-reveal="left" style={{ "--d": `${200 + i * 90}ms` }}>
                  <span className="lp-app-avatar">{t.name[0]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between">
                      <b>{t.name}</b>
                      <small>{t.t}</small>
                    </span>
                    <span className="block truncate text-[13px] text-[var(--lp-muted)]">{t.text}</span>
                    <span className={`lp-tag lp-tag-${t.tone}`}>{t.tag}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="lp-app-thread">
              <p className="lp-app-thread-head">
                <b>Arjun M.</b> · on /services · from Instagram
              </p>
              <div className="space-y-3 p-5">
                <p className="lp-msg" data-reveal="up" style={{ "--d": "300ms" }}>
                  Hi! Can you help us grow our Instagram following?
                </p>
                <p className="lp-msg is-bot" data-reveal="up" style={{ "--d": "450ms" }}>
                  Absolutely — social media optimisation is one of our core services. What's your business?
                </p>
                <p className="lp-msg" data-reveal="up" style={{ "--d": "600ms" }}>
                  We run a café chain. Can I talk to someone about a package?
                </p>
                <p className="lp-handoff" data-reveal="up" style={{ "--d": "750ms" }}>
                  <span className="lp-live-dot" /> Handed to your team · Priya joined the chat
                </p>
                <p className="lp-msg is-agent" data-reveal="up" style={{ "--d": "900ms" }}>
                  Hi Arjun, Priya here 👋 We've grown a few café brands — shall I call you?
                </p>
              </div>
            </div>

            <div className="lp-app-side">
              <div className="lp-app-stat">
                <p className="lp-label">Live on site now</p>
                <p className="lp-display mt-1 text-4xl text-[var(--lp-ink)]">
                  <CountUp to={23} />
                </p>
                <div className="lp-live-map" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span key={i} style={{ "--i": i }} />
                  ))}
                </div>
              </div>
              <div ref={chartRef} className="lp-app-stat">
                <p className="lp-label">Conversations · 14 days</p>
                <p className="lp-display mt-1 text-4xl text-[var(--lp-ink)]">
                  <CountUp to={502} />
                </p>
                <div className="mt-2 h-[110px]">
                  {chartIn && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={SERIES} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="lpArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1A8A56" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#1A8A56" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" hide />
                        <Tooltip cursor={{ stroke: "#1A8A56", strokeDasharray: 3 }} contentStyle={{ borderRadius: 12, border: "1px solid #dfe9e3", fontSize: 12 }} />
                        <Area type="monotone" dataKey="chats" name="Chats" stroke="#0D5537" strokeWidth={2.5} fill="url(#lpArea)" animationDuration={1600} />
                        <Area type="monotone" dataKey="handoffs" name="Handoffs" stroke="#F2711C" strokeWidth={2} fill="transparent" animationDuration={1900} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="lp-skew mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="lp-feature" data-spot data-reveal="up" style={{ "--d": `${i * 80}ms` }}>
              <span className="lp-mini-icon">
                <f.icon />
              </span>
              <h3 className="mt-4 font-semibold text-[var(--lp-ink)]">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--lp-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
