import nuformLogo from "../../assets/brands/nuform-logo.png";
import nuformLogo1 from "../../assets/brands/nuform-logo1.png";
import oyaLogo from "../../assets/brands/oya-logo.png";
import oyaLogo1 from "../../assets/brands/oya-logo1.png";

// Real Chatbot UI Preview — single source of "what does this brand
// actually look like by default." Values here are copied from the real
// production components (frontend/src/component/Bot.jsx and OyaBot.jsx),
// not invented. `DEFAULT_CHATBOT_CONFIG` (chatbotConfigDefaults.js) is a
// GENERIC schema default shared by every chatbot regardless of brand —
// it is not brand-accurate (e.g. it uses Nuform Social's green for every
// new chatbot, including OYA's). This module exists so the preview can
// tell "the admin explicitly configured this" apart from "this field is
// still on the generic schema default," and in the latter case fall
// back to the brand's real default instead of the generic one.
//
// companyId is the key — matches Company.companyId exactly as sent in
// the `x-company-id` header / stored on the Company document.
export const BRAND_WIDGET_DEFAULTS = {
  "nuform-social": {
    logo: nuformLogo,
    logo1: nuformLogo1,
    launcher: {
      color: "#067647",
      gradientFrom: "#0d5537",
      gradientTo: "#067647",
    },
    chatWindow: {
      primaryColor: "#067647",
      backgroundColor: "#f7f7f7",
      textColor: "#333333",
      botName: "Nuform Social Assistant",
      companyName: "",
      botAvatar: "",
      welcomeMessage: {
        English:
          "👋 Hey! I'm the Nuform Social Assistant. Whether you're looking to grow your brand, build a website, or run high-ROI campaigns — I'm here to help. What brings you here today?",
        Hindi:
          "👋 नमस्ते! मैं Nuform Social Assistant हूँ। चाहे आप अपना ब्रांड बढ़ाना चाहते हों, वेबसाइट बनवाना चाहते हों या उच्च-ROI कैंपेन चलाना चाहते हों — मैं आपकी सहायता के लिए यहाँ हूँ। आज आप किस उद्देश्य से आए हैं?",
      },
    },
    suggestions: [
      "What services do you offer?",
      "Tell me about SEO",
      "Website development details",
      "Get a quick audit",
    ],
    sampleReplies: [
      "We provide digital marketing, SEO, website development, branding, social media marketing and AI automation solutions.",
      "Great question! Our team can walk you through the details — want me to connect you?",
      "Here's a quick overview — let me know if you'd like more detail on anything.",
    ],
    footerBrand: "Nuform Social",
    footerDomain: "nuformsocial.com",
    footerAccent: "#e36b0a",
    // Phase 22 — dark theme tokens. Only used when chatWindow.theme is
    // "dark" AND the admin hasn't explicitly customized the relevant
    // field (see withBrandFallback precedence in NuformSocialWidgetPreview.jsx).
    dark: {
      chatWindow: { primaryColor: "#16a34a", backgroundColor: "#161b18", textColor: "#e9f3ec" },
      header: { gradientFrom: "#0b3324" },
      welcomeBg: "#1c2620",
      welcomeBorder: "#2c3a30",
      bubbleBg: "#212925",
      bubbleBorder: "#2c352f",
      inputBg: "#1d221f",
      inputBorder: "#333b35",
      dividerColor: "#2a322c",
      iconColor: "#9fb0a4",
      placeholderClass: "placeholder:text-[#7c8a80]",
    },
  },

  "oya-gemkara": {
    logo: oyaLogo,
    logo1: oyaLogo1,
    launcher: {
      color: "#5E0F28",
      gradientFrom: "#5E0F28",
      gradientTo: "#8C2346",
    },
    chatWindow: {
      primaryColor: "#5E0F28",
      backgroundColor: "#ffffff",
      textColor: "#333333",
      botName: "OYA Assistant",
      companyName: "OYA by Gemkara",
      botAvatar: "",
      welcomeMessage: {
        English:
          "👋 Welcome to OYA by Gemkara. I'm OYA, your luxury jewellery assistant. I can help you with: • Natural Gemstones • Premium Jewellery • Personalized Recommendations • Book Appointments • Customer Support. How may I assist you today?",
        Hindi:
          "👋 नमस्ते! मैं OYA हूँ। OYA by Gemkara में आपका स्वागत है। मैं आपकी सहायता कर सकती हूँ: • प्राकृतिक रत्न • प्रीमियम ज्वेलरी • व्यक्तिगत सुझाव • अपॉइंटमेंट बुकिंग • ऑर्डर सहायता। आज मैं आपकी किस प्रकार सहायता कर सकती हूँ?",
      },
    },
    suggestions: [
      "Natural Gemstones",
      "Premium Jewellery",
      "Personalized Reco",
      "Book Appointment",
    ],
    sampleReplies: [
      "We'd love to help you find the perfect piece — natural gemstones, premium jewellery, or a personalized recommendation.",
      "I can help you book an appointment with our jewellery consultants — would you like me to set that up?",
      "Here's a quick overview of our collection — let me know what catches your eye.",
    ],
    footerBrand: "Nuform Social",
    footerDomain: "nuformsocial.com",
    footerAccent: "#5E0F28",
    dark: {
      chatWindow: { primaryColor: "#8C2346", backgroundColor: "#1b1214", textColor: "#f3e6e0" },
      header: { gradientTo: "#3d0d1e" },
      welcomeBg: "#241619",
      welcomeBorder: "#3a2226",
      bubbleBg: "#271a1d",
      bubbleBorder: "#3a2226",
      inputBg: "#221619",
      inputBorder: "#3a2226",
      dividerColor: "#332023",
      iconColor: "#c9a0a8",
      placeholderClass: "placeholder:text-[#8a6d70]",
    },
  },
};

export function getBrandWidgetDefaults(companyId) {
  return BRAND_WIDGET_DEFAULTS[companyId] || null;
}

// Config precedence (documented, single rule, used by every brand
// preview): Chatbot.config wins whenever the admin has actually changed
// a field away from the generic schema default; otherwise fall back to
// the brand's real production default rather than the generic one.
// This is what section 14 of the task requires: a never-customized OYA
// chatbot must still preview as OYA, not as whatever the shared schema
// default happens to be (today, that default is literally Nuform
// Social's green — see DEFAULT_CHATBOT_CONFIG).
export function withBrandFallback(configValue, genericDefault, brandValue) {
  if (configValue === undefined || configValue === null) return brandValue;
  if (configValue === genericDefault) return brandValue;
  return configValue;
}

// Phase 22 — theme (chatWindow.theme: "light"|"dark") precedence rule:
// an explicit, admin-customized color ALWAYS wins over theme, exactly
// like the brand-fallback rule above (theme is just another kind of
// "brandValue" — the caller picks BRAND.dark.chatWindow.* instead of
// BRAND.chatWindow.* as the `brandValue` argument to withBrandFallback
// when chatWindow.theme === "dark"). Only when a color field is still
// on the generic schema default does theme get to choose which of the
// two brand-accurate palettes (light/dark) is shown. Non-configurable
// surfaces that have no admin color control at all (transcript/bubble/
// input backgrounds, dividers, icon tint) are driven purely by theme,
// since there is no field for them to be "customized away from."
