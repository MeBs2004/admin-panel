import { useEffect, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import Tabs from "../ui/Tabs.jsx";
import ChatWidgetRenderer from "./ChatWidgetRenderer.jsx";
import NuformSocialWidgetPreview from "./NuformSocialWidgetPreview.jsx";
import OyaWidgetPreview from "./OyaWidgetPreview.jsx";

// Real Chatbot UI Preview — picks the brand-accurate renderer for the
// chatbot's actual company, ported from the real production component
// (Bot.jsx / OyaBot.jsx), instead of the generic ChatWidgetRenderer.
// Any company without a dedicated brand renderer yet still gets the
// generic renderer — an honest, extensible fallback (section 15/17),
// not a redesign of the generic engine itself.
const BRAND_RENDERERS = {
  "nuform-social": NuformSocialWidgetPreview,
  "oya-gemkara": OyaWidgetPreview,
};

// UI/UX Polish fix — the previous frame sizes (desktop/tablet: 560px
// tall) were SMALLER than an open chat window (a 547px-560px-tall
// panel anchored `bottom-5`, i.e. needing ~567-580px just for the
// panel itself). With the frame's `overflow-hidden`, that overflow was
// hard-cropped from the top — the reported clipping bug. These are the
// device's true, natural dimensions (generous enough that every
// renderer's open chat window + launcher + greeting bubble always has
// real headroom); PreviewViewport below scales this down to fit
// whatever space is actually available, so nothing is ever clipped at
// any browser/sidebar width.
const DEVICE_SIZE = {
  desktop: { width: 900, height: 700 },
  tablet: { width: 640, height: 640 },
  mobile: { width: 390, height: 720 },
};

const SAFE_PADDING = 24; // px, on every side, around the scaled device frame

const PREVIEW_TABS = [
  { value: "widget", label: "Chat Widget" },
  { value: "window", label: "Chat Window" },
];

function MockWebsite() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <p className="text-sm font-semibold text-gray-700">Your Website</p>
        <div className="flex gap-3 text-[11px] text-gray-300">
          <span>Home</span>
          <span>Services</span>
          <span>About</span>
          <span>Contact</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-2.5 w-64 rounded bg-gray-100" />
        <div className="mt-2 h-8 w-28 rounded-lg bg-gray-100" />
      </div>
      <div className="grid grid-cols-3 gap-3 px-6 pb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-50" />
        ))}
      </div>
    </div>
  );
}

/**
 * Preview fit algorithm (Section 7) — measures the actually available
 * viewport space with ResizeObserver and scales the fixed-size device
 * frame down (never up past 1x) to fit inside it with SAFE_PADDING on
 * every side, centered. The frame's own internal layout is always
 * computed at its natural DEVICE_SIZE, so nothing inside it is ever
 * squeezed or reflowed — only uniformly scaled, which can shrink but
 * never crop content. Re-measures on window resize, sidebar
 * collapse/expand, and container resize alike (ResizeObserver covers
 * all three, since each changes this element's box size).
 */
function PreviewViewport({ device, children }) {
  const viewportRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const fit = () => {
      const availableWidth = el.clientWidth - SAFE_PADDING * 2;
      const availableHeight = el.clientHeight - SAFE_PADDING * 2;
      const next = Math.min(1, availableWidth / device.width, availableHeight / device.height);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [device.width, device.height]);

  return (
    <div ref={viewportRef} className="flex h-full w-full items-center justify-center overflow-auto">
      <div
        className="shrink-0 transition-[width,height] duration-200 ease-out"
        style={{ width: device.width * scale, height: device.height * scale }}
      >
        <div
          className="origin-top-left"
          style={{ width: device.width, height: device.height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Real live preview — renders `config` through the brand-accurate
 * renderer for `companyId` (falling back to the generic
 * ChatWidgetRenderer for companies without one), over a neutral mock
 * website canvas (Section 11: a placement demo, not a real embedded
 * site — no iframe, no CORS surface). The Chat Widget/Chat Window tabs
 * each mount their own renderer instance (`key={mode}`) so switching
 * tabs always starts from a clean, predictable state instead of
 * carrying over whatever the admin was mid-typing in the other tab.
 */
export default function PreviewFrame({ config, deviceMode = "desktop", companyId = null, engine = "v1", focus = null, onEdit = null }) {
  const [mode, setMode] = useState("widget");
  const [replayKey, setReplayKey] = useState(0);
  // The preview opens exactly like a brand-new chat; this adds a made-up conversation
  // so message bubbles, avatars and timestamps can be styled without typing first.
  const [sampleChat, setSampleChat] = useState(false);
  // Edit: click any element to jump to its setting. Try it: use the chat like a visitor.
  const [editing, setEditing] = useState(true);

  // Editing a launcher setting shows the closed widget; editing a chat
  // window setting opens the window — so every change is on screen.
  useEffect(() => {
    if (focus) setMode(focus);
  }, [focus]);
  const device = DEVICE_SIZE[deviceMode] || DEVICE_SIZE.desktop;
  const isMobile = deviceMode === "mobile";

  // Brand renderers mimic the legacy hardcoded widgets. A chatbot on
  // the config-driven v1 engine (everything the wizard creates) is
  // drawn by the generic renderer — the same logic the live widget runs.
  const Renderer = engine === "legacy" ? BRAND_RENDERERS[companyId] || ChatWidgetRenderer : ChatWidgetRenderer;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-end justify-between gap-2 bg-white px-4 pt-2 dark:bg-[var(--surface)]">
        <div className="min-w-0 flex-1">
          <Tabs tabs={PREVIEW_TABS} active={mode} onChange={setMode} />
        </div>
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          title="Replay animations"
          className="mb-1.5 flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition-all hover:-translate-y-px hover:border-primary-300 hover:text-primary-600 active:scale-95 dark:border-[var(--border)] dark:text-gray-400"
        >
          <FiRefreshCw className="h-3 w-3" /> Replay
        </button>
        {onEdit && engine !== "legacy" && (
          <div className="mb-1.5 flex shrink-0 items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium dark:border-[var(--border)] dark:bg-white/5" role="group" aria-label="Preview mode">
            {[
              { value: true, label: "Edit" },
              { value: false, label: "Try it" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setEditing(o.value)}
                aria-pressed={editing === o.value}
                title={o.value ? "Click any element in the preview to edit it" : "Chat with the preview like a visitor"}
                className={`rounded-full px-3 py-1 transition-all duration-200 active:scale-95 ${
                  editing === o.value ? "bg-white text-primary-600 shadow-sm dark:bg-[var(--surface)] dark:text-emerald-300" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setSampleChat((v) => !v)}
          aria-pressed={sampleChat}
          title="Show a made-up conversation so you can style the message bubbles"
          className={`mb-1.5 flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:-translate-y-px active:scale-95 ${
            sampleChat ? "border-primary-400 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-emerald-300" : "border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 dark:border-[var(--border)] dark:text-gray-400"
          }`}
        >
          Sample chat
        </button>
      </div>
      <div className="flex-1 overflow-hidden p-2">
        <PreviewViewport device={device}>
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 shadow-card dark:border-[var(--border)]">
            <MockWebsite />
            <Renderer key={mode} config={config} isMobile={isMobile} mode={mode} replayKey={replayKey} sampleChat={sampleChat} editMode={Boolean(onEdit) && editing} onEdit={onEdit} />
          </div>
        </PreviewViewport>
      </div>
    </div>
  );
}
