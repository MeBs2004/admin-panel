import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiSend, FiPlus, FiMic, FiMessageCircle, FiZap, FiVolume2, FiVolumeX } from "react-icons/fi";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { DEFAULT_CHATBOT_CONFIG } from "../../config/chatbotConfigDefaults.js";
import { BRAND_WIDGET_DEFAULTS, withBrandFallback } from "./brandWidgetDefaults.js";
import { buildScopedCss, nextCssScopeId } from "./scopedCustomCss.js";
import { playPreviewChime } from "./previewChime.js";
import ChatbotFormsPreview from "./ChatbotFormsPreview.jsx";

const BRAND = BRAND_WIDGET_DEFAULTS["nuform-social"];

const STYLES = `
  @keyframes nfPreviewPulse {
    0%   { transform: scale(0.85); opacity: 0.55; }
    70%, 100% { transform: scale(1.35); opacity: 0; }
  }
  .nf-preview-pulse  { animation: nfPreviewPulse 2.2s ease-out infinite; }
`;

// Bug fix (this task) — chatWindow.size/borderRadius and launcher.size
// were previously never read at all (hardcoded 365x547 / 28px / 55px),
// so those Studio controls visibly did nothing in the preview. These
// mirror the same maps ChatWidgetRenderer/production already use.
const WINDOW_SIZE_PX = {
  small: { width: 320, height: 460 },
  medium: { width: 365, height: 547 },
  large: { width: 400, height: 600 },
};
const WINDOW_RADIUS_PX = { small: 14, medium: 22, large: 28 };
const LAUNCHER_SIZE_PX = { small: 46, medium: 55, large: 64 };

// launcher.animation was previously ignored entirely (the button
// always floated). These are the SAME keyframes already defined in
// tailwind.config.js (used by production-facing components), not new
// CSS — "none" now genuinely means no motion.
const LAUNCHER_ANIMATION_CLASS = {
  none: "",
  float: "animate-launcher-float",
  pulse: "animate-pulse-soft",
  glow: "animate-launcher-glow",
};

/**
 * Real Chatbot UI Preview (Nuform Social) — a faithful, local-only port
 * of frontend/src/component/Bot.jsx's actual visual structure (header,
 * welcome card, contact buttons, message bubbles, suggestions, input
 * bar, footer). This is NOT the generic ChatWidgetRenderer: colors,
 * copy, and layout are ported from the real production component, not
 * invented. Never calls bot/v1/* — sendPreview() only touches local
 * component state, same guarantee ChatWidgetRenderer already had.
 */
