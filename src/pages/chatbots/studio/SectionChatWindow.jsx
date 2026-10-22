import { FiDroplet, FiUser, FiMessageSquare, FiSend, FiMaximize, FiAward } from "react-icons/fi";
import Toggle from "../../../components/ui/Toggle.jsx";
import ColorInput from "../../../components/ui/ColorInput.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import Input from "../../../components/ui/Input.jsx";
import FieldGroup from "../../../components/studio/FieldGroup.jsx";
import OptionTiles from "../../../components/studio/OptionTiles.jsx";
import ImageUpload from "../../../components/studio/ImageUpload.jsx";
import OptionalColor from "../../../components/studio/ColorPair.jsx";
import Field from "../../../components/studio/Field.jsx";
import { CONFIG_OPTIONS } from "../../../config/chatbotConfigDefaults.js";
import { withSamples, messageSample, windowSample, suggestionSample, typingSample, headerSample, avatarSample, sendSample } from "../../../components/studio/AnimSamples.jsx";

const LISTEN_OPTIONS = [
  { value: "inside", label: "Inside the bubble" },
  { value: "below", label: "Small, below the bubble" },
];
const ATTACH_OPTIONS = [
  { value: "plus", label: "Plus" },
  { value: "paperclip", label: "Paperclip" },
];
const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const RADIUS_OPTIONS = [
  { value: "small", label: "Sharp" },
  { value: "medium", label: "Soft" },
  { value: "large", label: "Round" },
];

const bubble = (radius) => (
  <span className="flex w-14 flex-col gap-1">
    <span className="h-3 w-10 bg-gray-300 dark:bg-white/20" style={{ borderRadius: radius.bot }} />
    <span className="ml-auto h-3 w-9 bg-emerald-500" style={{ borderRadius: radius.user }} />
  </span>
);
const BUBBLE_OPTIONS = [
  { value: "classic", label: "Classic", visual: bubble({ bot: "9px 9px 9px 3px", user: "8px 8px 3px 8px" }) },
  { value: "rounded", label: "Chat", visual: bubble({ bot: "9px 9px 9px 2px", user: "9px 9px 2px 9px" }) },
  { value: "soft", label: "Soft", visual: bubble({ bot: "10px", user: "10px" }) },
  { value: "sharp", label: "Sharp", visual: bubble({ bot: "2px", user: "2px" }) },
  { value: "pill", label: "Pill", visual: bubble({ bot: "999px", user: "999px" }) },
];
const AVATAR_SHAPE_OPTIONS = [
  { value: "circle", label: "Circle", visual: <span className="block h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-500" /> },
  { value: "rounded", label: "Rounded square", visual: <span className="block h-7 w-7 rounded-[10px] bg-gradient-to-br from-emerald-400 to-indigo-500" /> },
];
const STATUS_STYLE_OPTIONS = [
  { value: "avatar", label: "Dot on avatar", visual: <span className="relative block h-6 w-6 rounded-full bg-gray-300"><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" /></span> },
  { value: "inline", label: "Beside text", visual: <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /><span className="h-1.5 w-8 rounded-full bg-gray-300" /></span> },
];
const SEND_SHAPE_OPTIONS = [
  { value: "rounded", label: "Rounded", visual: <span className="block h-7 w-7 rounded-[9px] bg-emerald-500" /> },
  { value: "circle", label: "Circle", visual: <span className="block h-7 w-7 rounded-full bg-emerald-500" /> },
];
const AVATAR_ALIGN_OPTIONS = [
  { value: "bottom", label: "Bottom of reply", visual: <span className="flex h-8 items-end gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500" /><span className="h-7 w-8 rounded-lg bg-gray-300" /></span> },
  { value: "top", label: "Top of reply", visual: <span className="flex h-8 items-start gap-1"><span className="h-3 w-3 rounded-full bg-emerald-500" /><span className="h-7 w-8 rounded-lg bg-gray-300" /></span> },
];
const MSG_ANIM_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.messageAnimation"], messageSample, { side: "Side in" });
const WIN_ANIM_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.windowAnimation"], windowSample);
const TYPING_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.typingStyle"], typingSample, { dots: "Dots", wave: "Wave", pulse: "Pulse", bars: "Bars" });
const HEADER_ANIM_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.headerAnimation"], headerSample, { flow: "Color flow" });
const AVATAR_ANIM_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.avatarAnimation"], avatarSample);
const SEND_ANIM_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.sendAnimation"], sendSample, { fly: "Fly" });
const SUGG_ANIM_OPTIONS = withSamples(CONFIG_OPTIONS["chatWindow.suggestionAnimation"], suggestionSample);
const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "strong", label: "Strong" },
];
const bg = (css) => <span className="block h-8 w-12 rounded-md ring-1 ring-black/10" style={css} />;
const BACKGROUND_OPTIONS = [
  { value: "plain", label: "Plain", visual: bg({ background: "#fff" }) },
  { value: "dots", label: "Dots", visual: bg({ background: "#fff", backgroundImage: "radial-gradient(rgba(0,0,0,.25) 1px, transparent 1px)", backgroundSize: "6px 6px" }) },
  { value: "grid", label: "Grid", visual: bg({ background: "#fff", backgroundImage: "linear-gradient(rgba(0,0,0,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.18) 1px, transparent 1px)", backgroundSize: "8px 8px" }) },
  { value: "gradient", label: "Gradient", visual: bg({ background: "linear-gradient(180deg,#fff,#d1fae5)" }) },
];
const chip = (style) => <span className="rounded-full px-2.5 py-1 text-[10px] font-medium" style={style}>Pricing</span>;
const SUGGESTION_OPTIONS = [
  { value: "soft", label: "Soft", visual: chip({ background: "#F3F4F6", color: "#374151" }) },
  { value: "outline", label: "Outline", visual: chip({ border: "1.5px solid #10b981", color: "#059669" }) },
  { value: "filled", label: "Filled", visual: chip({ background: "#10b981", color: "#fff" }) },
];

