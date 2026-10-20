import { CONFIG_OPTIONS } from "../../config/chatbotConfigDefaults.js";

// Every number on the landing page is derived from the product itself
// (option lists, plan limits) so the page can't promise more than the
// platform does.
const real = (key, skip) => CONFIG_OPTIONS[key].filter((v) => v !== skip).length;

export const COUNTS = {
  launcherMotions: real("launcher.animation", "none"),
  autoOpenAnimations: real("behavior.autoOpenAnimation", "default"),
  windowAnimations: real("chatWindow.windowAnimation", "none"),
  fonts: CONFIG_OPTIONS["appearance.font"].length,
  icons: CONFIG_OPTIONS["launcher.icon"].length,
};

export const CAPABILITIES = [
  "Image & PDF uploads",
  "Voice input",
  "Read-aloud replies",
  "English & हिन्दी",
  "Pre-chat forms",
  "Human handoff",
  "Telegram",
  "Webhooks",
  "Developer API",
  "Live visitor view",
  `${COUNTS.autoOpenAnimations} auto-open animations`,
  "Knowledge base",
  "Domain allowlist",
  "Email capture",
];

export const STEPS = [
  {
    title: "Pick a template",
    body: "Start from Energy, Education, Digital Marketing or General. Each one ships with the right questions, quick replies and tools for that business.",
  },
  {
    title: "Teach it your business",
    body: "Paste your services, prices and FAQs into the knowledge base. The assistant answers from what you wrote — and asks for a human when it isn't sure.",
  },
  {
    title: "Make it look like you",
    body: "Colours, logo, fonts, sizes, motion, every line of text. The Studio shows each change on the live widget as you make it.",
  },
  {
    title: "Paste one line",
    body: "Copy the snippet into your site. Later edits go live on their own — you never touch the code again.",
  },
];

const photo = (id) => `https://images.unsplash.com/${id}?w=640&q=68&auto=format&fit=crop`;

export const TEMPLATES = [
  {
    key: "energy",
    name: "Energy",
    photo: photo("photo-1497435334941-8c899ee9e8e9"),
    line: "Sizes solar and power systems with a built-in Bill of Materials calculator, then books the site visit.",
    asks: ["What size system do I need?", "Estimate my BOM"],
  },
  {
    key: "education",
    name: "Education",
    photo: photo("photo-1522202176988-66273c2fd55f"),
    line: "Helps students find the right course, answers admission questions and requests a counselling call.",
    asks: ["Which course suits me?", "Admission deadlines"],
  },
  {
    key: "digital_marketing",
    name: "Digital Marketing",
    photo: photo("photo-1460925895917-afdab827c52f"),
    line: "Runs exact ROI, ROAS, CPC, CPM and CTR maths — no guessing — and explains what the numbers mean.",
    asks: ["Calculate my ROAS", "Is my CPC good?"],
  },
  {
    key: "general",
    name: "General",
    photo: photo("photo-1556761175-b413da4baf72"),
    line: "A flexible assistant for any business, answering from your own knowledge base.",
    asks: ["What do you offer?", "Talk to the team"],
  },
];

// Mirrors backend/config/plans.js (tests/landingContent.test.mjs keeps
// them equal). Paid tiers have no decided price yet, so they read
// "Contact sales", exactly like the in-app Plans page.
export const PLANS = [
  { id: "FREE", name: "Free", price: 0, limits: { maxChatbots: 1, maxMembers: 3, maxMonthlyVisitors: 500, maxMonthlyConversations: 200, maxAIRequests: 500 } },
  { id: "STARTER", name: "Starter", price: null, limits: { maxChatbots: 3, maxMembers: 10, maxMonthlyVisitors: 2500, maxMonthlyConversations: 1000, maxAIRequests: 2500 } },
  { id: "GROWTH", name: "Growth", price: null, limits: { maxChatbots: 10, maxMembers: 25, maxMonthlyVisitors: 10000, maxMonthlyConversations: 5000, maxAIRequests: 10000 } },
  { id: "PRO", name: "Pro", price: null, limits: { maxChatbots: 25, maxMembers: 100, maxMonthlyVisitors: 50000, maxMonthlyConversations: 25000, maxAIRequests: 50000 } },
  { id: "ENTERPRISE", name: "Enterprise", price: null, limits: { maxChatbots: Infinity, maxMembers: Infinity, maxMonthlyVisitors: Infinity, maxMonthlyConversations: Infinity, maxAIRequests: Infinity } },
];

export const PLAN_ROWS = [
  ["maxChatbots", "chatbots"],
  ["maxMonthlyConversations", "conversations / month"],
  ["maxMonthlyVisitors", "visitors / month"],
  ["maxAIRequests", "AI replies / month"],
  ["maxMembers", "team members"],
];

export const EVERY_PLAN = ["Knowledge base", "Human handoff", "Bot builder", "Developer API & webhooks", "Advanced analytics", "Telegram channel"];

export const CHANNELS = [
  { key: "website", label: "Website", live: true },
  { key: "telegram", label: "Telegram", live: true },
  { key: "whatsapp", label: "WhatsApp", live: false },
  { key: "instagram", label: "Instagram", live: false },
  { key: "messenger", label: "Messenger", live: false },
];

export const FAQ = [
  {
    q: "Do I need a developer to install it?",
    a: "No. You copy one line of code into your site — or send the install page link to whoever runs your website. Everything you change afterwards updates on its own.",
  },
  {
    q: "Where does the assistant get its answers?",
    a: "From the knowledge base you write: services, prices, policies, FAQs. It runs on fast open AI models, and when a visitor needs a person it hands the chat to your team.",
  },
  {
    q: "Which languages does it speak?",
    a: "English and Hindi, with a language switch inside the chat window. Visitors can also speak instead of typing and have replies read aloud.",
  },
  {
    q: "Can my team reply to visitors themselves?",
    a: "Yes. Every conversation lands in a shared inbox, and Live View shows who is on your site right now. Invite teammates with their own roles and permissions.",
  },
  {
    q: "Is my data kept separate from other companies?",
    a: "Each company is its own workspace. Access is checked on the server for every request, and you can restrict the widget to your own domains.",
  },
  {
    q: "What does the Free plan include?",
    a: "One chatbot, three team members, 200 conversations and 500 AI replies a month, plus every feature — knowledge base, handoff, API and webhooks included.",
  },
];
