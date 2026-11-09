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
// the ids, prices and limits equal). Real, decided prices — Starter is
// genuinely free forever; Growth/Enterprise are real self-reported
// prices (no payment provider collects them yet — a company only
// reaches a paid plan via a SUPER_ADMIN grant, see billing.controller.js).
export const PLANS = [
  {
    id: "FREE",
    name: "Starter",
    badge: "Free forever",
    price: 0,
    priceNote: "forever",
    limits: { maxChatbots: 1, maxMembers: 3, maxMonthlyVisitors: 500, maxMonthlyConversations: 200, maxAIRequests: 500 },
    items: [
      { title: "1 Chatbot", sub: "Live on your website" },
      { title: "200 Conversations", sub: "per month" },
      { title: "500 Visitors", sub: "per month" },
      { title: "500 AI Replies", sub: "per month" },
      { title: "3 Team Members", sub: "seats included" },
      { title: "AI Knowledge Base", sub: "Upload docs & FAQs" },
      { title: "Conversations Inbox", sub: "Manage & reply to chats" },
      { title: "Website Widget", sub: "1-line embed code" },
    ],
    cta: "Start free",
  },
  {
    id: "GROWTH",
    name: "Growth",
    badge: "Most popular",
    price: 2499,
    priceNote: "per month",
    limits: { maxChatbots: 5, maxMembers: 15, maxMonthlyVisitors: 10000, maxMonthlyConversations: 2500, maxAIRequests: 5000 },
    items: [
      { title: "5 Chatbots", sub: "Multi-site & multi-purpose" },
      { title: "2,500 Conversations", sub: "per month" },
      { title: "10,000 Visitors", sub: "per month" },
      { title: "5,000 AI Replies", sub: "per month" },
      { title: "15 Team Members", sub: "seats included" },
      { title: "Bot Builder", sub: "Visual conversation flows" },
      { title: "Live View", sub: "See live visitors on site" },
      { title: "Analytics & Reports", sub: "Visitor & conversation stats" },
    ],
    cta: "Get started",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    badge: "Custom scale",
    price: 7999,
    priceNote: "per month",
    limits: { maxChatbots: Infinity, maxMembers: Infinity, maxMonthlyVisitors: Infinity, maxMonthlyConversations: Infinity, maxAIRequests: Infinity },
    items: [
      { title: "Unlimited Chatbots", sub: "No limits" },
      { title: "25,000+ Conversations", sub: "Custom high volume" },
      { title: "Unlimited Visitors", sub: "No visitor capping" },
      { title: "50,000+ AI Replies", sub: "Tailored packs" },
      { title: "Unlimited Members", sub: "Entire organization" },
      { title: "Chatbot Access", sub: "Assign bots to team members" },
      { title: "Roles & Permissions", sub: "Admin, Agent & team access" },
      { title: "Audit Logs & Tasks", sub: "Full activity tracking" },
    ],
    cta: "Get started",
  },
];

export const PLAN_ROWS = [
  ["maxChatbots", "chatbots"],
  ["maxMonthlyConversations", "conversations / month"],
  ["maxMonthlyVisitors", "visitors / month"],
  ["maxAIRequests", "AI replies / month"],
  ["maxMembers", "team members"],
];

// "Every plan" copy is deliberately short now — bot builder, live
// view and advanced analytics moved to being Growth+/Enterprise-only
// features (see each plan's own `items` above), not something every
// tier includes.
export const EVERY_PLAN = ["Knowledge base", "Human handoff", "Website widget", "Telegram channel"];

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
    q: "What does the Starter plan include?",
    a: "One chatbot, three team members, 200 conversations and 500 AI replies a month, forever free — plus a knowledge base, a shared conversations inbox and the website widget. Bot Builder, Live View and Analytics come with Growth and above.",
  },
];
