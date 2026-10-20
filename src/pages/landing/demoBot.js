import { STARTER_CHATBOT_CONFIG } from "../../config/chatbotStarter.js";
import { THEME_PRESETS } from "../../config/widgetStyle.js";
import { COUNTS } from "./content.js";

const clone = (v) => JSON.parse(JSON.stringify(v));

function merge(base, patch) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && base?.[k] && typeof base[k] === "object" ? merge(base[k], v) : v;
  }
  return out;
}

/**
 * The landing demo is the exact chatbot every new customer starts with
 * (STARTER_CHATBOT_CONFIG), re-voiced as a guide to Nuformly itself.
 */
export const DEMO_CONFIG = merge(clone(STARTER_CHATBOT_CONFIG), {
  launcher: {
    teaserMessages: ["👋 Hi there!", "Want a bot like me?", "I can be yours in an afternoon", "Ask me anything."],
  },
  chatWindow: {
    botName: "Nuformly Assistant",
    subtitle: "Online · Ask me about Nuformly",
    welcomeMessage:
      "👋 Hey! I'm a Nuformly chatbot — the same one your visitors would meet. Ask me how I'm built, what I cost or how I get onto your website.",
  },
  behavior: { askEmail: false, sound: false },
  suggestions: ["How do I install you?", "What does it cost?", "Which templates are there?", "Can a human take over?"],
  ctas: [],
});

/** Theme a copy of the demo with one of the Studio's real presets. */
export function themed(presetId, extra) {
  const preset = THEME_PRESETS.find((p) => p.id === presetId);
  const base = preset ? merge(DEMO_CONFIG, preset.patch) : DEMO_CONFIG;
  return extra ? merge(base, extra) : base;
}

const ANSWERS = [
  [/install|snippet|code|website|embed|add you|paste/, "Copy one line from the Install page into your site — or send that page to your web developer. After that, every change you make goes live on its own."],
  [/cost|price|pricing|plan|free|pay|₹|rupee/, "There's a Free plan: 1 chatbot, 200 conversations and 500 AI replies a month, with every feature included. Bigger plans add more chatbots, visitors and team seats — talk to us for those."],
  [/template|energy|education|marketing|industr|sector/, "Four starting points: Energy (with a sizing calculator), Education, Digital Marketing (exact ROI/ROAS/CPC maths) and General. You can restyle any of them completely."],
  [/human|agent|team|handoff|hand off|person|takeover|take over/, "Yes — conversations land in a shared inbox, and your team can step in whenever a visitor asks for a person."],
  [/language|hindi|english|voice|speak|listen/, "I speak English and Hindi, take voice input, and can read my replies aloud — tap Listen under any message."],
  [/telegram|whatsapp|instagram|messenger|channel/, "Website and Telegram are live today. WhatsApp, Instagram and Messenger are on the way."],
  [/custom|colou?r|logo|font|animation|design|look|brand|style/, `Pretty much everything: colours, logo, fonts, sizes and every line of text — with ${COUNTS.launcherMotions} launcher motions and ${COUNTS.autoOpenAnimations} auto-open animations to choose from.`],
  [/hi\b|hello|hey|namaste/, "Hello! 👋 Ask me about installing, pricing, templates or customising — or just poke around."],
];

/** Scripted, offline answers — the demo never calls the real AI. */
export function demoReply(text) {
  const t = String(text || "").toLowerCase();
  const hit = ANSWERS.find(([re]) => re.test(t));
  return hit ? hit[1] : "Good question! In your own chatbot I'd answer that from your knowledge base. Here I only know about Nuformly — try asking about pricing, templates or installing.";
}
