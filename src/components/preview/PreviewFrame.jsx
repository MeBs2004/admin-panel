import { useEffect, useRef, useState } from "react";
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
  desktop: { width: 900, height: 640 },
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
export default function PreviewFrame({ config, deviceMode = "desktop", companyId = null }) {
  const [mode, setMode] = useState("widget");
  const device = DEVICE_SIZE[deviceMode] || DEVICE_SIZE.desktop;
  const isMobile = deviceMode === "mobile";

  const Renderer = BRAND_RENDERERS[companyId] || ChatWidgetRenderer;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 bg-white px-4 pt-2 dark:bg-[var(--surface)]">
        <Tabs tabs={PREVIEW_TABS} active={mode} onChange={setMode} />
      </div>
      <div className="flex-1 overflow-hidden p-2">
        <PreviewViewport device={device}>
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 shadow-card dark:border-[var(--border)]">
            <MockWebsite />
            <Renderer key={mode} config={config} isMobile={isMobile} mode={mode} />
          </div>
        </PreviewViewport>
      </div>
    </div>
  );
}
