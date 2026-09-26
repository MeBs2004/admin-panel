import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiX, FiSend, FiCpu } from "react-icons/fi";

const LAUNCHER_SIZE = { small: 48, medium: 56, large: 64 };
const WINDOW_SIZE = {
  small: { width: 300, height: 400 },
  medium: { width: 360, height: 480 },
  large: { width: 400, height: 560 },
};
const RADIUS = { small: 10, medium: 18, large: 26 };
const ANIMATION_CLASS = {
  none: "",
  float: "animate-launcher-float",
  pulse: "animate-pulse-soft",
  glow: "animate-launcher-glow",
};

// Preview-only sample content (Section 9) — never persisted, never
// sent through Groq, never creates a visitor/conversation/message.
// Clearly a fixed script, not live data.
const SAMPLE_SUGGESTIONS = [
  "What services do you offer?",
  "Tell me about pricing",
  "Contact us",
];
const SAMPLE_REPLIES = [
  "We'd be happy to help. Ask me anything about our services.",
  "Great question! Our team can walk you through the details — want me to connect you?",
  "Here's a quick overview — let me know if you'd like more detail on anything.",
];

/**
 * Pure visual renderer — draws a chatbot exactly as `config`
 * describes it. `mode` controls which state a tab shows first
 * ("widget" = closed/launcher, "window" = open); the admin can still
 * toggle either way from there, same as a real visitor could.
 * Chat Window mode also supports typing/clicking a suggestion
 * locally — this ONLY appends to local component state. It never
 * calls the real chat API, never touches Groq, never persists
 * anything, and is fully reset (via the parent's `key={mode}`) every
 * time the tab is switched.
 */
