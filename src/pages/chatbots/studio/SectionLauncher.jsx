import { useState } from "react";
import { FiImage, FiSliders, FiDroplet, FiZap, FiMessageCircle } from "react-icons/fi";
import Toggle from "../../../components/ui/Toggle.jsx";
import ColorInput from "../../../components/ui/ColorInput.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import Input from "../../../components/ui/Input.jsx";
import FieldGroup, { FieldLabel } from "../../../components/studio/FieldGroup.jsx";
import OptionTiles from "../../../components/studio/OptionTiles.jsx";
import ImageUpload from "../../../components/studio/ImageUpload.jsx";
import LauncherIcon from "../../../components/studio/LauncherIcon.jsx";
import { CONFIG_OPTIONS } from "../../../config/chatbotConfigDefaults.js";
import { withSamples, idleSample, entranceSample, hoverSample, bubbleSample } from "../../../components/studio/AnimSamples.jsx";
import SizeSlider from "../../../components/studio/SizeSlider.jsx";
import Field from "../../../components/studio/Field.jsx";

const POSITION_OPTIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
];
const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const STYLE_OPTIONS = [
  { value: "icon", label: "Icon only" },
  { value: "icon-label", label: "Icon + text" },
];

const ICONS = ["default", "chat", "headset", "bolt", "heart", "help", "robot", "send", "smile", "star"];
const ICON_LABELS = {
  default: "Sparkle", chat: "Chat", headset: "Support", bolt: "Bolt", heart: "Heart",
  help: "Help", robot: "Robot", send: "Send", smile: "Smile", star: "Star",
};

const shapeVisual = (radius) => <span className="block h-7 w-7 bg-gradient-to-br from-emerald-400 to-indigo-500" style={{ borderRadius: radius }} />;
const SHAPE_OPTIONS = [
  { value: "circle", label: "Circle", visual: shapeVisual("50%") },
  { value: "squircle", label: "Squircle", visual: shapeVisual("36%") },
  { value: "rounded-square", label: "Rounded", visual: shapeVisual("24%") },
];

const ANIMATION_OPTIONS = withSamples(CONFIG_OPTIONS["launcher.animation"], idleSample, { "float-ripple": "Float + ripple", luxe: "Luxe" });
const BUBBLE_EFFECT_OPTIONS = [
  { value: "none", label: "Plain", visual: <span className="text-[10px] text-gray-400">Aa</span> },
  { value: "typing", label: "Typewriter", visual: <span className="nfp-bdots"><i /><i /><i /></span> },
];
const BUBBLE_ORDER_OPTIONS = [
  { value: "sequence", label: "In order" },
  { value: "random", label: "Random" },
];
const ENTRANCE_OPTIONS = withSamples(CONFIG_OPTIONS["launcher.entrance"], entranceSample, { "slide-up": "Slide up" });
const HOVER_OPTIONS = withSamples(CONFIG_OPTIONS["launcher.hoverEffect"], hoverSample, { spin: "Spin icon" });
const BUBBLE_ANIMATION_OPTIONS = withSamples(CONFIG_OPTIONS["launcher.bubbleAnimation"], bubbleSample);
const SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "strong", label: "Strong" },
  { value: "glow", label: "Glow" },
];

// Same limits the backend enforces (models/chatbot.model.js).
const MAX_TEASERS = 12;
const MAX_TEASER_LENGTH = 80;

function TeaserMessagesEditor({ value, onChange }) {
  const [text, setText] = useState(() => (value || []).join("\n"));
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const tooMany = lines.length > MAX_TEASERS;
  const tooLong = lines.find((l) => l.length > MAX_TEASER_LENGTH);
  const error = tooMany ? `At most ${MAX_TEASERS} messages.` : tooLong ? `Each message can be at most ${MAX_TEASER_LENGTH} characters.` : "";

  return (
    <div>
      <FieldLabel>Teaser messages</FieldLabel>
      <textarea
        value={text}
        rows={4}
        placeholder={"Need help choosing a plan?\nAsk us anything"}
        onChange={(e) => {
          setText(e.target.value);
          const next = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean);
          // Only a list the backend will accept is passed up to be saved.
          if (next.length <= MAX_TEASERS && next.every((l) => l.length <= MAX_TEASER_LENGTH)) onChange(next);
        }}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-400/30 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-gray-100"
      />
      <p className={`mt-1 text-xs ${error ? "text-danger-600 dark:text-red-300" : "text-gray-400"}`}>
        {error || `One per line, shown in turn above the chat button. Max ${MAX_TEASERS} messages, ${MAX_TEASER_LENGTH} characters each.`}
      </p>
    </div>
  );
}

