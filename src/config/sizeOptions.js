// Every size control in the Studio, grouped by where it appears. `auto`
// is the built-in size (used to place the slider while the option is
// "Auto"); ranges come from SIZE_RANGES in widgetStyle.js.
export const SIZE_GROUPS = {
  launcher: {
    title: "Sizes",
    description: "Button, icon, label and greeting bubble",
    items: [
      { path: "launcher.customSize", label: "Button size", auto: 60, hint: "Overrides Small / Medium / Large" },
      { path: "launcher.iconSize", label: "Icon size", auto: 27 },
      { path: "launcher.labelFontSize", label: "Button text size", auto: 14, hint: "When the launcher shows text" },
      { path: "launcher.bubbleMaxWidth", label: "Greeting bubble width", auto: 220 },
      { path: "launcher.bubbleFontSize", label: "Greeting text size", auto: 13 },
      { path: "launcher.badgeSize", label: "Notification badge size", auto: 14 },
      { path: "launcher.logoScale", label: "Logo zoom", auto: 100, unit: "%", hint: "Luxe launcher: how much the logo fills the circle" },
      { path: "launcher.bubbleOffset", label: "Greeting bubble distance", auto: 17, hint: "Space between the bubble and the button" },
      { path: "launcher.bubbleLetterSpacing", label: "Greeting letter spacing", auto: 0, step: 0.1 },
    ],
  },
  window: {
    title: "Window size",
    description: "Width, height and corner radius",
    items: [
      { path: "chatWindow.customWidth", label: "Width", auto: 365, hint: "Overrides Small / Medium / Large" },
      { path: "chatWindow.customHeight", label: "Height", auto: 548, hint: "Auto is 1.5× the width" },
      { path: "chatWindow.customRadius", label: "Corner radius", auto: 28, hint: "Overrides Sharp / Soft / Round" },
    ],
  },
  header: {
    title: "Header sizes",
    description: "Header height, avatar and text",
    items: [
      { path: "chatWindow.headerHeight", label: "Header height", auto: 64 },
      { path: "chatWindow.avatarSize", label: "Avatar size", auto: 36 },
      { path: "chatWindow.headerTitleSize", label: "Name text size", auto: 14 },
      { path: "chatWindow.headerSubtitleSize", label: "Subtitle text size", auto: 11 },
      { path: "chatWindow.headerLogoWidth", label: "Logo width (in tile)", auto: 31, hint: "When the avatar sits in a rounded tile" },
      { path: "chatWindow.headerLogoHeight", label: "Logo height (in tile)", auto: 31 },
      { path: "chatWindow.headerButtonAlpha", label: "Header button shade", auto: 20, unit: "%", hint: "How light the round header buttons are" },
      { path: "chatWindow.closeIconSize", label: "Close icon size", auto: 12 },
    ],
  },
  messages: {
    title: "Message sizes & spacing",
    description: "Bubbles, spacing and the typing indicator",
    items: [
      { path: "chatWindow.bubbleMaxWidthPct", label: "Bubble max width", auto: 82, unit: "%" },
      { path: "chatWindow.bubblePaddingX", label: "Bubble padding (sides)", auto: 14 },
      { path: "chatWindow.bubblePaddingY", label: "Bubble padding (top/bottom)", auto: 10 },
      { path: "chatWindow.messageGap", label: "Space between messages", auto: 12 },
      { path: "chatWindow.contentPadding", label: "Chat area padding", auto: 16 },
      { path: "chatWindow.typingDotSize", label: "Typing dot size", auto: 7 },
      { path: "chatWindow.lineHeight", label: "Line height", auto: 22, hint: "Auto is 1.6× the text size" },
      { path: "chatWindow.paragraphGap", label: "Space between paragraphs", auto: 8, hint: "Auto also leaves space under the last one" },
      { path: "chatWindow.messageAvatarSize", label: "Avatar beside messages", auto: 26 },
      { path: "chatWindow.messageAvatarHeight", label: "Avatar height", auto: 26, hint: "Auto matches the avatar width" },
    ],
  },
  input: {
    title: "Input & footer sizes",
    description: "Message box, send button and footer text",
    items: [
      { path: "chatWindow.inputHeight", label: "Input box height", auto: 48 },
      { path: "chatWindow.sendButtonSize", label: "Send button size", auto: 34 },
      { path: "chatWindow.inputRadius", label: "Input box corner radius", auto: 16 },
      { path: "chatWindow.inputPaddingX", label: "Input padding (sides)", auto: 12 },
      { path: "chatWindow.inputPaddingY", label: "Input padding (top/bottom)", auto: 8 },
      { path: "chatWindow.sendButtonRadius", label: "Send button corner radius", auto: 12 },
      { path: "chatWindow.sendIconSize", label: "Send icon size", auto: 15 },
      { path: "chatWindow.footerFontSize", label: "Footer text size", auto: 10.5, step: 0.5 },
    ],
  },
  welcome: {
    title: "Welcome message size",
    description: "Text size of the first message",
    items: [
      { path: "chatWindow.welcomeFontSize", label: "Welcome text size", auto: 13.5, step: 0.5 },
      { path: "chatWindow.welcomeMaxWidthPct", label: "Welcome card width", auto: 82, unit: "%", hint: "100% spans the whole chat" },
      { path: "chatWindow.welcomeLineHeight", label: "Welcome line height", auto: 23, hint: "Auto is 1.7× the text size" },
      { path: "chatWindow.sectionGap", label: "Space after welcome & buttons", auto: 12, hint: "Auto matches the message spacing" },
    ],
  },
  cta: {
    title: "Button size",
    description: "Size and shape of the CTA buttons",
    items: [
      { path: "chatWindow.ctaHeight", label: "Button height", auto: 36 },
      { path: "chatWindow.ctaWidth", label: "Button width", auto: 150, hint: "Auto shares the row equally" },
      { path: "chatWindow.ctaFontSize", label: "Text size", auto: 12 },
      { path: "chatWindow.ctaRadius", label: "Corner radius", auto: 18, hint: "Auto is fully round" },
      { path: "chatWindow.ctaGap", label: "Space between buttons", auto: 8 },
      { path: "chatWindow.ctaIconSize", label: "Icon size", auto: 12, hint: "Auto matches the text size" },
    ],
  },
  suggestions: {
    title: "Chip size",
    description: "Width, height and spacing of the suggestion chips",
    items: [
      { path: "chatWindow.suggestionHeight", label: "Chip height", auto: 30 },
      { path: "chatWindow.suggestionWidth", label: "Chip width", auto: 150, hint: "Auto fills two columns" },
      { path: "chatWindow.suggestionFontSize", label: "Text size", auto: 11 },
      { path: "chatWindow.suggestionPaddingX", label: "Padding (sides)", auto: 12 },
      { path: "chatWindow.suggestionGap", label: "Space between chips", auto: 8 },
    ],
  },
  forms: {
    title: "Form sizes",
    description: "Pre-chat form fields and button",
    items: [
      { path: "forms.fieldHeight", label: "Field height", auto: 38 },
      { path: "forms.buttonHeight", label: "Button height", auto: 36 },
      { path: "forms.fontSize", label: "Text size", auto: 13 },
    ],
  },
  type: {
    title: "Text size",
    description: "Exact base text size for the whole chat",
    items: [{ path: "appearance.fontSizePx", label: "Base text size", auto: 13.5, step: 0.5, hint: "Overrides Small / Medium / Large" }],
  },
};
