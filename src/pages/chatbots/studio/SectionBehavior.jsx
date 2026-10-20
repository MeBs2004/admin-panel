import Toggle from "../../../components/ui/Toggle.jsx";
import SegmentedControl from "../../../components/ui/SegmentedControl.jsx";
import OptionTiles from "../../../components/studio/OptionTiles.jsx";
import { CONFIG_OPTIONS } from "../../../config/chatbotConfigDefaults.js";
import { withSamples, windowSample } from "../../../components/studio/AnimSamples.jsx";

// 15 ways for the window to appear on its own, plus "same as a manual open".
const AUTO_OPEN_ANIMATIONS = CONFIG_OPTIONS["behavior.autoOpenAnimation"].map((v) =>
  v === "default"
    ? { value: v, label: "Same as open animation", visual: <span className="text-lg text-gray-400">=</span> }
    : withSamples([v], windowSample, { "slide-up": "Slide up", "slide-down": "Slide down", "slide-left": "Slide left", "slide-right": "Slide right", "flip-y": "Flip side" })[0],
);

const OFFLINE_OPTIONS = [
  { value: "default", label: "Always available" },
  { value: "offline-message", label: "Show offline message" },
];

export default function SectionBehavior({ value, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <Toggle
          label="Auto-open chat window"
          description="Automatically opens the chat window for new visitors."
          checked={value.autoOpen}
          onChange={(v) => onChange("autoOpen", v)}
        />
        {value.autoOpen && (
          <div className="mt-3 max-w-xs">
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Delay</span>
              <span className="text-xs text-gray-400">{value.autoOpenDelay}s</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={value.autoOpenDelay}
              onChange={(e) => onChange("autoOpenDelay", Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>
        )}
        {value.autoOpen && (
          <div className="section-in mt-4">
            <OptionTiles
              label="Auto-open animation"
              hint="How the window appears when it opens by itself. Hover a tile to replay it; the preview re-opens the window as you change this."
              options={AUTO_OPEN_ANIMATIONS}
              value={value.autoOpenAnimation}
              onChange={(v) => onChange("autoOpenAnimation", v)}
              columns={4}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Reflected live in both previews below and on your public widget
          once saved.
        </p>
      </div>

      <hr className="border-gray-100 dark:border-white/5" />

      <Toggle
        label="Sound"
        description="Play a sound when a new message arrives."
        checked={value.sound}
        onChange={(v) => onChange("sound", v)}
      />

      <div data-field="behavior.attachments" className="rounded-xl">
      <Toggle
        label="File attachments"
        description="A + button so visitors can attach images, documents and more."
        checked={value.attachments}
        onChange={(v) => onChange("attachments", v)}
      />
      </div>

      <div data-field="behavior.voiceInput" className="rounded-xl">
      <Toggle
        label="Voice input"
        description="A microphone button to speak instead of typing (where the browser supports it)."
        checked={value.voiceInput}
        onChange={(v) => onChange("voiceInput", v)}
      />
      </div>

      <div data-field="behavior.textToSpeech" className="rounded-xl">
      <Toggle
        label="Read replies aloud"
        description="A Listen button under each bot reply."
        checked={value.textToSpeech}
        onChange={(v) => onChange("textToSpeech", v)}
      />
      </div>

      <Toggle
        label="Ask for email"
        description="After the third question, politely ask the visitor for their email and save it."
        checked={value.askEmail}
        onChange={(v) => onChange("askEmail", v)}
      />

      <Toggle
        label="Message timestamps"
        description="Show the time under each message."
        checked={value.showTimestamps}
        onChange={(v) => onChange("showTimestamps", v)}
      />

      <Toggle
        label="Typing indicator"
        description="Show animated dots while the bot is responding."
        checked={value.typingIndicator}
        onChange={(v) => onChange("typingIndicator", v)}
      />

      <SegmentedControl
        label="When offline"
        options={OFFLINE_OPTIONS}
        value={value.offlineMode}
        onChange={(v) => onChange("offlineMode", v)}
      />
    </div>
  );
}
