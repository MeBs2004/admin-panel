// "Click to edit": each element in the live preview is marked with the id of
// the setting that controls it (data-edit="chatWindow.botName"). This maps
// such an id to the Studio section that holds that setting.

// Built-in wording the admin can change — these live in the Texts & labels section.
export const LABEL_FIELDS = new Set([
  "listenLabel", "stopLabel", "retryLabel", "latestLabel", "errorMessage", "offlineMessage",
  "emailPrompt", "emailThanks", "noInternetMessage", "listeningPlaceholder",
  "formTitle", "formSubtitle", "formButtonLabel", "showScrollButton",
]);

export function sectionForField(id = "") {
  const [head, field] = id.split(".");
  if (["launcher", "ctas", "suggestions", "behavior", "forms", "language", "appearance"].includes(head)) return head;
  if (head === "chatWindow") {
    if (field === "welcomeMessage" || field === "welcomeMessageHindi" || field === "showWelcome") return "welcome";
    if (LABEL_FIELDS.has(field)) return "labels";
    return "chatWindow";
  }
  return "chatWindow";
}

// What each marked preview element is called, for the tooltip in edit mode.
export const EDIT_LABELS = {
  "chatWindow.botName": "Bot name",
  "chatWindow.subtitle": "Subtitle",
  "chatWindow.botAvatar": "Avatar",
  "chatWindow.headerGradient": "Header",
  "chatWindow.backgroundColor": "Window",
  "chatWindow.welcomeMessage": "Welcome message",
  "chatWindow.userBubbleColor": "Visitor message",
  "chatWindow.botBubbleColor": "Bot message",
  "chatWindow.inputPlaceholder": "Message box",
  "chatWindow.sendButtonColor": "Send button",
  "chatWindow.brandName": "Powered-by line",
  "chatWindow.footerText": "Footer text",
  "chatWindow.typingStyle": "Typing indicator",
  "chatWindow.showClearButton": "Clear-history button",
  "chatWindow.showLanguageSelector": "Language selector",
  "chatWindow.showCloseButton": "Close button",
  "chatWindow.offlineMessage": "Offline notice",
  "behavior.attachments": "Attach button",
  "behavior.voiceInput": "Microphone",
  "behavior.textToSpeech": "Listen button",
  "forms.fields": "Pre-chat form",
  suggestions: "Suggestion chips",
  "launcher.icon": "Launcher button",
  "launcher.labelText": "Launcher text",
  "launcher.badgeColor": "Notification badge",
  "launcher.teaserMessages": "Greeting bubble",
};
