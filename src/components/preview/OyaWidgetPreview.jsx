import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiSend, FiPaperclip, FiMic, FiMessageCircle, FiZap, FiVolume2, FiVolumeX } from "react-icons/fi";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { DEFAULT_CHATBOT_CONFIG } from "../../config/chatbotConfigDefaults.js";
import { BRAND_WIDGET_DEFAULTS, withBrandFallback } from "./brandWidgetDefaults.js";
import { buildScopedCss, nextCssScopeId } from "./scopedCustomCss.js";
import { playPreviewChime } from "./previewChime.js";
import ChatbotFormsPreview from "./ChatbotFormsPreview.jsx";

const BRAND = BRAND_WIDGET_DEFAULTS["oya-gemkara"];
const LUX_ACCENT = "#D4AF37";
const LUX_GOLD = "#B8865B";
const LUX_CREAM = "#FFFDF8";
const LUX_TEXT = "#2E2E2E";

const STYLES = `
  @keyframes oyaPreviewHalo   { 0% { transform: scale(0.9); opacity: 0.4; } 50% { transform: scale(1.25); opacity: 0.18; } 100% { transform: scale(1.5); opacity: 0; } }
  .oya-preview-halo   { animation: oyaPreviewHalo 3.4s ease-out infinite; filter: blur(6px); }
`;

// Bug fix (this task) — same gap as NuformSocialWidgetPreview.jsx: size/
// radius/animation were previously hardcoded/ignored. OYA's launcher
// keeps its own luxury "float" motion as the default (its established
// brand identity), but now genuinely turns off for "none" and switches
// for pulse/glow, instead of always floating regardless of the setting.
const WINDOW_SIZE_PX = {
  small: { width: 320, height: 460 },
  medium: { width: 365, height: 547 },
  large: { width: 400, height: 600 },
};
const WINDOW_RADIUS_PX = { small: 14, medium: 22, large: 28 };
const LAUNCHER_SIZE_PX = { small: 52, medium: 62, large: 72 };
const LAUNCHER_ANIMATION_CLASS = {
  none: "",
  float: "animate-launcher-float",
  pulse: "animate-pulse-soft",
  glow: "animate-launcher-glow",
};

/**
 * Real Chatbot UI Preview (OYA by Gemkara) — a faithful, local-only
 * port of frontend/src/component/OyaBot.jsx's actual visual structure,
 * kept deliberately separate from NuformSocialWidgetPreview.jsx so
 * OYA's own luxury branding (maroon/gold palette, halo glow) is never
 * diluted into Nuform Social's look (see task section 18). Never calls
 * bot/v1/* — purely local component state.
 */