export default function NuformSocialWidgetPreview({ config, isMobile = false, mode = "widget" }) {
  const [open, setOpen] = useState(mode === "window");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [formDone, setFormDone] = useState(false);
  const replyIndexRef = useRef(0);
  const scrollRef = useRef(null);
  const cssScopeIdRef = useRef(null);
  if (!cssScopeIdRef.current) cssScopeIdRef.current = nextCssScopeId();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Phase 22 — forms.enabled previously had zero preview representation.
  // Remount the gate (and re-arm formDone) whenever the forms config
  // itself changes, so a left-control edit is reflected immediately
  // even if the admin already completed the gate in this session.
  // (Hooks must run unconditionally, so this — and the customCss memo
  // below — stay above the `if (!config)` early return.)
  const formsKey = JSON.stringify(config?.forms || {});
  useEffect(() => {
    if (config?.forms?.enabled) setFormDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formsKey]);

  // Phase 22 — appearance.customCss was permanently inert (see
  // SectionAppearance.jsx). Now sandboxed to this preview root only —
  // see scopedCustomCss.js for the isolation approach and its limits.
  const scopedCss = useMemo(
    () => buildScopedCss(config?.appearance?.customCss, `[data-nf-css-scope="${cssScopeIdRef.current}"]`),
    [config?.appearance?.customCss],
  );

  if (!config) return null;

  const launcher = config.launcher || {};
  const chatWindow = config.chatWindow || {};
  const behavior = config.behavior || {};
  const appearance = config.appearance || {};
  const forms = config.forms || {};
  const D = DEFAULT_CHATBOT_CONFIG;

  // Phase 22 — chatWindow.theme previously had no effect on this brand
  // renderer at all (only the generic fallback ChatWidgetRenderer read
  // it). Precedence documented in brandWidgetDefaults.js: an explicit
  // customized color always wins; otherwise theme picks which brand
  // palette (light/dark) applies.
  const dark = chatWindow.theme === "dark";
  const darkTokens = BRAND.dark;

  // Phase 22 — behavior.offlineMode ("default" | "offline-message")
  // previously had zero preview representation.
  const isOffline = behavior.offlineMode === "offline-message";

  // Bug fix (this phase) — this previously read `chatWindow.appearanceFont`,
  // a field that has never existed in the schema (the real field is the
  // top-level `appearance.font`). Font selection has never actually
  // worked until now. Same mapping production Bot.jsx already uses —
  // "system" has no explicit fontFamily (inherits the page default).
  const fontFamily = appearance.font === "inter" ? "Inter, sans-serif" : undefined;

  const primaryColor = withBrandFallback(
    chatWindow.primaryColor,
    D.chatWindow.primaryColor,
    dark ? darkTokens.chatWindow.primaryColor : BRAND.chatWindow.primaryColor,
  );
  const panelBg = withBrandFallback(
    chatWindow.backgroundColor,
    D.chatWindow.backgroundColor,
    dark ? darkTokens.chatWindow.backgroundColor : BRAND.chatWindow.backgroundColor,
  );
  const panelText = withBrandFallback(
    chatWindow.textColor,
    D.chatWindow.textColor,
    dark ? darkTokens.chatWindow.textColor : BRAND.chatWindow.textColor,
  );
  const launcherColor = withBrandFallback(launcher.color, D.launcher.color, BRAND.launcher.color);
  const botName = withBrandFallback(chatWindow.botName, D.chatWindow.botName, BRAND.chatWindow.botName);
  const companyName = withBrandFallback(
    chatWindow.companyName,
    D.chatWindow.companyName,
    BRAND.chatWindow.companyName,
  );
  const botAvatar = withBrandFallback(chatWindow.botAvatar, D.chatWindow.botAvatar, BRAND.chatWindow.botAvatar);
  // Bug fix (this phase) — language.defaultLanguage had no visual effect
  // at all; the brand-default welcome text always showed English. The
  // saved chatWindow.welcomeMessage is a single string with no per-
  // language variants in the schema, so only the BRAND fallback tier
  // (never customized) can meaningfully switch — matches what's
  // actually possible, not a partial/fake translation.
  const defaultLanguage = config.language?.defaultLanguage;
  const welcomeMessage = withBrandFallback(
    chatWindow.welcomeMessage,
    D.chatWindow.welcomeMessage,
    defaultLanguage === "Hindi" ? BRAND.chatWindow.welcomeMessage.Hindi : BRAND.chatWindow.welcomeMessage.English,
  );
  const showBranding = chatWindow.showBranding !== false;
  const showGreeting = launcher.showGreeting !== false;
  const showNotificationBadge = launcher.showNotificationBadge !== false;
  const typingIndicatorEnabled = behavior.typingIndicator !== false;
  const isLeft = launcher.position === "bottom-left";
  const shapeClass = launcher.shape === "rounded-square" ? "rounded-2xl" : "rounded-full";

  // Bug fixes (this task) — every one of these was previously either
  // hardcoded or entirely unread.
  const gradient = launcher.gradient || {};
  const launcherBg = gradient.enabled
    ? `linear-gradient(135deg, ${gradient.from || launcherColor}, ${gradient.to || launcherColor})`
    : launcherColor;
  const launcherAnimClass = LAUNCHER_ANIMATION_CLASS[launcher.animation] ?? LAUNCHER_ANIMATION_CLASS.float;
  const launcherPx = LAUNCHER_SIZE_PX[launcher.size] || LAUNCHER_SIZE_PX.medium;
  const winSize = WINDOW_SIZE_PX[chatWindow.size] || WINDOW_SIZE_PX.medium;
  const winRadius = WINDOW_RADIUS_PX[chatWindow.borderRadius] ?? WINDOW_RADIUS_PX.large;
  const greetingTitle = launcher.greetingTitle || "👋 Hi there!";
  const greetingMessage = launcher.greetingMessage || `Ask me anything about ${BRAND.footerBrand}.`;
  const launcherIcon = launcher.icon || "default";

  // behavior.autoOpen preview — capped at 5s so testing it doesn't
  // require waiting out a real 30s delay; still genuinely respects
  // "off" (never fires) and a real, if capped, delay.
  useEffect(() => {
    if (mode !== "widget" || !behavior.autoOpen) return;
    const delayMs = Math.min(Number(behavior.autoOpenDelay) || 0, 5) * 1000;
    const t = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, behavior.autoOpen, behavior.autoOpenDelay]);

  const sendPreview = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || typing || isOffline) return;
    setMessages((m) => [...m, { sender: "user", text: trimmed }]);
    setDraft("");
    const reply = () => {
      const r = BRAND.sampleReplies[replyIndexRef.current % BRAND.sampleReplies.length];
      replyIndexRef.current += 1;
      setMessages((m) => [...m, { sender: "bot", text: r }]);
    };
    if (typingIndicatorEnabled) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        reply();
      }, 900);
    } else {
      reply();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0" style={{ fontFamily }} data-nf-css-scope={cssScopeIdRef.current}>
      <style>{STYLES}</style>
      {scopedCss && <style>{scopedCss}</style>}

      {!open && (
        <div className={`absolute bottom-5 flex flex-col items-end gap-3 ${isLeft ? "left-5 items-start" : "right-5 items-end"}`}>
          {showGreeting && (
            <div className="pointer-events-auto max-w-[200px] rounded-2xl border border-gray-100 bg-white px-3.5 py-3 text-xs shadow-lg animate-fade-in-up">
              <p className="font-semibold text-gray-800">{greetingTitle}</p>
              <p className="mt-0.5 text-gray-500">{greetingMessage}</p>
            </div>
          )}

          {launcher.enabled !== false && (
            <button
              onClick={() => setOpen(true)}
              aria-label="Open chat"
              className={`pointer-events-auto relative flex shrink-0 items-center justify-center text-white shadow-xl transition-transform hover:scale-105 ${launcherAnimClass} ${shapeClass}`}
              style={{ width: launcherPx, height: launcherPx }}
            >
              <span className={`absolute inset-0 nf-preview-pulse ${shapeClass}`} style={{ background: launcherBg }} />
              <span className={`relative flex h-full w-full items-center justify-center overflow-hidden ${shapeClass}`} style={{ background: launcherBg }}>
                {launcherIcon === "chat" ? (
                  <FiMessageCircle style={{ width: launcherPx * 0.5, height: launcherPx * 0.5 }} />
                ) : launcherIcon === "logo" ? (
                  <img src={botAvatar || BRAND.logo1} alt="" className="h-full w-full object-contain" />
                ) : (
                  <FiZap style={{ width: launcherPx * 0.42, height: launcherPx * 0.42 }} />
                )}
              </span>
              {showNotificationBadge && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#e36b0a]" />
              )}
            </button>
          )}
        </div>
      )}

      {open && (
        <div
          className={
            isMobile
              ? "pointer-events-auto absolute inset-0 flex flex-col overflow-hidden shadow-2xl"
              : `pointer-events-auto absolute bottom-5 flex flex-col overflow-hidden border transition-[width,height,border-radius] duration-200 ease-out shadow-2xl ${isLeft ? "left-5" : "right-5"}`
          }
          style={{
            background: panelBg,
            color: panelText,
            borderColor: isMobile ? undefined : dark ? darkTokens.dividerColor : "#dcdcdc",
            ...(isMobile
              ? {}
              : { width: winSize.width, height: winSize.height, borderRadius: winRadius, maxWidth: "100%", maxHeight: "100%" }),
          }}
        >
          {/* Header */}
          <div
            className="flex h-[74px] shrink-0 items-center justify-between px-4 text-white"
            style={{
              background: `linear-gradient(135deg, ${dark ? darkTokens.header.gradientFrom : BRAND.launcher.gradientFrom} 0%, ${primaryColor} 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-[12px] bg-white/15">
                <img src={botAvatar || BRAND.logo} alt="" className="h-[35px] w-[35px] rounded-[8px] object-cover" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold leading-none">{botName}</h2>
                <div className="mt-[5px] flex items-center gap-2">
                  <span className={`h-[6px] w-[6px] rounded-full ${isOffline ? "bg-gray-300" : "bg-[#8dffb3]"}`} />
                  <p className="text-[11px] leading-none text-[#d5f5e3]">
                    {isOffline ? "Currently offline" : companyName || "Online · Always ready"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {behavior.sound ? (
                <button
                  type="button"
                  onClick={() => playPreviewChime()}
                  aria-label="Test notification sound (preview only)"
                  title="Sound enabled — click to test"
                  className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white/15"
                >
                  <FiVolume2 size={11} />
                </button>
              ) : (
                <span
                  aria-label="Sound disabled"
                  title="Sound disabled"
                  className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white/10 opacity-50"
                >
                  <FiVolumeX size={11} />
                </span>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat preview"
                className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white/15"
              >
                <FiX size={13} />
              </button>
            </div>
          </div>

          {/* Phase 22 — forms.enabled: pre-chat gate, local-only, no API calls */}
          {forms.enabled && !formDone ? (
            <div className="flex-1 overflow-y-auto">
              <ChatbotFormsPreview
                fields={forms.fields}
                style={forms.style}
                primaryColor={primaryColor}
                panelText={panelText}
                inputBg={dark ? darkTokens.inputBg : "#ffffff"}
                inputBorder={dark ? darkTokens.inputBorder : "#dcdcdc"}
                onComplete={() => setFormDone(true)}
              />
            </div>
          ) : (
            <>
              {/* Chat area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                {isOffline && (
                  <div
                    className="mb-4 rounded-[14px] border px-4 py-3 text-[13px] leading-6"
                    style={{
                      color: panelText,
                      background: dark ? darkTokens.welcomeBg : "#fff7ed",
                      borderColor: dark ? darkTokens.welcomeBorder : "#fed7aa",
                    }}
                  >
                    We&apos;re currently offline. Leave a message and we&apos;ll get back to you as soon as we&apos;re back.
                  </div>
                )}

                {messages.length === 0 && (
                  <>
                    <div
                      className="mb-5 rounded-[18px] border p-4 text-[14px] leading-7"
                      style={{
                        color: panelText,
                        background: dark ? darkTokens.welcomeBg : "#edf7f1",
                        borderColor: dark ? darkTokens.welcomeBorder : "#d8e9de",
                      }}
                    >
                      {welcomeMessage}
                    </div>
                    <div className="mb-5 flex gap-2">
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium text-white" style={{ background: primaryColor }}>
                        <FaPhoneAlt size={12} /> Call
                      </span>
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-[12px] font-medium text-white">
                        <FaWhatsapp size={13} /> WhatsApp
                      </span>
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#e36b0a] px-3 py-2 text-[12px] font-medium text-white">
                        <FaEnvelope size={12} /> Email
                      </span>
                    </div>
                  </>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`mb-4 flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {m.sender === "bot" && (
                      <img src={botAvatar || BRAND.logo} alt="" className="mr-2 mt-1 h-[32px] w-[32px] shrink-0 rounded-full object-cover" />
                    )}
                    <div
                      className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-[15px] py-[12px] text-[14px] leading-[26px] ${
                        m.sender === "user" ? "text-white shadow-md" : "border"
                      }`}
                      style={
                        m.sender === "user"
                          ? { background: primaryColor }
                          : { background: dark ? darkTokens.bubbleBg : "#edf5ef", borderColor: dark ? darkTokens.bubbleBorder : "#d7e7dc", color: dark ? darkTokens.chatWindow.textColor : "#2d2d2d" }
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {typing && typingIndicatorEnabled && (
                  <div
                    className="inline-flex items-center gap-2 rounded-[18px] rounded-bl-[6px] border px-4 py-3 shadow-sm"
                    style={{ background: dark ? darkTokens.bubbleBg : "#edf5ef", borderColor: dark ? darkTokens.bubbleBorder : "#d7e7dc" }}
                  >
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#00c853]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#00b0ff]" style={{ animationDelay: "0.15s" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#ff9100]" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}

                {mode === "window" && messages.length === 0 && !typing && !isOffline && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {BRAND.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendPreview(s)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                className="shrink-0 border-t px-4 py-4"
                style={{ background: dark ? darkTokens.inputBg : "#ffffff", borderColor: dark ? darkTokens.dividerColor : "#e8e8e8" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  sendPreview(draft);
                }}
              >
                <div
                  className="flex items-center gap-2 rounded-[18px] border-2 px-3 py-2"
                  style={{ borderColor: isOffline ? (dark ? darkTokens.inputBorder : "#dcdcdc") : primaryColor, opacity: isOffline ? 0.6 : 1 }}
                >
                  <FiPlus size={18} style={{ color: dark ? darkTokens.iconColor : primaryColor }} />
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isOffline ? "Chat is currently offline" : "Ask About Our Services..."}
                    aria-label="Preview message (not sent anywhere)"
                    disabled={isOffline}
                    className={`flex-1 truncate text-[14px] outline-none ${dark ? darkTokens.placeholderClass : "placeholder:text-[#9aa5a0]"}`}
                    style={{ color: panelText, background: "transparent" }}
                  />
                  <button
                    type="button"
                    disabled={isOffline}
                    aria-label="Voice (preview only, does not record)"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full"
                    style={{ color: dark ? darkTokens.iconColor : primaryColor, background: dark ? darkTokens.bubbleBg : "#f3f4f6" }}
                  >
                    <FiMic size={14} />
                  </button>
                  <button
                    type="submit"
                    disabled={isOffline}
                    aria-label="Send preview message"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-white"
                    style={{ background: primaryColor }}
                  >
                    <FiSend size={14} />
                  </button>
                </div>

                {showBranding && (
                  <p className="mt-3 text-center text-[11px] text-[#9ca3af]">
                    Powered by <span className="font-semibold" style={{ color: BRAND.footerAccent }}>{BRAND.footerBrand}</span>
                    &nbsp;&nbsp;{BRAND.footerDomain}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
