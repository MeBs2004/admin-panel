import { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiSend, FiPhone, FiMail, FiMessageCircle, FiVolume2, FiPlus, FiMic, FiSquare, FiFile, FiTrash2 } from "react-icons/fi";
import { FaWhatsapp, FaFilePdf, FaFileWord, FaFileExcel, FaFile } from "react-icons/fa";
import LauncherIcon from "../studio/LauncherIcon.jsx";
import ChatbotFormsPreview from "./ChatbotFormsPreview.jsx";
import { playPreviewChime } from "./previewChime.js";
import { resolveLauncherStyle, resolveWindowStyle, animClass, messageAnimClass, readableOn, welcomeFor, uiText, shown } from "../../config/widgetStyle.js";
import { buildScopedCss, nextCssScopeId } from "./scopedCustomCss.js";

const CTA_ICON = { call: FiPhone, whatsapp: FaWhatsapp, email: FiMail, custom: FiMessageCircle };

// Preview-only sample content — never persisted, never sent through
// the AI, never creates a visitor/conversation/message. A fixed
// script, clearly not live data.
const SAMPLE = {
  English: {
    suggestions: ["What services do you offer?", "Tell me about SEO", "Website development details", "Performance marketing info", "Social media services", "Corporate AV production"],
    replies: [
      "We'd be happy to help. Ask me anything about our services.",
      "Great question! Our team can walk you through the details — want me to connect you?",
      "Here's a quick overview — let me know if you'd like more detail on anything.",
    ],
    userLine: "Tell me about your services.",
    placeholder: "Type a message...",
    listen: "Listen",
    stop: "Stop",
  },
  Hindi: {
    suggestions: ["आप कौन सी सेवाएँ देते हैं?", "SEO के बारे में बताइए", "वेबसाइट डेवलपमेंट की जानकारी", "परफॉर्मेंस मार्केटिंग की जानकारी", "सोशल मीडिया सेवाएँ", "कॉर्पोरेट AV प्रोडक्शन"],
    replies: [
      "हमें आपकी मदद करके खुशी होगी। हमारी सेवाओं के बारे में कुछ भी पूछें।",
      "बहुत अच्छा सवाल! हमारी टीम आपको विस्तार से बता सकती है।",
      "यह एक संक्षिप्त जानकारी है — और विवरण चाहिए तो बताइए।",
    ],
    userLine: "मुझे अपनी सेवाओं के बारे में बताइए।",
    placeholder: "संदेश लिखें...",
    listen: "सुनें",
    stop: "रोकें",
  },
};

// Real browser speech, used by the preview's Listen button and microphone —
// local only, nothing is sent anywhere.
const SpeechRecognitionApi = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

function cancelSpeech() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* no speech synthesis */
  }
}

function speakText(text, lang, onEnd) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return onEnd?.();
    synth.cancel();
    const clean = text
      .replace(/[#*_>`~-]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || lang;
    utterance.rate = lang.startsWith("hi") ? 0.82 : 0.96;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    synth.speak(utterance);
  } catch {
    onEnd?.();
  }
}

const fileKind = (type = "") =>
  type.startsWith("image/") ? "image" : type.startsWith("video/") ? "video" : type === "application/pdf" ? "pdf" : /word/.test(type) ? "word" : /excel|spreadsheet/.test(type) ? "excel" : "file";
const FILE_ICON = { pdf: FaFilePdf, word: FaFileWord, excel: FaFileExcel, file: FaFile };
const FILE_COLOR = { pdf: "#dc2626", word: "#1d4ed8", excel: "#15803d" };
const FILE_CAPTION = { pdf: "PDF Document", word: "Word Document", excel: "Excel Spreadsheet" };

// An attachment in a message bubble: image/video preview, or a document card.
function FileBlock({ file, primary }) {
  const kind = fileKind(file.type);
  if (kind === "image" && file.preview) return <img src={file.preview} alt={file.name} className="mb-3 max-w-full rounded-xl border" />;
  if (kind === "video" && file.preview) {
    return (
      <video controls className="mb-3 max-w-full rounded-xl border">
        <source src={file.preview} type={file.type} />
      </video>
    );
  }
  const Icon = FILE_ICON[kind] || FaFile;
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border bg-white p-3 text-[#2d2d2d]">
      <Icon className="shrink-0 text-xl" style={{ color: FILE_COLOR[kind] || primary }} />
      <div className="flex-1 overflow-hidden">
        <div className="truncate font-medium">{file.name}</div>
        <div className="text-xs text-gray-500">{FILE_CAPTION[kind] || `${(file.size / 1024).toFixed(1)} KB`}</div>
      </div>
    </div>
  );
}

// Longhand background properties only: mixing the `background` shorthand with
// backgroundImage/backgroundSize makes React drop layers when a theme changes.
const isGradient = (v) => typeof v === "string" && v.includes("gradient(");
function fillStyle(fill, pattern) {
  const layers = [pattern, isGradient(fill) ? fill : null].filter((v) => v && v !== "none");
  return { backgroundColor: isGradient(fill) ? undefined : fill, backgroundImage: layers.length ? layers.join(", ") : undefined };
}

const nowLabel = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Pure visual renderer — draws a chatbot exactly as `config`
 * describes it, using the SAME style resolver and animation
 * definitions (config/widgetStyle.js) as the real widget, so the
 * preview can't drift from production. `mode` picks the first state
 * ("widget" = closed launcher, "window" = open); `replayKey` restarts
 * every animation on demand. Local typing only appends to component
 * state — nothing here ever calls the real chat API. `replyFor(text)`
 * optionally scripts the reply to a typed message (the landing demo).
 */