export default function ChatWidgetRenderer({ config, isMobile = false, mode = "widget" }) {
  const [open, setOpen] = useState(mode === "window");
  const [messages, setMessages] = useState(() => []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const replyIndexRef = useRef(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  if (!config) return null;

  const { launcher, chatWindow, behavior, appearance } = config;
  const fontFamily = appearance?.font === "inter" ? "Inter, sans-serif" : undefined;
  const isLeft = launcher.position === "bottom-left";
  const launcherHidden = !launcher.enabled || (isMobile && !launcher.showOnMobile);

  const launcherPx = LAUNCHER_SIZE[launcher.size] || LAUNCHER_SIZE.medium;
  const win = WINDOW_SIZE[chatWindow.size] || WINDOW_SIZE.medium;
  const radius = RADIUS[chatWindow.borderRadius] ?? RADIUS.large;

  const dark = chatWindow.theme === "dark";
  const windowBg = dark ? "#171f1b" : chatWindow.backgroundColor;
  const textColor = dark ? "#f3f4f6" : chatWindow.textColor;
  const bubbleMuted = dark ? "#232d27" : "#f3f4f6";

  const launcherBg = launcher.gradient.enabled
    ? `linear-gradient(135deg, ${launcher.gradient.from}, ${launcher.gradient.to})`
    : launcher.color;

  const botName = chatWindow.botName || "AI Assistant";
  const botInitial = botName.charAt(0).toUpperCase();

  const sendPreview = (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((m) => [...m, { sender: "user", text: trimmed }]);
    setDraft("");
    if (behavior.typingIndicator) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        const reply = SAMPLE_REPLIES[replyIndexRef.current % SAMPLE_REPLIES.length];
        replyIndexRef.current += 1;
        setMessages((m) => [...m, { sender: "bot", text: reply }]);
      }, 900);
    } else {
      const reply = SAMPLE_REPLIES[replyIndexRef.current % SAMPLE_REPLIES.length];
      replyIndexRef.current += 1;
      setMessages((m) => [...m, { sender: "bot", text: reply }]);
    }
  };

  if (launcherHidden) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-xs text-gray-400">
        {!launcher.enabled
          ? "Launcher is disabled — your chatbot won't appear on the site."
          : "Launcher is hidden on mobile for this device preview."}
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute bottom-5 flex flex-col gap-3 ${
        isLeft ? "left-5 items-start" : "right-5 items-end"
      }`}
      style={{ fontFamily }}
    >
      {open && (
        <div
          className="pointer-events-auto flex flex-col overflow-hidden shadow-2xl"
          style={{
            width: win.width,
            height: win.height,
            maxWidth: "calc(100vw - 2.5rem)",
            maxHeight: "calc(100% - 5rem)",
            borderRadius: radius,
            background: windowBg,
            color: textColor,
          }}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center gap-2.5 px-4 py-3.5 text-white"
            style={{ background: chatWindow.primaryColor }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-semibold">
              {chatWindow.botAvatar ? (
                <img src={chatWindow.botAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                botInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{botName}</p>
              <p className="truncate text-[11px] opacity-80">
                {chatWindow.companyName || "Online"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="pointer-events-auto rounded-full p-1 transition-colors hover:bg-white/15"
              aria-label="Close chat preview"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-3.5 text-sm"
          >
            {chatWindow.welcomeMessage && (
              <div
                className="max-w-[80%] self-start rounded-2xl px-3 py-2"
                style={{ background: bubbleMuted, color: textColor }}
              >
                {chatWindow.welcomeMessage}
              </div>
            )}
            <div
              className="max-w-[80%] self-end rounded-2xl px-3 py-2 text-white"
              style={{ background: chatWindow.primaryColor }}
            >
              Tell me about your services.
            </div>
            <div
              className="max-w-[80%] self-start rounded-2xl px-3 py-2"
              style={{ background: bubbleMuted, color: textColor }}
            >
              We'd be happy to help. Ask me anything about our services.
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] animate-fade-in-up rounded-2xl px-3 py-2 ${
                  m.sender === "user" ? "self-end text-white" : "self-start"
                }`}
                style={{
                  background: m.sender === "user" ? chatWindow.primaryColor : bubbleMuted,
                  color: m.sender === "user" ? "#fff" : textColor,
                }}
              >
                {m.text}
              </div>
            ))}

            {typing && (
              <div
                className="flex w-fit items-center gap-1 self-start rounded-2xl px-3 py-2.5"
                style={{ background: bubbleMuted }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-pulse-soft rounded-full opacity-60"
                    style={{ background: textColor, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}

            {mode === "window" && messages.length === 0 && !typing && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SAMPLE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendPreview(s)}
                    className="pointer-events-auto rounded-full border px-2.5 py-1 text-xs transition-colors hover:opacity-80"
                    style={{ borderColor: chatWindow.primaryColor, color: chatWindow.primaryColor }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            className="flex shrink-0 items-center gap-2 border-t px-3 py-2.5"
            style={{ borderColor: dark ? "#2a352f" : "#e5e7eb" }}
            onSubmit={(e) => {
              e.preventDefault();
              sendPreview(draft);
            }}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your message..."
              aria-label="Preview message (not sent anywhere)"
              className="pointer-events-auto flex-1 truncate rounded-full px-3.5 py-2 text-xs outline-none"
              style={{ background: bubbleMuted, color: textColor }}
            />
            <button
              type="submit"
              aria-label="Send preview message"
              className="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
              style={{ background: chatWindow.primaryColor }}
            >
              <FiSend className="h-3.5 w-3.5" />
            </button>
          </form>

          {chatWindow.showBranding && (
            <p className="shrink-0 bg-black/[0.03] py-1.5 text-center text-[10px] opacity-50">
              Powered by Nuformly
            </p>
          )}
        </div>
      )}

      {!open && launcher.showGreeting && (
        <div className="pointer-events-auto max-w-[220px] animate-fade-in-up rounded-2xl border border-gray-100 bg-white px-3.5 py-3 text-xs shadow-lg">
          <p className="font-semibold text-gray-800">{launcher.greetingTitle}</p>
          <p className="mt-0.5 text-gray-500">{launcher.greetingMessage}</p>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle chat preview"
        className={`pointer-events-auto relative flex shrink-0 items-center justify-center text-white shadow-xl transition-transform duration-150 hover:scale-105 ${
          launcher.shape === "rounded-square" ? "rounded-2xl" : "rounded-full"
        } ${!open ? ANIMATION_CLASS[launcher.animation] || "" : ""}`}
        style={{ width: launcherPx, height: launcherPx, background: launcherBg }}
      >
        {open ? (
          <FiX style={{ width: launcherPx * 0.4, height: launcherPx * 0.4 }} />
        ) : launcher.icon === "logo" && chatWindow.botAvatar ? (
          <img
            src={chatWindow.botAvatar}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : launcher.icon === "chat" ? (
          <FiMessageCircle style={{ width: launcherPx * 0.42, height: launcherPx * 0.42 }} />
        ) : (
          <FiCpu style={{ width: launcherPx * 0.42, height: launcherPx * 0.42 }} />
        )}

        {!open && launcher.showNotificationBadge && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-danger-500 text-[9px] font-bold text-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}