export default function SectionChatWindow({ value, onChange }) {
  const hg = value.headerGradient;
  return (
    <div className="space-y-4">
      <FieldGroup title="Theme & colors" icon={FiDroplet} description="Mode and base palette">
        <SegmentedControl label="Theme" options={THEME_OPTIONS} value={value.theme} onChange={(v) => onChange("theme", v)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ColorInput label="Primary" value={value.primaryColor} onChange={(v) => onChange("primaryColor", v)} />
          <Field id="chatWindow.backgroundColor"><ColorInput label="Background" value={value.backgroundColor} onChange={(v) => onChange("backgroundColor", v)} /></Field>
          <ColorInput label="Text" value={value.textColor} onChange={(v) => onChange("textColor", v)} />
        </div>
        {value.theme === "dark" && <p className="text-xs text-gray-400">Dark theme uses its own surface colours; the background and text colours above apply to the light theme.</p>}
      </FieldGroup>

      <FieldGroup title="Header & identity" icon={FiUser} description="Name, avatar, subtitle and header colors">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="chatWindow.botName"><Input label="Bot name" placeholder="AI Assistant" value={value.botName} maxLength={60} onChange={(e) => onChange("botName", e.target.value)} /></Field>
          <Input label="Company name" value={value.companyName} maxLength={60} onChange={(e) => onChange("companyName", e.target.value)} />
        </div>
        <Field id="chatWindow.subtitle"><Input label="Subtitle" placeholder="We typically reply instantly" value={value.subtitle} maxLength={60} onChange={(e) => onChange("subtitle", e.target.value)} /></Field>
        <Field id="chatWindow.botAvatar"><ImageUpload label="Bot avatar" hint="Shown in the header, and beside messages when enabled." value={value.botAvatar} onChange={(v) => onChange("botAvatar", v)} size={128} /></Field>
        <Field id="chatWindow.headerLogo"><ImageUpload label="Header logo" hint="Optional — a different image for the header. Leave empty to use the bot avatar." value={value.headerLogo} onChange={(v) => onChange("headerLogo", v)} size={128} /></Field>
        <div className="space-y-4 rounded-xl border border-gray-100 p-3 dark:border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Header elements</p>
          <Field id="chatWindow.showHeaderAvatar"><Toggle label="Show the avatar" checked={value.showHeaderAvatar} onChange={(v) => onChange("showHeaderAvatar", v)} /></Field>
          <Field id="chatWindow.showClearButton"><Toggle label="Show the clear-history button" checked={value.showClearButton} onChange={(v) => onChange("showClearButton", v)} /></Field>
          <Field id="chatWindow.showLanguageSelector"><Toggle label="Show the language selector" checked={value.showLanguageSelector} onChange={(v) => onChange("showLanguageSelector", v)} /></Field>
          <Field id="chatWindow.showCloseButton"><Toggle label="Show the close button" description="Visitors can still close the chat from the launcher." checked={value.showCloseButton} onChange={(v) => onChange("showCloseButton", v)} /></Field>
        </div>
        <OptionTiles label="Avatar shape" options={AVATAR_SHAPE_OPTIONS} value={value.avatarShape} onChange={(v) => onChange("avatarShape", v)} columns={2} />
        <Toggle label="Online status dot" description="Pulsing dot showing the bot is online." checked={value.showStatusDot} onChange={(v) => onChange("showStatusDot", v)} />
        {value.showStatusDot && (
          <div className="section-in space-y-4">
            <OptionTiles label="Status style" options={STATUS_STYLE_OPTIONS} value={value.statusStyle} onChange={(v) => onChange("statusStyle", v)} columns={2} />
            <OptionalColor label="Status dot color" value={value.statusDotColor} onChange={(v) => onChange("statusDotColor", v)} autoHint="Green" />
          </div>
        )}
        <Field id="chatWindow.headerGradient"><Toggle label="Gradient header" checked={hg.enabled} onChange={(v) => onChange("headerGradient", { ...hg, enabled: v })} /></Field>
        {hg.enabled && (
          <div className="section-in grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ColorInput label="Gradient start" value={hg.from} onChange={(v) => onChange("headerGradient", { ...hg, from: v })} />
            <ColorInput label="Gradient end" value={hg.to} onChange={(v) => onChange("headerGradient", { ...hg, to: v })} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorInput label="Header text color" value={value.headerTextColor} onChange={(v) => onChange("headerTextColor", v)} />
          <OptionalColor label="Subtitle color" value={value.headerSubtitleColor} onChange={(v) => onChange("headerSubtitleColor", v)} autoHint="Faded header text" />
        </div>
        <OptionTiles label="Header animation" hint="Shimmer sweeps light across; color flow slowly drifts the gradient." options={HEADER_ANIM_OPTIONS} value={value.headerAnimation} onChange={(v) => onChange("headerAnimation", v)} columns={3} />
        <OptionTiles label="Avatar animation" options={AVATAR_ANIM_OPTIONS} value={value.avatarAnimation} onChange={(v) => onChange("avatarAnimation", v)} columns={4} />
      </FieldGroup>

      <FieldGroup title="Messages" icon={FiMessageSquare} description="Bubble shape, colors and motion">
        <OptionTiles label="Bubble style" options={BUBBLE_OPTIONS} value={value.bubbleStyle} onChange={(v) => onChange("bubbleStyle", v)} columns={4} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="chatWindow.userBubbleColor"><OptionalColor label="Visitor bubble" value={value.userBubbleColor} onChange={(v) => onChange("userBubbleColor", v)} autoHint="Primary color" /></Field>
          <ColorInput label="Visitor text" value={value.userTextColor} onChange={(v) => onChange("userTextColor", v)} />
          <Field id="chatWindow.botBubbleColor"><OptionalColor label="Bot bubble" value={value.botBubbleColor} onChange={(v) => onChange("botBubbleColor", v)} /></Field>
          <OptionalColor label="Bot text" value={value.botTextColor} onChange={(v) => onChange("botTextColor", v)} />
          <OptionalColor label="Bot bubble border" value={value.botBubbleBorderColor} onChange={(v) => onChange("botBubbleBorderColor", v)} autoHint="No border" />
        </div>
        <OptionTiles label="Message animation" hint="Hover a tile to replay it." options={MSG_ANIM_OPTIONS} value={value.messageAnimation} onChange={(v) => onChange("messageAnimation", v)} columns={3} />
        <Field id="chatWindow.typingStyle"><OptionTiles label="Typing indicator style" options={TYPING_OPTIONS} value={value.typingStyle} onChange={(v) => onChange("typingStyle", v)} columns={4} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <OptionalColor label="Typing dot 1" value={value.typingColor1} onChange={(v) => onChange("typingColor1", v)} autoHint="From style" />
          <OptionalColor label="Typing dot 2" value={value.typingColor2} onChange={(v) => onChange("typingColor2", v)} autoHint="From style" />
          <OptionalColor label="Typing dot 3" value={value.typingColor3} onChange={(v) => onChange("typingColor3", v)} autoHint="From style" />
        </div>
        <OptionTiles label="Listen button" hint="Where the read-aloud button sits (when text-to-speech is on)." options={LISTEN_OPTIONS} value={value.listenPlacement} onChange={(v) => onChange("listenPlacement", v)} columns={2} />
        <Toggle label="Avatars beside bot messages" checked={value.showMessageAvatars} onChange={(v) => onChange("showMessageAvatars", v)} />
        {value.showMessageAvatars && (
          <div className="section-in">
            <OptionTiles label="Avatar position" options={AVATAR_ALIGN_OPTIONS} value={value.avatarAlign} onChange={(v) => onChange("avatarAlign", v)} columns={2} />
            <Toggle label="Avatar beside the typing indicator" checked={value.typingAvatar} onChange={(v) => onChange("typingAvatar", v)} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OptionalColor label="Welcome card color" value={value.welcomeBgColor} onChange={(v) => onChange("welcomeBgColor", v)} autoHint="Same as bot bubble" />
          <OptionalColor label="Welcome card border" value={value.welcomeBorderColor} onChange={(v) => onChange("welcomeBorderColor", v)} autoHint="Bot bubble border" />
          <Field id="chatWindow.ctaTextColor"><OptionalColor label="CTA button text" value={value.ctaTextColor} onChange={(v) => onChange("ctaTextColor", v)} autoHint="Readable on each button" /></Field>
        </div>
        <OptionTiles label="Suggestion chips" options={SUGGESTION_OPTIONS} value={value.suggestionStyle} onChange={(v) => onChange("suggestionStyle", v)} columns={3} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <OptionalColor label="Chip background" value={value.suggestionBgColor} onChange={(v) => onChange("suggestionBgColor", v)} autoHint="From chip style" />
          <OptionalColor label="Chip text" value={value.suggestionTextColor} onChange={(v) => onChange("suggestionTextColor", v)} autoHint="From chip style" />
          <OptionalColor label="Chip border" value={value.suggestionBorderColor} onChange={(v) => onChange("suggestionBorderColor", v)} autoHint="From chip style" />
        </div>
        <OptionTiles label="Suggestion animation" options={SUGG_ANIM_OPTIONS} value={value.suggestionAnimation} onChange={(v) => onChange("suggestionAnimation", v)} columns={3} />
      </FieldGroup>

      <FieldGroup title="Input & send button" icon={FiSend} description="Placeholder text and button color" defaultOpen={false}>
        <Field id="chatWindow.inputPlaceholder"><Input label="Input placeholder" value={value.inputPlaceholder} maxLength={80} placeholder="Type a message..." onChange={(e) => onChange("inputPlaceholder", e.target.value)} /></Field>
        <Field id="chatWindow.inputPlaceholderHindi"><Input label="Input placeholder (Hindi)" value={value.inputPlaceholderHindi} maxLength={80} placeholder="Leave empty to use the one above" onChange={(e) => onChange("inputPlaceholderHindi", e.target.value)} /></Field>
        <Field id="chatWindow.sendButtonColor"><OptionalColor label="Send button" value={value.sendButtonColor} onChange={(v) => onChange("sendButtonColor", v)} autoHint="Primary color" /></Field>
        <OptionTiles label="Send button shape" options={SEND_SHAPE_OPTIONS} value={value.sendButtonShape} onChange={(v) => onChange("sendButtonShape", v)} columns={2} />
        <OptionTiles label="Attach button icon" hint="When file attachments are on." options={ATTACH_OPTIONS} value={value.attachIcon} onChange={(v) => onChange("attachIcon", v)} columns={2} />
        <OptionalColor label="Input area background" value={value.footerBackground} onChange={(v) => onChange("footerBackground", v)} autoHint="Same as window" />
        <OptionalColor label="Placeholder text color" value={value.placeholderColor} onChange={(v) => onChange("placeholderColor", v)} autoHint="Light gray" />
        <OptionTiles label="Send button hover" hint="Hover the sample button to try it." options={SEND_ANIM_OPTIONS} value={value.sendAnimation} onChange={(v) => onChange("sendAnimation", v)} columns={4} />
      </FieldGroup>

      <FieldGroup title="Layout & motion" icon={FiMaximize} description="Size, corners, shadow, background and open animation" defaultOpen={false}>
        <SegmentedControl label="Window size" options={SIZE_OPTIONS} value={value.size} onChange={(v) => onChange("size", v)} />
        <SegmentedControl label="Corner radius" options={RADIUS_OPTIONS} value={value.borderRadius} onChange={(v) => onChange("borderRadius", v)} />
        <OptionTiles label="Shadow" options={SHADOW_OPTIONS} value={value.shadow} onChange={(v) => onChange("shadow", v)} columns={3} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <OptionalColor label="Window border" value={value.borderColor} onChange={(v) => onChange("borderColor", v)} autoHint="Light gray" />
          <OptionalColor label="Input divider line" value={value.dividerColor} onChange={(v) => onChange("dividerColor", v)} autoHint="Same as window border" />
        </div>
        <OptionTiles label="Chat background" options={BACKGROUND_OPTIONS} value={value.chatBackground} onChange={(v) => onChange("chatBackground", v)} columns={4} />
        <OptionTiles label="Open animation" hint="Hover a tile to replay it, or press Replay above the preview." options={WIN_ANIM_OPTIONS} value={value.windowAnimation} onChange={(v) => onChange("windowAnimation", v)} columns={4} />
      </FieldGroup>

      <FieldGroup title="Footer & branding" icon={FiAward} description="Footer text and attribution" defaultOpen={false}>
        <Field id="chatWindow.footerText"><Input label="Footer text" placeholder="Replies may take a moment" value={value.footerText} maxLength={80} onChange={(e) => onChange("footerText", e.target.value)} /></Field>
        <Toggle label="Show “Powered by” line" checked={value.showBranding} onChange={(v) => onChange("showBranding", v)} />
        {value.showBranding && (
          <div className="section-in grid grid-cols-1 gap-4 sm:grid-cols-2" data-field="chatWindow.brandName">
            <Input label="Brand name" value={value.brandName} maxLength={40} placeholder="Nuformly" onChange={(e) => onChange("brandName", e.target.value)} />
            <Input label="Website (optional)" value={value.brandUrl} maxLength={60} placeholder="yourcompany.com" onChange={(e) => onChange("brandUrl", e.target.value)} />
            <OptionalColor label="Brand color" value={value.brandColor} onChange={(v) => onChange("brandColor", v)} autoHint="Primary color" />
          </div>
        )}
      </FieldGroup>
    </div>
  );
}
