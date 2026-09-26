// Mirrors backend/config/chatbotConfig.js — kept in sync manually
// since the two apps are separate deployables with no shared
// package. The API is always the source of truth for a saved
// chatbot's config (see CreateChatbotWizard/ChatbotStudio, which
// always initialize from the server response); this constant is
// only used for "Reset to defaults" and as a same-shape fallback
// while the real data is still loading.
export const DEFAULT_CHATBOT_CONFIG = {
  launcher: {
    enabled: true,
    position: "bottom-right",
    shape: "circle",
    color: "#0D5537",
    gradient: { enabled: false, from: "#0D5537", to: "#067647" },
    icon: "default",
    size: "medium",
    animation: "float",
    showGreeting: true,
    greetingTitle: "Hi there \u{1F44B}",
    greetingMessage: "How can we help you today?",
    showNotificationBadge: true,
    showOnMobile: true,
  },
  chatWindow: {
    theme: "light",
    primaryColor: "#0D5537",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    size: "medium",
    borderRadius: "large",
    botName: "",
    companyName: "",
    botAvatar: "",
    showBranding: true,
    welcomeMessage: "Hi! How can we help you today?",
  },
  behavior: {
    autoOpen: false,
    autoOpenDelay: 3,
    sound: true,
    typingIndicator: true,
    offlineMode: "default",
  },
  forms: {
    enabled: false,
    style: "classic",
    fields: [],
  },
  language: {
    defaultLanguage: "English",
  },
  appearance: {
    font: "system",
    customCss: "",
  },
};

export const ALLOWED_FORM_FIELDS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
];
