// Bundled by tests/optionCoverage.test.mjs. Renders the real preview
// renderer for every customization option and reports which options
// (and which individual values) make no visible difference.
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ChatWidgetRenderer from "../../src/components/preview/ChatWidgetRenderer.jsx";
import { DEFAULT_CHATBOT_CONFIG, CONFIG_OPTIONS } from "../../src/config/chatbotConfigDefaults.js";

const clone = (v) => JSON.parse(JSON.stringify(v));
const get = (o, path) => path.split(".").reduce((a, k) => a?.[k], o);
function set(o, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  keys.reduce((a, k) => a[k], o)[last] = value;
}

function leaves(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...leaves(v, path));
    else out.push(path);
  }
  return out;
}

// Some options only show when a related option is on — set that up
// identically for the baseline and the changed render.
const SETUP = {
  "launcher.icon": (c) => { c.launcher.logoUrl = "data:image/png;base64,AAAA"; },
  "launcher.logoUrl": (c) => { c.launcher.icon = "logo"; },
  "launcher.labelText": (c) => { c.launcher.style = "icon-label"; },
  "launcher.labelFontSize": (c) => { c.launcher.style = "icon-label"; },
  "launcher.gradient.from": (c) => { c.launcher.gradient.enabled = true; },
  "launcher.gradient.to": (c) => { c.launcher.gradient.enabled = true; },
  "launcher.teaserMessages": (c) => { c.launcher.showGreeting = false; },
  "chatWindow.headerGradient.from": (c) => { c.chatWindow.headerGradient.enabled = true; },
  "chatWindow.headerGradient.to": (c) => { c.chatWindow.headerGradient.enabled = true; },
  "forms.style": (c) => { c.forms.enabled = true; c.forms.fields = ["name", "email"]; },
  "forms.fields": (c) => { c.forms.enabled = true; },
  "chatWindow.welcomeMessageHindi": (c) => { c.language.defaultLanguage = "Hindi"; },
  "chatWindow.inputPlaceholderHindi": (c) => { c.language.defaultLanguage = "Hindi"; },
  "chatWindow.messageAvatarSize": (c) => { c.chatWindow.showMessageAvatars = true; },
  "chatWindow.messageAvatarHeight": (c) => { c.chatWindow.showMessageAvatars = true; },
  "chatWindow.statusDotColor": (c) => { c.chatWindow.statusStyle = "inline"; },
  "launcher.bubbleAvatar": (c) => { c.launcher.bubbleEffect = "typing"; c.chatWindow.botAvatar = "https://example.test/a.png"; },
  "launcher.bubbleTail": (c) => { c.launcher.bubbleEffect = "typing"; },
  "behavior.autoOpenDelay": (c) => { c.behavior.autoOpen = true; },
  "behavior.autoOpenAnimation": (c) => { c.behavior.autoOpen = true; },
};


// Size options of things that only exist in some states.
for (const key of ["ctaHeight", "ctaWidth", "ctaFontSize", "ctaRadius", "ctaGap"]) {
  SETUP[`chatWindow.${key}`] = (c) => { c.ctas = [{ type: "call", enabled: true, label: "Call us", value: "+10000000" }]; };
}
for (const key of ["fieldHeight", "buttonHeight", "fontSize"]) {
  SETUP[`forms.${key}`] = (c) => { c.forms.enabled = true; c.forms.fields = ["name", "email"]; };
}

for (const key of ["formTitle", "formSubtitle", "formButtonLabel"]) {
  SETUP[`chatWindow.${key}`] = (c) => { c.forms.enabled = true; c.forms.fields = ["name", "email"]; };
}
SETUP["chatWindow.showCtas"] = (c) => { c.ctas = [{ type: "call", enabled: true, label: "Call us", value: "+10000000" }]; };
SETUP["chatWindow.listenLabel"] = (c) => { c.behavior.textToSpeech = true; };
SETUP["chatWindow.offlineMessage"] = (c) => { c.behavior.offlineMode = "offline-message"; };
// The luxe launcher look, the typewriter bubble, the read-aloud link, the paperclip and the header logo tile.
const luxe = (c) => { c.launcher.animation = "luxe"; c.launcher.icon = "logo"; c.launcher.logoUrl = "https://example.test/l.png"; };
SETUP["launcher.effectColor"] = luxe;
SETUP["launcher.sparkleColor"] = luxe;
SETUP["launcher.logoScale"] = luxe;
SETUP["launcher.bubbleLetterSpacing"] = (c) => { c.launcher.bubbleEffect = "typing"; };
SETUP["chatWindow.listenPlacement"] = (c) => { c.behavior.textToSpeech = true; };
SETUP["chatWindow.attachIcon"] = (c) => { c.behavior.attachments = true; };
for (const key of ["ctaTextColor", "ctaIconSize"]) {
  SETUP[`chatWindow.${key}`] = (c) => { c.ctas = [{ type: "call", enabled: true, label: "Call us", value: "+10000000" }]; };
}
for (const key of ["headerLogoWidth", "headerLogoHeight"]) {
  SETUP[`chatWindow.${key}`] = (c) => { c.chatWindow.avatarShape = "rounded"; c.chatWindow.botAvatar = "https://example.test/a.png"; };
}

