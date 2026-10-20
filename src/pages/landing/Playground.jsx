import { useEffect, useMemo, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import ChatWidgetRenderer from "../../components/preview/ChatWidgetRenderer.jsx";
import { THEME_PRESETS, fontStylesheetUrl } from "../../config/widgetStyle.js";
import { ScaledStage, SplitWords, useMedia } from "./motion.jsx";
import { themed, demoReply } from "./demoBot.js";
import { COUNTS } from "./content.js";

// A handful of the real options per control — the Studio has them all.
const LAUNCHER_MOTIONS = ["float-ripple", "pulse", "bounce", "heartbeat", "jelly", "tada", "wiggle", "glow", "swing", "breathe"];
const WINDOW_MOTIONS = ["slide-up", "elastic", "bounce", "flip", "zoom", "drop", "rotate"];
const BUBBLES = ["rounded", "soft", "sharp", "pill", "classic"];
const FONTS = [
  ["system", "System"],
  ["poppins", "Poppins"],
  ["nunito", "Nunito"],
  ["dm-sans", "DM Sans"],
  ["merriweather", "Merriweather"],
  ["mono", "Mono"],
];
const LAUNCHER_ICONS = ["chat", "robot", "headset", "bolt", "heart", "smile"];

const pretty = (v) => v.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Clears the starter's pinned greens so a preset recolours everything.
const NEUTRAL = {
  chatWindow: {
    headerSubtitleColor: "",
    userTextColor: "",
    botTextColor: "",
    botBubbleBorderColor: "",
    suggestionBgColor: "",
    suggestionTextColor: "",
    suggestionBorderColor: "",
    sendButtonColor: "",
    footerBackground: "",
    borderColor: "",
    dividerColor: "",
    welcomeBgColor: "",
    welcomeBorderColor: "",
    placeholderColor: "",
    messageAnimation: "pop",
    suggestionAnimation: "slide",
  },
};

function Chips({ label, options, value, onChange, render = pretty }) {
  return (
    <div>
      <p className="lp-control-label">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o} className={`lp-chip ${value === o ? "is-on" : ""}`}>
            {render(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Playground() {
  const [s, setS] = useState({ preset: "emerald", motion: "float-ripple", icon: "chat", win: "elastic", bubble: "rounded", font: "system" });
  const [view, setView] = useState({ mode: "window", n: 0 });
  const narrow = useMedia("(max-width: 640px)");
  const stageW = narrow ? 410 : 440;
  const set = (key, mode) => (value) => {
    setS((cur) => ({ ...cur, [key]: value }));
    if (mode) setView((v) => ({ mode, n: mode === v.mode ? v.n : v.n + 1 }));
  };

  useEffect(() => {
    const href = fontStylesheetUrl(s.font);
    if (!href || document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [s.font]);

  const config = useMemo(
    () =>
      themed(s.preset, {
        ...NEUTRAL,
        launcher: { icon: s.icon, logoOnly: false, animation: s.motion, customSize: 60, shape: "circle", shadow: "soft" },
        chatWindow: { ...NEUTRAL.chatWindow, windowAnimation: s.win, bubbleStyle: s.bubble },
        appearance: { font: s.font },
      }),
    [s],
  );

  return (
    <section id="studio" className="lp-section lp-studio-band" data-progress>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[640px]">
            <p className="lp-label" data-reveal="up">
              The Studio
            </p>
            <h2 className="lp-display lp-h2 mt-3" data-reveal="words" style={{ "--d": "80ms" }}>
            <SplitWords text="Change anything. Watch it change." />
          </h2>
            <p className="lp-lede mt-4" data-reveal="up" style={{ "--d": "160ms" }}>
              A small taste of the editor every customer gets. The preview on the right is the real widget, so what you see here is exactly what ships.
            </p>
          </div>
          <dl className="flex gap-6" data-reveal="up" style={{ "--d": "220ms" }}>
            {[
              [COUNTS.launcherMotions, "launcher motions"],
              [COUNTS.autoOpenAnimations, "auto-open animations"],
              [COUNTS.fonts, "fonts"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="lp-display text-4xl text-[var(--lp-forest)]">{n}</dt>
                <dd className="mt-1 max-w-[90px] text-xs leading-snug text-[var(--lp-muted)]">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lp-studio-card mt-12" data-reveal="scale">
          <div className="lp-studio-controls">
            <div>
              <p className="lp-control-label">Theme</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {THEME_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("preset")(p.id)}
                    aria-pressed={s.preset === p.id}
                    title={p.name}
                    className={`lp-theme ${s.preset === p.id ? "is-on" : ""}`}
                    style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }}
                  >
                    <span className="sr-only">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <Chips label="Launcher motion" options={LAUNCHER_MOTIONS} value={s.motion} onChange={set("motion", "widget")} />
            <Chips label="Launcher icon" options={LAUNCHER_ICONS} value={s.icon} onChange={set("icon", "widget")} />
            <Chips label="Window entrance" options={WINDOW_MOTIONS} value={s.win} onChange={set("win", "window")} />
            <Chips label="Message bubbles" options={BUBBLES} value={s.bubble} onChange={set("bubble", "window")} />
            <Chips label="Font" options={FONTS.map((f) => f[0])} value={s.font} onChange={set("font", "window")} render={(v) => FONTS.find((f) => f[0] === v)[1]} />
          </div>

          <div className="lp-studio-preview">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="lp-toggle" role="group" aria-label="Preview">
                {[
                  ["widget", "Chat widget"],
                  ["window", "Chat window"],
                ].map(([m, l]) => (
                  <button key={m} type="button" aria-pressed={view.mode === m} className={view.mode === m ? "is-on" : ""} onClick={() => setView((v) => ({ mode: m, n: v.n + 1 }))}>
                    {l}
                  </button>
                ))}
              </div>
              <button type="button" className="lp-chip" onClick={() => setView((v) => ({ ...v, n: v.n + 1 }))}>
                <FiRefreshCw className="mr-1 inline" /> Replay
              </button>
            </div>
            <ScaledStage width={stageW} height={680}>
              <div className="lp-stage-bg relative h-[680px] overflow-hidden rounded-2xl" style={{ width: stageW }}>
                <ChatWidgetRenderer key={`${view.mode}-${view.n}`} config={config} mode={view.mode} replyFor={demoReply} />
              </div>
            </ScaledStage>
          </div>
        </div>
      </div>
    </section>
  );
}