export default function OyaWidgetPreview({ config, isMobile = false, mode = "widget" }) {
  const [open, setOpen] = useState(mode === "window");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [formDone, setFormDone] = useState(false);
  const replyIndexRef = useRef(0);
  const scrollRef = useRef(null);
  const cssScopeIdRef = useRef(null);
  if (!cssScopeIdRef.current) cssScopeIdRef.current = nextCssScopeId();

  const sparkles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return { id: i, top: 40 + Math.sin(angle) * 38, left: 40 + Math.cos(angle) * 38 };
      }),
    [],
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Phase 22 — hooks must run unconditionally, so these stay above the
  // `if (!config)` early return below.
  const formsKey = JSON.stringify(config?.forms || {});
  useEffect(() => {
    if (config?.forms?.enabled) setFormDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formsKey]);

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

  // Phase 22 — chatWindow.theme previously had no effect here at all.
  // Same precedence as NuformSocialWidgetPreview.jsx (documented in
  // brandWidgetDefaults.js): explicit customized color always wins,
  // otherwise theme picks which brand palette applies.
  const dark = chatWindow.theme === "dark";
  const darkTokens = BRAND.dark;

  // Phase 22 — behavior.offlineMode previously had zero preview
  // representation.
  const isOffline = behavior.offlineMode === "offline-message";

  // Bug fix (this phase) — font was never read here at all (unlike
  // NuformSocialWidgetPreview.jsx, which read it from the wrong field).
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
  const botName = withBrandFallback(chatWindow.botName, D.chatWindow.botName, BRAND.chatWindow.botName);
  const companyName = withBrandFallback(
    chatWindow.companyName,
    D.chatWindow.companyName,
    BRAND.chatWindow.companyName,
  );
  const botAvatar = withBrandFallback(chatWindow.botAvatar, D.chatWindow.botAvatar, BRAND.chatWindow.botAvatar);
  // Bug fix (this phase) — same as NuformSocialWidgetPreview.jsx.
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
  // Still on the generic schema default -> keep the true two-tone
  // gradient (brand-accurate for the active theme); admin customized
  // it -> flat fill with their color, same convention
  // NuformSocialWidgetPreview/Bot.jsx use. (Checked against the RAW
  // config value, not the computed primaryColor, so this stays correct
  // regardless of theme — see Phase 22 dark-theme precedence note.)
  const stillOnDefaultColor = !chatWindow.primaryColor || chatWindow.primaryColor === D.chatWindow.primaryColor;
  const headerGradientTo = stillOnDefaultColor
    ? dark
      ? darkTokens.header.gradientTo
      : BRAND.launcher.gradientTo
    : primaryColor;

  // Bug fixes (this task).
  const launcherAnimClass = LAUNCHER_ANIMATION_CLASS[launcher.animation] ?? LAUNCHER_ANIMATION_CLASS.float;
  const launcherPx = LAUNCHER_SIZE_PX[launcher.size] || LAUNCHER_SIZE_PX.medium;
  const winSize = WINDOW_SIZE_PX[chatWindow.size] || WINDOW_SIZE_PX.medium;
  const winRadius = WINDOW_RADIUS_PX[chatWindow.borderRadius] ?? WINDOW_RADIUS_PX.large;
  const greetingTitle = launcher.greetingTitle || "✨ Welcome to OYA";
  const greetingMessage = launcher.greetingMessage || "Looking for timeless jewellery?";
  const launcherIcon = launcher.icon || "default";

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
        <div className={`absolute bottom-5 flex flex-col gap-3 ${isLeft ? "left-5 items-start" : "right-5 items-end"}`}>
          {showGreeting && (
            <div
              className="pointer-events-auto flex max-w-[200px] items-start gap-1.5 rounded-xl px-3 py-2.5 text-xs shadow-lg animate-fade-in-up"
              style={{ background: LUX_CREAM, border: `1px solid ${LUX_ACCENT}66` }}
            >
              <img src={BRAND.logo} alt="" className="mt-0.5 h-4 w-4 shrink-0 rounded-full object-cover" />
              <div>
                <p className="font-semibold" style={{ color: LUX_TEXT }}>{greetingTitle}</p>
                <p className="mt-0.5 text-gray-500">{greetingMessage}</p>
              </div>
            </div>
          )}

          {launcher.enabled !== false && (
            <button
              onClick={() => setOpen(true)}
              aria-label="Open chat"
              className="pointer-events-auto relative flex items-center justify-center rounded-full hover:scale-105"
              style={{ width: launcherPx, height: launcherPx }}
            >
              <span
                className="oya-preview-halo pointer-events-none absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${LUX_ACCENT}8c 0%, ${LUX_ACCENT}00 70%)` }}
              />
              {sparkles.map((s) => (
                <span key={s.id} className="pointer-events-none absolute text-[8px]" style={{ top: s.top, left: s.left, color: LUX_GOLD }}>
                  ✦
                </span>
              ))}
              <span className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full shadow-xl ${launcherAnimClass}`}>
                {launcherIcon === "chat" ? (
                  <span className="flex h-full w-full items-center justify-center" style={{ background: BRAND.launcher.color }}>
                    <FiMessageCircle style={{ width: launcherPx * 0.45, height: launcherPx * 0.45 }} className="text-white" />
                  </span>
                ) : launcherIcon === "logo" ? (
                  <img src={botAvatar || BRAND.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center" style={{ background: BRAND.launcher.color }}>
                    <FiZap style={{ width: launcherPx * 0.4, height: launcherPx * 0.4 }} className="text-white" />
                  </span>
                )}
              </span>
              {showNotificationBadge && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: LUX_ACCENT }} />
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
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${headerGradientTo} 100%)` }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-[12px] bg-white/15">
                <img src={botAvatar || BRAND.logo1} alt="" className="h-[34px] w-[38px] rounded-[8px] object-cover" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold leading-none">{botName}</h2>
                <div className="mt-[5px] flex items-center gap-2">
                  <span className={`h-[6px] w-[6px] rounded-full ${isOffline ? "bg-gray-300" : ""}`} style={isOffline ? undefined : { background: "#F3D6B6" }} />
                  <p className="text-[11px] leading-none text-[#f3d6b6]">{isOffline ? "Currently offline" : companyName || "Online · Always ready"}</p>
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
              <button onClick={() => setOpen(false)} aria-label="Close chat preview" className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white/15">
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
                inputBorder={dark ? darkTokens.inputBorder : "#eee0cf"}
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
                        background: dark ? darkTokens.welcomeBg : "#fdf6ec",
                        borderColor: dark ? darkTokens.welcomeBorder : "#d8e9de",
                      }}
                    >
                      {welcomeMessage}
                    </div>
                    <div className="mb-5 flex gap-2">
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium text-white" style={{ background: BRAND.launcher.color }}>
                        <FaPhoneAlt size={12} /> Call
                      </span>
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-[12px] font-medium text-white">
                        <FaWhatsapp size={13} /> WhatsApp
                      </span>
                      <span className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium text-white" style={{ background: LUX_GOLD }}>
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
                          : { background: dark ? darkTokens.bubbleBg : "#fdf6ec", borderColor: dark ? darkTokens.bubbleBorder : "#eee0cf", color: dark ? darkTokens.chatWindow.textColor : "#2d2d2d" }
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {typing && typingIndicatorEnabled && (
                  <div
                    className="inline-flex items-center gap-2 rounded-[18px] rounded-bl-[6px] border px-4 py-3 shadow-sm"
                    style={{ background: dark ? darkTokens.bubbleBg : "#fdf6ec", borderColor: dark ? darkTokens.bubbleBorder : "#eee0cf" }}
                  >
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: BRAND.launcher.color }} />
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: BRAND.launcher.gradientTo, animationDelay: "0.15s" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: LUX_GOLD, animationDelay: "0.3s" }} />
                  </div>
                )}

                {mode === "window" && messages.length === 0 && !typing && !isOffline && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {BRAND.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendPreview(s)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
                        style={{ borderColor: `${LUX_GOLD}80`, color: primaryColor }}
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
                  style={{ borderColor: isOffline ? (dark ? darkTokens.inputBorder : "#eee0cf") : BRAND.launcher.color, opacity: isOffline ? 0.6 : 1 }}
                >
                  <FiPaperclip size={16} style={{ color: dark ? darkTokens.iconColor : "#6b7280" }} />
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isOffline ? "Chat is currently offline" : "Explore elegance with Oya..."}
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
                    style={{ color: dark ? darkTokens.iconColor : BRAND.launcher.color, background: dark ? darkTokens.bubbleBg : "#f3f4f6" }}
                  >
                    <FiMic size={14} />
                  </button>
                  <button
                    type="submit"
                    disabled={isOffline}
                    aria-label="Send preview message"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[12px] text-white"
                    style={{ background: BRAND.launcher.color }}
                  >
                    <FiSend size={14} />
                  </button>
                </div>

                {showBranding && (
                  <p className="mt-3 text-center text-[11px] text-[#9ca3af]">
                    Powered by <span className="font-semibold" style={{ color: BRAND.launcher.color }}>{BRAND.footerBrand}</span>
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