// Wording/switches that only appear in a state the static preview can't be in
// (a failed send, an offline browser, a scrolled chat, a speaking reply, a
// recording mic, the email request after the third question). The real-widget
// audit (frontend/tests/widgetOptions.test.mjs) puts the widget in each of
// those states and proves every one of these.
const STATE_ONLY = new Set([
  "chatWindow.showScrollButton", "chatWindow.latestLabel", "chatWindow.retryLabel", "chatWindow.errorMessage",
  "chatWindow.noInternetMessage", "chatWindow.stopLabel", "chatWindow.listeningPlaceholder", "chatWindow.emailPrompt", "chatWindow.emailThanks",
  // the typing indicator (after a send) and the greeting bubble's dots (before it types)
  "chatWindow.typingColor1", "chatWindow.typingColor2", "chatWindow.typingColor3", "chatWindow.typingAvatar", "launcher.bubbleDotColor",
]);

const ARRAY_VALUES = {
  "launcher.teaserMessages": ["Need a hand?"],
  "forms.fields": ["phone", "company"],
  "ctas": [{ type: "call", enabled: true, label: "Call us now", value: "+10000000" }],
  "suggestions": ["A custom suggestion"],
};

const SCENARIOS = [
  { mode: "widget" },
  { mode: "window" },
  // the made-up conversation: shows bubbles, avatars, timestamps, Listen buttons
  { mode: "window", sampleChat: true },
  { mode: "widget", isMobile: true },
];

const render = (cfg, sc) =>
  renderToString(createElement(ChatWidgetRenderer, { config: cfg, mode: sc.mode, isMobile: !!sc.isMobile, sampleChat: !!sc.sampleChat }))
    .replace(/data-nf-css-scope="[^"]*"/g, "");

function changed(path, make) {
  return SCENARIOS.some((sc) => {
    const base = clone(DEFAULT_CHATBOT_CONFIG);
    SETUP[path]?.(base);
    const next = clone(base);
    make(next);
    return render(base, sc) !== render(next, sc);
  });
}

export function audit() {
  // customCss is only rendered where the browser supports constructable
  // stylesheets; give the SSR run a minimal stand-in.
  globalThis.CSSRule = { STYLE_RULE: 1, MEDIA_RULE: 4, KEYFRAMES_RULE: 7, SUPPORTS_RULE: 12 };
  globalThis.CSSStyleSheet = class {
    cssRules = [];
    replaceSync(text) {
      this.cssRules = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
        type: 1,
        selectorText: m[1].trim(),
        style: { cssText: m[2].trim() },
      }));
    }
  };

  const failures = [];
  let checked = 0;
  for (const path of leaves(DEFAULT_CHATBOT_CONFIG).concat(["ctas", "suggestions"])) {
    const def = get(DEFAULT_CHATBOT_CONFIG, path);
    const options = CONFIG_OPTIONS[path];
    let values;
    if (options) values = options.filter((v) => v !== def).map((v) => ({ label: v, value: v }));
    else if (path in ARRAY_VALUES) values = [{ label: "[sample]", value: ARRAY_VALUES[path] }];
    else if (def === null) values = [{ label: "77 (size)", value: 77 }];
    else if (typeof def === "boolean") values = [{ label: String(!def), value: !def }];
    else if (typeof def === "number") values = [{ label: String(def + 4), value: def + 4 }];
    else if (typeof def === "string" && /^#[0-9a-f]{6}$/i.test(def)) values = [{ label: "#123456", value: "#123456" }];
    else if (def === "") {
      const isColor = /Color\d?$|Background$/.test(path);
      const isImage = /logoUrl|botAvatar|headerLogo$/.test(path);
      const v = isColor ? "#123456" : isImage ? "https://example.test/x.png" : path === "appearance.customCss" ? ".x{color:red}" : "ZQ-sample";
      values = [{ label: v, value: v }];
    } else if (typeof def === "string") values = [{ label: "ZQ-sample", value: "ZQ-sample" }];
    else values = [];

    if (STATE_ONLY.has(path)) continue;
    for (const { label, value } of values) {
      checked += 1;
      if (!changed(path, (cfg) => set(cfg, path, value))) failures.push(`${path} = ${label}`);
    }
  }
  return { checked, failures };
}