export default function ChatWidgetRenderer({ config, isMobile = false, mode = "widget", replayKey = 0, sampleChat = false, editMode = false, onEdit, replyFor }) {
  const [open, setOpen] = useState(mode === "window");
  // Who opened the window: an automatic open uses behavior.autoOpenAnimation.
  const [openedBy, setOpenedBy] = useState("manual");
  const rearmedRef = useRef(false);
  const [messages, setMessages] = useState(() => []);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [formDone, setFormDone] = useState(false);
  const [lang, setLang] = useState(config?.language?.defaultLanguage || "English");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [emailAsked, setEmailAsked] = useState(false);
  const replyIndexRef = useRef(0);
  const scrollRef = useRef(null);
  const cssScopeIdRef = useRef(nextCssScopeId());
  const scopedCss = useMemo(
    () => buildScopedCss(config?.appearance?.customCss, `[data-nf-css-scope="${cssScopeIdRef.current}"]`),
    [config?.appearance?.customCss],
  );

  // A fresh chat opens at the welcome message; only follow the conversation once it moves.
  const firstScrollRef = useRef(true);
  useEffect(() => {
    if (firstScrollRef.current) {
      firstScrollRef.current = false;
      return;
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, recording]);

  // ── Launcher greeting bubble ───────────────────────────────────────
  const launcherCfg = config?.launcher || {};
  const teasers = (launcherCfg.teaserMessages || []).filter((m) => typeof m === "string" && m.trim());
  const bubbles = useMemo(
    () => [
      ...(launcherCfg.showGreeting ? [{ title: launcherCfg.greetingTitle, text: launcherCfg.greetingMessage }] : []),
      ...teasers.map((t) => ({ text: t })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [launcherCfg.showGreeting, launcherCfg.greetingTitle, launcherCfg.greetingMessage, teasers.join("\u0000")],
  );
  const typingBubbles = launcherCfg.bubbleEffect === "typing";
  const fullText = (b) => (b ? (b.title ? `${b.title} ${b.text}` : b.text) : "");
  // Typing effect: starts visible (so the setting shows immediately), then
  // cycles hide → pause → indicator → typewriter → hold, like the live widget.
  const [bubbleStage, setBubbleStage] = useState("visible");
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const holdMs = (Number(launcherCfg.bubbleHoldSeconds) || 4) * 1000;
  const pauseMs = (Number(launcherCfg.bubblePauseSeconds) || 8) * 1000;
  const randomOrder = launcherCfg.bubbleOrder === "random";

  useEffect(() => {
    if (!typingBubbles || bubbles.length === 0 || open) return undefined;
    let cancelled = false;
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(() => !cancelled && fn(), ms));
    let last = 0;
    let seq = 0;
    const pick = () => {
      if (bubbles.length === 1) return 0;
      if (randomOrder) {
        let n;
        do n = Math.floor(Math.random() * bubbles.length);
        while (n === last);
        return n;
      }
      return ++seq % bubbles.length;
    };
    const hold = () =>
      later(holdMs, () => {
        setBubbleStage("hiding");
        later(300, () => {
          setBubbleStage("idle");
          later(pauseMs, cycle);
        });
      });
    function cycle() {
      const index = pick();
      last = index;
      setBubbleIndex(index);
      setBubbleText("");
      setBubbleStage("indicator");
      later(700, () => {
        setBubbleStage("typing");
        const text = fullText(bubbles[index]);
        const type = (n) => {
          setBubbleText(text.slice(0, n));
          if (n >= text.length) {
            setBubbleStage("visible");
            hold();
            return;
          }
          later(40, () => type(n + 1));
        };
        type(0);
      });
    }
    setBubbleIndex(0);
    setBubbleText(fullText(bubbles[0]));
    setBubbleStage("visible");
    hold();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [typingBubbles, bubbles, open, holdMs, pauseMs, randomOrder, replayKey]);

  // Plain rotation (no typing effect) — like the live widget's default.
  const bubbleCount = bubbles.length;
  useEffect(() => {
    if (typingBubbles || bubbleCount < 2) return undefined;
    const t = setInterval(() => setTeaserIndex((i) => (i + 1) % bubbleCount), 3500);
    return () => clearInterval(t);
  }, [typingBubbles, bubbleCount]);

  // behavior.autoOpen — the real widget opens after `autoOpenDelay`
  // seconds; capped at 5s here so it can be tested without waiting.
  const autoOpen = Boolean(config?.behavior?.autoOpen);
  const autoOpenDelay = Number(config?.behavior?.autoOpenDelay) || 0;
  const autoOpenAnimation = config?.behavior?.autoOpenAnimation || "default";
  useEffect(() => {
    if (mode !== "widget" || !autoOpen) return undefined;
    // After the first run, any change (or Replay) closes the window so
    // you watch it open by itself again.
    if (rearmedRef.current) setOpen(false);
    rearmedRef.current = true;
    const t = setTimeout(() => {
      setOpenedBy("auto");
      setOpen(true);
    }, Math.min(autoOpenDelay, 5) * 1000);
    return () => clearTimeout(t);
  }, [mode, autoOpen, autoOpenDelay, autoOpenAnimation, replayKey]);

  // forms.* — any change to the form setup shows the gate again.
  const formsKey = `${config?.forms?.enabled}|${config?.forms?.style}|${(config?.forms?.fields || []).join(",")}`;
  useEffect(() => {
    setFormDone(false);
  }, [formsKey, replayKey]);

  // language.defaultLanguage — follow the setting when it changes.
  const defaultLanguage = config?.language?.defaultLanguage || "English";
  useEffect(() => {
    setLang(defaultLanguage);
  }, [defaultLanguage]);

  // Voice input: real speech-to-text into the box; like the live widget it
  // stops by itself after 5 seconds of silence.
  const stopMic = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setRecording(false);
  };
  useEffect(() => {
    if (!recording) return undefined;
    const t = setTimeout(stopMic, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, draft]);

  // Never leave the browser talking or listening after the preview goes away.
  useEffect(
    () => () => {
      cancelSpeech();
      try {
        recognitionRef.current?.stop();
      } catch {
        /* nothing running */
      }
    },
    [],
  );

  if (!config) return null;

  const { launcher, chatWindow, behavior, forms, ctas = [], suggestions: configuredSuggestions = [] } = config;
  // "Click to edit": in edit mode a click on any marked element opens that
  // element's setting in the Studio instead of doing what the element does.
  const handleEditClick = (e) => {
    if (!editMode || !onEdit) return;
    const el = e.target instanceof Element ? e.target.closest("[data-edit]") : null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    onEdit(el.getAttribute("data-edit"));
  };
  const emailPromptText = uiText(config, "emailPrompt", "📧 Before we continue, could you please share your email address so our team can assist you better?");
  const L = resolveLauncherStyle(config);
  const W = resolveWindowStyle(config);
  const sample = SAMPLE[lang] || SAMPLE.English;
  const enabledCtas = ctas.filter((c) => c.enabled && c.label);
  const displaySuggestions = configuredSuggestions.length > 0 ? configuredSuggestions : sample.suggestions;
  const isLeft = launcher.position === "bottom-left";
  const launcherHidden = !launcher.enabled || (isMobile && !launcher.showOnMobile);
  const isOffline = behavior.offlineMode === "offline-message";
  const showForm = Boolean(forms?.enabled) && !formDone;

  const botName = chatWindow.botName || "AI Assistant";
  const botInitial = botName.charAt(0).toUpperCase();
  const subtitle = isOffline ? "Currently offline" : chatWindow.subtitle || chatWindow.companyName || "Online";
  const msgAnimFor = (isUser) => messageAnimClass("nfp", chatWindow.messageAnimation, isUser);
  const winAnimName = openedBy === "auto" && autoOpenAnimation !== "default" ? autoOpenAnimation : chatWindow.windowAnimation;
  const winAnim = animClass("nfp", "win", winAnimName);
  const suggAnim = animClass("nfp", "sugg", chatWindow.suggestionAnimation);
  const typingStyle = chatWindow.typingStyle || "dots";
  const welcomeText = welcomeFor(config, lang);
  const welcomeWidth = W.welcomeMaxWidthPct ?? W.bubbleMaxWidthPct;
  const bubbleLineHeight = W.lineHeight ? `${W.lineHeight}px` : undefined;
  const brandLine = W.brandName || "Nuformly";
  const inputBg = W.dark ? "#0f1512" : "#fff";

  const plainBubble = bubbles[teaserIndex % Math.max(1, bubbles.length)];
  const bubble = typingBubbles ? bubbles[bubbleIndex] : plainBubble;
  const showBubble = !open && bubble && (typingBubbles ? bubbleStage !== "idle" : true);
  // The original widget shows the orange dot only while its greeting bubble is up.
  const showBadge = Boolean(launcher.showNotificationBadge) && (!(L.badgeWithBubble && typingBubbles) || bubbleStage !== "idle");

  const sc = W.suggestionColors;
  const suggestionStyle = {
    ...(chatWindow.suggestionStyle === "outline"
      ? { background: "transparent", color: W.primary, border: `1.5px solid ${W.primary}` }
      : chatWindow.suggestionStyle === "filled"
        ? { background: W.primary, color: W.sendText, border: "1.5px solid transparent" }
        : { background: W.botBubble, color: W.botText, border: "1.5px solid transparent" }),
    ...(sc.bg ? { background: sc.bg } : {}),
    ...(sc.text ? { color: sc.text } : {}),
    ...(sc.border ? { border: `1px solid ${sc.border}` } : {}),
  };

  const botReply = (override) => {
    const reply = override || sample.replies[replyIndexRef.current % sample.replies.length];
    if (!override) replyIndexRef.current += 1;
    setMessages((m) => {
      const next = [...m, { sender: "bot", text: reply, ts: nowLabel() }];
      // After the third question the real widget asks for an email, once.
      if (behavior.askEmail && !emailAsked && next.filter((x) => x.sender === "user").length >= 3) {
        next.push({ sender: "bot", text: emailPromptText, ts: nowLabel() });
        setEmailAsked(true);
      }
      return next;
    });
    if (behavior.sound) playPreviewChime();
  };

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile({
      name: picked.name,
      type: picked.type,
      size: picked.size,
      preview: picked.type.startsWith("image/") || picked.type.startsWith("video/") ? URL.createObjectURL(picked) : "",
    });
  };
  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const micSupported = Boolean(SpeechRecognitionApi);
  const handleMic = () => {
    if (typing) return;
    if (recording) return stopMic();
    if (draft.trim() || !SpeechRecognitionApi) return; // don't record over typed text
    const rec = new SpeechRecognitionApi();
    rec.lang = lang === "Hindi" ? "hi-IN" : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      setDraft((finalText + interim).trim());
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    setDraft("");
    setRecording(true);
    rec.start();
  };

  // Listen / Stop under a bot reply — reads it aloud with the browser's voice.
  const toggleListen = (id, text) => {
    if (speakingIndex === id) {
      cancelSpeech();
      setSpeakingIndex(null);
      return;
    }
    cancelSpeech();
    setSpeakingIndex(id);
    speakText(text, lang === "Hindi" ? "hi-IN" : "en-US", () => setSpeakingIndex((cur) => (cur === id ? null : cur)));
  };

  const sendPreview = (text) => {
    const trimmed = text.trim();
    if ((!trimmed && !file) || typing) return;
    if (recording) stopMic();
    const sent = file;
    setMessages((m) => [...m, { sender: "user", text: trimmed, ts: nowLabel(), file: sent }]);
    setDraft("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const reply = sent
      ? lang === "Hindi"
        ? `मुझे “${sent.name}” मिल गई। आपके लाइव चैटबॉट में AI इसे पढ़कर जवाब देगा।`
        : `Got “${sent.name}”. In your live chatbot the AI reads attachments like this and answers questions about them.`
      : replyFor?.(trimmed) || null;
    if (behavior.typingIndicator) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        botReply(reply);
      }, 1400);
    } else {
      botReply(reply);
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

  const Avatar = ({ size }) => (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold"
      style={{ width: size, height: size, background: W.primary, color: W.sendText, fontSize: Math.round(size * 0.42) }}
    >
      {chatWindow.botAvatar ? <img src={chatWindow.botAvatar} alt="" className="h-full w-full object-cover" /> : botInitial}
    </div>
  );
  const statusDot = (
    <span
      className="inline-block shrink-0 animate-pulse rounded-full"
      style={{ width: 6, height: 6, background: isOffline ? "#9ca3af" : W.statusDotColor, boxShadow: isOffline ? "none" : `0 0 8px ${W.statusDotColor}` }}
    />
  );
  const subtitleStyle = { fontSize: W.headerSubtitleSize, ...(W.headerSubtitleColor ? { color: W.headerSubtitleColor } : { opacity: 0.8 }) };
  const bubbleText14 = bubbleLineHeight ? { lineHeight: bubbleLineHeight } : {};

  return (
    <div
      className={`pointer-events-none absolute inset-x-5 bottom-5 top-5 flex flex-col justify-end gap-3 ${isLeft ? "items-start" : "items-end"}`}
      style={{ fontFamily: W.fontFamily, fontSize: W.fontSize }}
      data-nf-css-scope={cssScopeIdRef.current}
      data-editing={editMode ? "on" : undefined}
      onClickCapture={handleEditClick}
      data-auto-open={autoOpen ? autoOpenDelay : "off"}
      data-auto-open-animation={autoOpen ? autoOpenAnimation : "off"}
      data-typing-indicator={behavior.typingIndicator ? "on" : "off"}
      data-ask-email={behavior.askEmail ? "on" : "off"}
      data-sound={behavior.sound ? "on" : "off"}
      data-badge-with-bubble={L.badgeWithBubble ? "on" : "off"}
      data-typing-style={typingStyle}
      data-typing-dot-size={W.typingDot}
      data-bubble-timing={`${typingBubbles ? "typing" : "plain"}|${randomOrder ? "random" : "sequence"}|${holdMs}|${pauseMs}`}
    >
      {W.fontUrl && <style>{`@import url('${W.fontUrl}');`}</style>}
      <style>{`.nfp-input::placeholder { color: var(--nf-ph, #9ca3af); opacity: 1 }`}</style>
      {scopedCss ? <style>{scopedCss}</style> : null}

      {open && (
        <div
          key={`win-${replayKey}-${winAnimName}`}
          data-edit="chatWindow.backgroundColor"
          className={`pointer-events-auto flex flex-col overflow-hidden border ${winAnim}`}
          style={{
            width: W.width,
            height: W.height,
            // The frame is the limit, not the page: the window shrinks
            // (its message area scrolls) instead of growing out of view.
            maxWidth: "100%",
            minHeight: 0,
            flexShrink: 1,
            borderRadius: W.radius,
            background: W.windowBg,
            color: W.baseText,
            borderColor: W.border,
            boxShadow: W.shadow,
          }}
        >
          {/* Header */}
          <div
            data-edit="chatWindow.headerGradient"
            className={`flex shrink-0 items-center justify-between gap-2.5 px-4 ${animClass("nfp", "head", chatWindow.headerAnimation)}`}
            style={{ ...fillStyle(W.headerBg), backgroundSize: W.headerBgSize, color: W.headerText, height: W.headerHeight }}
          >
            <div className="flex min-w-0 items-center gap-3">
              {shown(config, "showHeaderAvatar") && (
              <div data-edit="chatWindow.botAvatar" className={`relative shrink-0 ${animClass("nfp", "avatar", chatWindow.avatarAnimation)}`}>
                {chatWindow.botAvatar && W.avatarTile ? (
                  <div
                    className="flex items-center justify-center overflow-hidden"
                    style={{ width: W.avatarSize, height: W.avatarSize, borderRadius: W.avatarRadius, background: "rgba(255,255,255,.13)" }}
                  >
                    <img src={chatWindow.botAvatar} alt="" className="object-cover" style={{ width: W.avatarSize - 5, height: W.avatarSize - 5, borderRadius: 8 }} />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center overflow-hidden bg-white/20 font-semibold"
                    style={{ width: W.avatarSize, height: W.avatarSize, fontSize: Math.round(W.avatarSize * 0.36), borderRadius: W.avatarRadius }}
                  >
                    {chatWindow.botAvatar ? <img src={chatWindow.botAvatar} alt="" className="h-full w-full object-cover" /> : botInitial}
                  </div>
                )}
                {chatWindow.showStatusDot !== false && !W.inlineStatus && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${isOffline ? "bg-gray-400" : "nfp-status"}`}
                    style={isOffline ? undefined : { background: W.statusDotColor }}
                  />
                )}
              </div>
              )}
              <div className="min-w-0">
                <p data-edit="chatWindow.botName" className="truncate whitespace-nowrap font-semibold leading-none" style={{ fontSize: W.headerTitleSize }}>{botName}</p>
                {W.inlineStatus && chatWindow.showStatusDot !== false ? (
                  <div className="mt-[5px] flex items-center gap-2">
                    {statusDot}
                    <p data-edit="chatWindow.subtitle" className="truncate leading-none" style={subtitleStyle}>{subtitle}</p>
                  </div>
                ) : (
                  <p data-edit="chatWindow.subtitle" className="mt-1 truncate" style={subtitleStyle}>{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {shown(config, "showClearButton") && (
                <button
                  type="button"
                  data-edit="chatWindow.showClearButton"
                  onClick={() => setMessages([])}
                  title="Clear history"
                  aria-label="Clear chat history"
                  className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
                >
                  <FiTrash2 size={11} />
                </button>
              )}
              {shown(config, "showLanguageSelector") && (
                <select
                  value={lang}
                  data-edit="chatWindow.showLanguageSelector"
                  onChange={(e) => setLang(e.target.value)}
                  aria-label="Language"
                  className="pointer-events-auto cursor-pointer rounded-lg bg-white/20 px-1 py-1 text-[10px] outline-none"
                  style={{ color: W.headerText }}
                >
                  <option value="English" style={{ color: "#111" }}>EN</option>
                  <option value="Hindi" style={{ color: "#111" }}>हिं</option>
                </select>
              )}
              {shown(config, "showCloseButton") && (
                <button data-edit="chatWindow.showCloseButton" onClick={() => setOpen(false)} className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 hover:rotate-90" aria-label="Close chat preview">
                  <FiX size={13} />
                </button>
              )}
            </div>
          </div>

          {showForm ? (
            <div className="flex-1 overflow-y-auto" style={{ background: W.chatBg }} data-edit="forms.fields">
              <ChatbotFormsPreview
                fields={forms.fields}
                style={forms.style}
                primaryColor={W.primary}
                panelText={W.baseText}
                inputBg={inputBg}
                inputBorder={W.border}
                sizes={W.form}
                texts={{
                  title: uiText(config, "formTitle", "Before we start"),
                  subtitle: uiText(config, "formSubtitle", "A few details so we can help you faster."),
                  button: uiText(config, "formButtonLabel", "Start Chat"),
                }}
                onComplete={() => setFormDone(true)}
              />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto"
                style={{ ...fillStyle(W.chatBg, W.chatBgImage), backgroundSize: W.chatBgSize, padding: W.contentPadding }}
              >
                {isOffline && (
                  <div
                    data-edit="chatWindow.offlineMessage"
                    className={`rounded-[14px] border px-3 py-2.5 text-xs leading-5 ${msgAnimFor(false)}`}
                    style={{ marginBottom: W.messageGap, color: W.baseText, background: W.dark ? "#2a2217" : "#fff7ed", borderColor: W.dark ? "#5b4524" : "#fed7aa" }}
                  >
                    {uiText(config, "offlineMessage", "We're currently offline. Leave a message and we'll get back to you as soon as we're back.")}
                  </div>
                )}

                {welcomeText && shown(config, "showWelcome") && (
                  <div key={`w-${replayKey}`} className={`flex items-end gap-2 ${msgAnimFor(false)}`} style={{ marginBottom: W.sectionGap ?? W.messageGap }}>
                    {chatWindow.showMessageAvatars && welcomeWidth < 100 && <Avatar size={W.messageAvatarSize} />}
                    <div
                      data-edit="chatWindow.welcomeMessage"
                      style={{
                        background: W.welcomeBg,
                        color: W.botText,
                        border: W.welcomeBorder,
                        borderRadius: W.welcomeRadius,
                        fontSize: W.welcomeFontSize,
                        padding: `${W.bubblePadY + 4}px ${W.bubblePadX + 1}px`,
                        maxWidth: `${welcomeWidth}%`,
                        width: welcomeWidth >= 100 ? "100%" : undefined,
                        lineHeight: W.welcomeLineHeight ? `${W.welcomeLineHeight}px` : bubbleLineHeight || 1.7,
                      }}
                    >
                      {welcomeText}
                    </div>
                  </div>
                )}

                {messages.length === 0 && shown(config, "showCtas") && enabledCtas.length > 0 && (
                  <div className={`flex flex-wrap ${msgAnimFor(false)}`} style={{ gap: W.ctaGap, marginBottom: W.sectionGap ?? W.messageGap }}>
                    {enabledCtas.map((cta, i) => {
                      const Icon = CTA_ICON[cta.type] || FiMessageCircle;
                      const bg = cta.color || W.primary;
                      return (
                        <span
                          key={i}
                          data-edit={`ctas.${ctas.indexOf(cta)}`}
                          className="pointer-events-auto flex items-center justify-center gap-2 px-3 font-medium"
                          style={{
                            background: bg,
                            color: readableOn(bg),
                            minHeight: W.ctaHeight,
                            fontSize: W.ctaFontSize,
                            borderRadius: W.ctaRadius,
                            ...(W.ctaWidth ? { width: W.ctaWidth } : { flex: "1 1 0" }),
                          }}
                        >
                          <Icon style={{ width: W.ctaFontSize, height: W.ctaFontSize }} /> {cta.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {sampleChat && (
                <>
                <div className={`flex items-end justify-end gap-2 ${msgAnimFor(true)}`} key={`u-${replayKey}`} style={{ animationDelay: "100ms", marginBottom: W.messageGap }}>
                  <div className="flex flex-col items-end" style={{ maxWidth: `${W.bubbleMaxWidthPct}%` }}>
                    <div data-edit="chatWindow.userBubbleColor" style={{ background: W.userBubble, color: W.userText, borderRadius: W.userRadius, boxShadow: W.userShadow, padding: `${W.bubblePadY}px ${W.bubblePadX}px`, ...bubbleText14 }}>
                      {sample.userLine}
                    </div>
                    {behavior.showTimestamps && <span className="mt-0.5 text-[10px] opacity-50">9:41 AM</span>}
                  </div>
                </div>
                <div className={`flex ${W.avatarTop ? "items-start" : "items-end"} gap-2 ${msgAnimFor(false)}`} key={`b-${replayKey}`} style={{ animationDelay: "250ms", marginBottom: W.messageGap }}>
                  {chatWindow.showMessageAvatars && (
                    <div className={W.avatarTop ? "mt-1 shrink-0" : "shrink-0"}>
                      <Avatar size={W.messageAvatarSize} />
                    </div>
                  )}
                  <div className="flex flex-col items-start" style={{ maxWidth: `${W.bubbleMaxWidthPct}%` }}>
                    <div data-edit="chatWindow.botBubbleColor" style={{ background: W.botBubble, color: W.botText, border: W.botBorder, borderRadius: W.botRadius, padding: `${W.bubblePadY}px ${W.bubblePadX}px`, ...bubbleText14 }}>
                      {sample.replies[0]}
                      {behavior.textToSpeech && (
                        <button
                          type="button"
                          data-edit="behavior.textToSpeech"
                          onClick={() => toggleListen("sample", sample.replies[0])}
                          className="pointer-events-auto mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#6b7280] hover:text-[#4b5563]"
                        >
                          {speakingIndex === "sample" ? <FiSquare size={13} /> : <FiVolume2 size={14} />}
                          <span>{speakingIndex === "sample" ? uiText(config, "stopLabel", sample.stop) : uiText(config, "listenLabel", sample.listen)}</span>
                        </button>
                      )}
                    </div>
                    {behavior.showTimestamps && <span className="mt-0.5 text-[10px] opacity-50">9:41 AM</span>}
                  </div>
                </div>
                </>
                )}

                {messages.map((m, i) => {
                  const isUser = m.sender === "user";
                  return (
                    <div key={i} className={`flex ${W.avatarTop ? "items-start" : "items-end"} gap-2 ${isUser ? "justify-end" : ""} ${msgAnimFor(isUser) || "nfp-msg-fade"}`} style={{ marginBottom: W.messageGap }}>
                      {!isUser && chatWindow.showMessageAvatars && (
                        <div className={W.avatarTop ? "mt-1 shrink-0" : "shrink-0"}>
                          <Avatar size={W.messageAvatarSize} />
                        </div>
                      )}
                      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`} style={{ maxWidth: `${W.bubbleMaxWidthPct}%` }}>
                        <div
                          data-edit={isUser ? "chatWindow.userBubbleColor" : "chatWindow.botBubbleColor"}
                          style={{
                            background: isUser ? W.userBubble : W.botBubble,
                            color: isUser ? W.userText : W.botText,
                            border: isUser ? "none" : W.botBorder,
                            borderRadius: isUser ? W.userRadius : W.botRadius,
                            boxShadow: isUser ? W.userShadow : "none",
                            padding: `${W.bubblePadY}px ${W.bubblePadX}px`,
                            ...bubbleText14,
                          }}
                        >
                          {m.file && <FileBlock file={m.file} primary={W.primary} />}
                          {m.text}
                          {!isUser && behavior.textToSpeech && (
                            <button
                              type="button"
                              data-edit="behavior.textToSpeech"
                              onClick={() => toggleListen(i, m.text)}
                              className="pointer-events-auto mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#6b7280] hover:text-[#4b5563]"
                            >
                              {speakingIndex === i ? <FiSquare size={13} /> : <FiVolume2 size={14} />}
                              <span>{speakingIndex === i ? uiText(config, "stopLabel", sample.stop) : uiText(config, "listenLabel", sample.listen)}</span>
                            </button>
                          )}
                        </div>
                        {behavior.showTimestamps && <span className="mt-0.5 text-[10px] opacity-50">{m.ts}</span>}
                      </div>
                    </div>
                  );
                })}

                {typing && (
                  <div
                    data-edit="chatWindow.typingStyle"
                    className={`nfp-typing nfp-typing-${typingStyle} w-fit px-3.5 py-3 ${msgAnimFor(false)}`}
                    style={{ marginBottom: W.messageGap, background: W.botBubble, borderRadius: W.botRadius, border: W.botBorder, "--nf-dot": W.primary, "--nf-dot-size": `${W.typingDot}px` }}
                    aria-label="Typing"
                  >
                    <i />
                    <i />
                    <i />
                  </div>
                )}

                {messages.length === 0 && !typing && shown(config, "showSuggestions") && (
                  <div
                    style={{
                      gap: W.suggestionGap,
                      marginTop: W.suggestionGap,
                      ...(W.suggestionWidth ? { display: "flex", flexWrap: "wrap" } : { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }),
                    }}
                  >
                    {displaySuggestions.map((s, i) => (
                      <button
                        key={`${s}-${replayKey}-${chatWindow.suggestionAnimation}`}
                        data-edit={configuredSuggestions.length > 0 ? `suggestions.${i}` : "suggestions"}
                        onClick={() => sendPreview(s)}
                        className={`pointer-events-auto flex items-center rounded-full text-left font-medium transition-transform hover:scale-105 ${suggAnim}`}
                        style={{
                          ...suggestionStyle,
                          animationDelay: `${i * 70 + 300}ms`,
                          minHeight: W.suggestionHeight,
                          fontSize: W.suggestionFontSize,
                          lineHeight: "16px",
                          boxShadow: "0 1px 2px rgba(0,0,0,.05)",
                          padding: `0 ${W.suggestionPadX}px`,
                          ...(W.suggestionWidth ? { width: W.suggestionWidth } : {}),
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {recording && (
                  <div className="flex justify-end" style={{ marginBottom: W.messageGap }}>
                    <div className="px-4 py-3" style={{ background: W.userBubble, color: W.userText, borderRadius: W.userRadius, width: 170 }}>
                      <div className="flex h-[34px] items-center justify-center gap-[3px]">
                        {[...Array(22)].map((_, i) => (
                          <span
                            key={i}
                            className="animate-pulse rounded-full"
                            style={{ width: 3, background: W.userText, height: 12 + Math.sin(i) * 10 + (i % 5) * 3, animationDelay: `${i * 0.05}s`, animationDuration: "0.8s" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="relative shrink-0 border-t px-4 py-4" style={{ borderColor: W.divider, background: W.footerBg }}>
                {file && (
                  <div className="relative mb-3 w-fit">
                    {fileKind(file.type) === "image" && file.preview ? (
                      <img src={file.preview} alt="preview" className="h-24 w-24 rounded-lg border object-cover" />
                    ) : fileKind(file.type) === "video" && file.preview ? (
                      <video controls className="w-40 rounded-lg border">
                        <source src={file.preview} type={file.type} />
                      </video>
                    ) : (
                      <div className="flex w-fit items-center gap-3 rounded-lg border bg-gray-50 p-3 text-[#2d2d2d]">
                        <FiFile size={22} style={{ color: W.primary }} />
                        <div>
                          <div className="text-sm font-medium">{file.name}</div>
                          <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={removeFile} aria-label="Remove attachment" className="pointer-events-auto absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow">
                      <FiX className="text-red-500" size={14} />
                    </button>
                  </div>
                )}
                <form
                  data-edit="chatWindow.inputPlaceholder"
                  className="relative flex items-center border-2 px-3 py-2"
                  style={{ borderColor: W.primary, background: inputBg, borderRadius: W.inputRadius, ...(W.inputHeight ? { minHeight: W.inputHeight } : {}) }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendPreview(draft);
                  }}
                >
                  {behavior.attachments && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: "none" }}
                        accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip,application/x-zip-compressed"
                        onChange={handleFile}
                        disabled={recording}
                      />
                      <button type="button" data-edit="behavior.attachments" aria-label="Attach a file" onClick={() => fileInputRef.current?.click()} className="pointer-events-auto mr-2 transition-transform hover:scale-110" style={{ color: W.primary }}>
                        <FiPlus size={18} />
                      </button>
                    </>
                  )}
                  {recording && (
                    <div className="pointer-events-none absolute left-[58px] right-[60px] flex items-center justify-center gap-[3px]">
                      {[...Array(18)].map((_, i) => (
                        <span key={i} className="w-[3px] animate-pulse rounded-full" style={{ background: W.primary, height: 10 + (i % 6) * 5, animationDelay: `${i * 0.08}s` }} />
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={draft}
                    readOnly={recording}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={recording ? uiText(config, "listeningPlaceholder", "Listening...") : chatWindow.inputPlaceholder || sample.placeholder}
                    aria-label="Preview message (not sent anywhere)"
                    className="nfp-input pointer-events-auto min-w-0 flex-1 truncate bg-transparent outline-none"
                    style={{ color: W.dark ? "#f3f4f6" : "#333", opacity: 0.9, ...(W.placeholderColor ? { "--nf-ph": W.placeholderColor } : {}) }}
                  />
                  {behavior.voiceInput && (
                    <button
                      type="button"
                      data-edit="behavior.voiceInput"
                      aria-label={recording ? "Stop recording" : "Start voice input"}
                      onClick={handleMic}
                      disabled={!micSupported || typing}
                      title={micSupported ? undefined : "This browser doesn't support voice input"}
                      className={`pointer-events-auto mr-2 flex h-[35px] w-[35px] items-center justify-center rounded-full transition-all duration-300 ${recording ? "bg-red-600 text-white" : "bg-gray-100"} ${!micSupported || typing ? "cursor-not-allowed opacity-50" : ""}`}
                      style={recording ? undefined : { color: W.primary }}
                    >
                      {recording ? <FiSquare size={13} /> : <FiMic size={15} />}
                    </button>
                  )}
                  <button
                    type="submit"
                    data-edit="chatWindow.sendButtonColor"
                    aria-label="Send preview message"
                    className={`nfp-send ${animClass("nfp", "send", chatWindow.sendAnimation)} pointer-events-auto flex shrink-0 items-center justify-center transition-all hover:scale-105 active:scale-95`}
                    style={{ background: W.sendBg, color: W.sendText, width: W.sendSize, height: W.sendSize, borderRadius: W.sendRadius }}
                  >
                    <FiSend size={15} />
                  </button>
                </form>
                {chatWindow.footerText && <p data-edit="chatWindow.footerText" className="mt-2 text-center opacity-60" style={{ fontSize: W.footerFontSize }}>{chatWindow.footerText}</p>}
                {chatWindow.showBranding && (
                  <p data-edit="chatWindow.brandName" className="mt-3 text-center text-[#9ca3af]" style={{ fontSize: W.footerFontSize }}>
                    Powered by <span className="font-semibold" style={{ color: W.brandColor }}>{brandLine}</span>
                    {W.brandUrl ? <>&nbsp;&nbsp;{W.brandUrl}</> : null}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className={`relative shrink-0 ${L.wholeLauncherFloat ? "nfp-wrap-float" : ""}`} style={{ width: L.pill ? "auto" : L.px, height: L.px }}>
        {showBubble && (
          <div
            key={typingBubbles ? `bubble-${replayKey}-${bubbleIndex}-${launcher.bubbleAnimation}` : `bubble-${teaserIndex}-${replayKey}-${launcher.bubbleAnimation}`}
            data-edit="launcher.teaserMessages"
            className={`pointer-events-auto absolute flex rounded-2xl border border-gray-100 bg-white shadow-lg ${animClass("nfp", "bubble", L.bubbleAnimation)} ${
              typingBubbles ? "items-start gap-1.5 !rounded-xl py-[7px] pl-2 pr-3" : "px-3.5 py-3"
            }`}
            style={{
              bottom: L.px + (typingBubbles ? 17 : 14),
              [isLeft ? "left" : "right"]: 0,
              width: "max-content",
              maxWidth: L.bubbleMaxWidth,
              fontSize: L.bubbleFontPx,
              minWidth: typingBubbles ? 150 : undefined,
              opacity: bubbleStage === "hiding" ? 0 : 1,
              transition: "opacity .3s ease",
            }}
          >
            {typingBubbles && L.bubbleAvatar && L.bubbleAvatarSrc && (
              <img src={L.bubbleAvatarSrc} alt="" className="mt-0.5 h-4 w-4 shrink-0 rounded-full object-cover" />
            )}
            {typingBubbles && bubbleStage === "indicator" ? (
              <div className="nfp-bdots mt-[3px]">
                <i />
                <i />
                <i />
              </div>
            ) : typingBubbles ? (
              <p className="pt-px font-medium leading-snug text-gray-700">{bubbleText}</p>
            ) : (
              <div>
                {bubble.title && <p className="font-semibold text-gray-800">{bubble.title}</p>}
                <p className={bubble.title ? "mt-0.5 text-gray-500" : "text-gray-700"}>{bubble.text}</p>
              </div>
            )}
            {typingBubbles && L.bubbleTail && (
              <span className="pointer-events-none absolute -bottom-[5px] h-[10px] w-[10px] rotate-45 border-b border-r border-gray-200 bg-white" style={{ [isLeft ? "left" : "right"]: 20 }} />
            )}
          </div>
        )}

        {L.wholeLauncherFloat && !open && <span className="nfp-ring" style={{ "--nf-c": L.color }} aria-hidden="true" />}

        <button
          key={`launcher-${replayKey}-${launcher.entrance}`}
          onClick={() => {
            setOpenedBy("manual");
            setOpen((o) => !o);
          }}
          aria-label="Toggle chat preview"
          data-edit="launcher.icon"
          style={{
            "--nf-c": L.color,
            height: L.px,
            width: L.pill ? "auto" : L.px,
            padding: L.pill ? `0 ${Math.round(L.px * 0.4)}px 0 ${Math.round(L.px * 0.3)}px` : 0,
            background: L.background,
            borderRadius: L.radius,
            boxShadow: L.shadow,
          }}
          className={`nfp-hover ${animClass("nfp", "hover", L.hoverEffect)} pointer-events-auto relative flex shrink-0 items-center justify-center gap-2.5 ${animClass("nfp", "in", L.entrance)} ${
            !open && !L.wholeLauncherFloat ? animClass("nfp", "anim", L.animation) : ""
          }`}
        >
          {open ? (
            <FiX className="nfp-icon" style={{ width: Math.round(L.iconPx * 0.9), height: Math.round(L.iconPx * 0.9), color: L.logoOnly ? L.color : L.iconColor }} />
          ) : L.iconKey === "logo" ? (
            <span
              className={`nfp-icon block ${L.wholeLauncherFloat ? "nfp-breathe" : ""}`}
              style={{
                width: L.pill ? L.px * 0.7 : "100%",
                height: L.pill ? L.px * 0.7 : "100%",
                borderRadius: L.pill ? "50%" : "inherit",
                overflow: L.logoOnly ? "visible" : "hidden",
              }}
            >
              <img src={L.logoSrc} alt="" className={`h-full w-full ${L.logoOnly ? "object-contain" : "object-cover"}`} style={{ borderRadius: "inherit" }} />
            </span>
          ) : (
            <LauncherIcon name={L.iconKey} size={L.iconPx} color={L.iconColor} className="nfp-icon" />
          )}

          {!open && L.pill && (
            <span data-edit="launcher.labelText" className="whitespace-nowrap font-semibold" style={{ color: L.labelColor, fontSize: L.labelFontPx }}>
              {L.labelText}
            </span>
          )}

          {!open && showBadge && (
            <span
              data-edit="launcher.badgeColor"
              className={`absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full border-2 border-white font-bold text-white ${L.badgePulse ? "nfp-badge-pulse" : ""}`}
              style={{ background: L.badgeColor, width: L.badgePx, height: L.badgePx, fontSize: Math.max(6, Math.round(L.badgePx * 0.55)) }}
            >
              {L.badgePx >= 14 ? "1" : ""}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