export default function SectionLauncher({ value, onChange }) {
  const iconOptions = [
    ...ICONS.map((k) => ({
      value: k,
      label: ICON_LABELS[k],
      visual: <LauncherIcon name={k} size={22} className="text-gray-700 transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6 dark:text-gray-200" />,
    })),
    {
      value: "logo",
      label: "Your logo",
      visual: value.logoUrl ? <img src={value.logoUrl} alt="" className="h-7 w-7 rounded-full object-cover" /> : <FiImage className="h-5 w-5 text-gray-500" />,
    },
  ];

  return (
    <div className="space-y-4">
      <Toggle
        label="Launcher enabled"
        description="Turn the chat launcher off to hide the chatbot entirely."
        checked={value.enabled}
        onChange={(v) => onChange("enabled", v)}
      />

      <div className={`space-y-4 transition-opacity duration-300 ${value.enabled ? "" : "pointer-events-none opacity-40"}`}>
        <FieldGroup title="Icon & logo" icon={FiImage} description="Pick a glyph or upload your own logo">
          <Field id="launcher.icon"><OptionTiles label="Launcher icon" options={iconOptions} value={value.icon} onChange={(v) => onChange("icon", v)} columns={4} /></Field>
          {value.icon === "logo" ? (
            <div className="section-in" data-field="launcher.logoUrl">
              <ImageUpload
                label="Launcher logo"
                hint="Shown inside the launcher button. Square images look best."
                value={value.logoUrl}
                onChange={(v) => onChange("logoUrl", v)}
                size={160}
              />
              {!value.logoUrl && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">No logo yet — the launcher uses the bot avatar, or the sparkle icon, until you upload one.</p>}
            </div>
          ) : (
            <ColorInput label="Icon color" value={value.iconColor} onChange={(v) => onChange("iconColor", v)} />
          )}
          {value.icon === "logo" && (
            <Toggle
              label="Logo only"
              description="Draw just the logo — no coloured button behind it."
              checked={value.logoOnly}
              onChange={(v) => onChange("logoOnly", v)}
            />
          )}
        </FieldGroup>

        <FieldGroup title="Shape & size" icon={FiSliders} description="Form factor, label and position">
          <OptionTiles label="Shape" options={SHAPE_OPTIONS} value={value.shape} onChange={(v) => onChange("shape", v)} columns={3} />
          <SegmentedControl label="Size" options={SIZE_OPTIONS} value={value.size} onChange={(v) => onChange("size", v)} />
          <SegmentedControl label="Style" options={STYLE_OPTIONS} value={value.style} onChange={(v) => onChange("style", v)} />
          {value.style === "icon-label" && (
            <div className="section-in" data-field="launcher.labelText">
              <Input label="Button text" value={value.labelText} maxLength={30} placeholder="Chat with us" onChange={(e) => onChange("labelText", e.target.value)} />
            </div>
          )}
          <SegmentedControl label="Position" options={POSITION_OPTIONS} value={value.position} onChange={(v) => onChange("position", v)} />
          <Toggle label="Show on mobile" checked={value.showOnMobile} onChange={(v) => onChange("showOnMobile", v)} />
        </FieldGroup>

        <FieldGroup title="Colors & depth" icon={FiDroplet} description="Fill, gradient, badge and shadow">
          <Toggle label="Use gradient" checked={value.gradient.enabled} onChange={(v) => onChange("gradient", { ...value.gradient, enabled: v })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {value.gradient.enabled ? (
              <>
                <ColorInput label="Gradient start" value={value.gradient.from} onChange={(v) => onChange("gradient", { ...value.gradient, from: v })} />
                <ColorInput label="Gradient end" value={value.gradient.to} onChange={(v) => onChange("gradient", { ...value.gradient, to: v })} />
              </>
            ) : (
              <ColorInput label="Launcher color" value={value.color} onChange={(v) => onChange("color", v)} />
            )}
            <Field id="launcher.badgeColor"><ColorInput label="Badge color" value={value.badgeColor} onChange={(v) => onChange("badgeColor", v)} /></Field>
          </div>
          <OptionTiles label="Shadow" options={SHADOW_OPTIONS} value={value.shadow} onChange={(v) => onChange("shadow", v)} columns={4} />
          <Toggle label="Pulse the badge" description="Gently fade the notification badge in and out." checked={value.badgePulse} onChange={(v) => onChange("badgePulse", v)} />
          <Toggle label="Badge only with the greeting" description="Show the badge only while the greeting bubble is on screen." checked={value.badgeWithBubble} onChange={(v) => onChange("badgeWithBubble", v)} />
        </FieldGroup>

        <FieldGroup title="Motion" icon={FiZap} description="Idle loop, entrance and hover effects">
          <OptionTiles label="Idle animation" hint="Plays continuously to draw attention." options={ANIMATION_OPTIONS} value={value.animation} onChange={(v) => onChange("animation", v)} columns={4} />
          {value.animation === "luxe" && (
            <div className="section-in grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="launcher.effectColor"><ColorInput label="Glow & halo color" allowEmpty value={value.effectColor} onChange={(v) => onChange("effectColor", v)} /></Field>
              <Field id="launcher.sparkleColor"><ColorInput label="Sparkle color" allowEmpty value={value.sparkleColor} onChange={(v) => onChange("sparkleColor", v)} /></Field>
            </div>
          )}
          <OptionTiles label="Entrance" hint="How the button appears. Hover a tile to replay it." options={ENTRANCE_OPTIONS} value={value.entrance} onChange={(v) => onChange("entrance", v)} columns={4} />
          <OptionTiles label="Hover effect" hint="Hover the sample dot to try it." options={HOVER_OPTIONS} value={value.hoverEffect} onChange={(v) => onChange("hoverEffect", v)} columns={4} />
        </FieldGroup>

        <FieldGroup title="Greeting bubble" icon={FiMessageCircle} description="Messages shown above the launcher">
          <Toggle label="Show greeting" checked={value.showGreeting} onChange={(v) => onChange("showGreeting", v)} />
          <OptionTiles label="Bubble animation" hint="How the greeting and teaser bubbles appear." options={BUBBLE_ANIMATION_OPTIONS} value={value.bubbleAnimation} onChange={(v) => onChange("bubbleAnimation", v)} columns={3} />
          <OptionTiles
            label="Bubble style"
            hint="Typewriter shows a typing indicator, types each message, holds it, hides, then repeats."
            options={BUBBLE_EFFECT_OPTIONS}
            value={value.bubbleEffect}
            onChange={(v) => onChange("bubbleEffect", v)}
            columns={2}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id="launcher.bubbleBgColor"><ColorInput label="Bubble background" allowEmpty value={value.bubbleBgColor} onChange={(v) => onChange("bubbleBgColor", v)} /></Field>
            <Field id="launcher.bubbleBorderColor"><ColorInput label="Bubble border" allowEmpty value={value.bubbleBorderColor} onChange={(v) => onChange("bubbleBorderColor", v)} /></Field>
            <Field id="launcher.bubbleTextColor"><ColorInput label="Bubble text" allowEmpty value={value.bubbleTextColor} onChange={(v) => onChange("bubbleTextColor", v)} /></Field>
            {value.bubbleEffect === "typing" && (
              <Field id="launcher.bubbleDotColor"><ColorInput label="Typing dots" allowEmpty value={value.bubbleDotColor} onChange={(v) => onChange("bubbleDotColor", v)} /></Field>
            )}
          </div>
          {value.bubbleEffect === "typing" && (
            <div className="section-in space-y-4">
              <OptionTiles label="Message order" options={BUBBLE_ORDER_OPTIONS} value={value.bubbleOrder} onChange={(v) => onChange("bubbleOrder", v)} columns={2} />
              <Toggle label="Show avatar in bubble" description="The bot's avatar next to the text." checked={value.bubbleAvatar} onChange={(v) => onChange("bubbleAvatar", v)} />
              <Toggle label="Speech-bubble tail" checked={value.bubbleTail} onChange={(v) => onChange("bubbleTail", v)} />
              <SizeSlider label="Show each message for" value={value.bubbleHoldSeconds} min={1} max={15} auto={4} unit="s" onChange={(v) => onChange("bubbleHoldSeconds", v ?? 4)} />
              <SizeSlider label="Pause between messages" value={value.bubblePauseSeconds} min={2} max={60} auto={8} unit="s" onChange={(v) => onChange("bubblePauseSeconds", v ?? 8)} />
            </div>
          )}
          {value.showGreeting && (
            <div className="section-in space-y-4">
              <Input label="Title" value={value.greetingTitle} maxLength={60} onChange={(e) => onChange("greetingTitle", e.target.value)} />
              <Input label="Message" value={value.greetingMessage} maxLength={160} onChange={(e) => onChange("greetingMessage", e.target.value)} />
            </div>
          )}
          <Field id="launcher.teaserMessages"><TeaserMessagesEditor value={value.teaserMessages} onChange={(v) => onChange("teaserMessages", v)} /></Field>
          <Toggle label="Show notification badge" checked={value.showNotificationBadge} onChange={(v) => onChange("showNotificationBadge", v)} />
        </FieldGroup>
      </div>
    </div>
  );
}

