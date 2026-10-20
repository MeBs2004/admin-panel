import { FiType, FiMessageSquare, FiMail, FiClipboard, FiMic, FiRotateCcw } from "react-icons/fi";
import Input from "../../../components/ui/Input.jsx";
import Toggle from "../../../components/ui/Toggle.jsx";
import FieldGroup from "../../../components/studio/FieldGroup.jsx";
import Field from "../../../components/studio/Field.jsx";

// Every built-in word the chat shows. Empty = the built-in wording, so an admin
// only fills in what they want to change. Each one is a real, saved setting.
const GROUPS = [
  {
    title: "Voice & reading",
    icon: FiMic,
    description: "Listen / Stop buttons and the microphone",
    items: [
      { key: "listenLabel", label: "Listen button", builtIn: "Listen" },
      { key: "stopLabel", label: "Stop button", builtIn: "Stop" },
      { key: "listeningPlaceholder", label: "While recording", builtIn: "Listening..." },
    ],
  },
  {
    title: "Messages & notices",
    icon: FiMessageSquare,
    description: "Errors, offline notice and the scroll shortcut",
    items: [
      { key: "errorMessage", label: "When a message fails", builtIn: "Server error. Please try again." },
      { key: "retryLabel", label: "Retry button", builtIn: "Retry" },
      { key: "offlineMessage", label: "Offline notice", builtIn: "We're currently offline. Leave a message and we'll get back to you as soon as we're back.", long: true, hint: "Shown when “When offline” is set to Show offline message" },
      { key: "noInternetMessage", label: "No internet banner", builtIn: "No internet connection — messages won't send." },
    ],
  },
  {
    title: "Email request",
    icon: FiMail,
    description: "The prompt after the third question and its thank-you",
    items: [
      { key: "emailPrompt", label: "Email request", builtIn: "📧 Before we continue, could you please share your email address so our team can assist you better?", long: true, hint: "Used when “Ask for email” is on (Behavior)" },
      { key: "emailThanks", label: "Thank-you after they reply", builtIn: "✅ Thank you! We've saved your email address. How else can we help you today?", long: true },
    ],
  },
  {
    title: "Pre-chat form",
    icon: FiClipboard,
    description: "Title, text and button of the form",
    items: [
      { key: "formTitle", label: "Form title", builtIn: "Before we start" },
      { key: "formSubtitle", label: "Form subtitle", builtIn: "A few details so we can help you faster." },
      { key: "formButtonLabel", label: "Form button", builtIn: "Start Chat" },
    ],
  },
];

const MAX = { errorMessage: 160, offlineMessage: 240, emailPrompt: 240, emailThanks: 240, noInternetMessage: 120, formSubtitle: 160, formTitle: 80, listeningPlaceholder: 60, formButtonLabel: 40 };

export default function SectionLabels({ value, onChange }) {
  const anySet = GROUPS.some((g) => g.items.some((it) => (value[it.key] || "").trim()));
  const resetAll = () => GROUPS.forEach((g) => g.items.forEach((it) => onChange(it.key, "")));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Texts &amp; labels</h3>
        <p className="mt-1 text-xs text-gray-400">
          Change the wording of anything the chat says on its own. Leave a box empty to keep the built-in text — the faint text shows what it is now.
        </p>
      </div>

      <FieldGroup title="“Latest” shortcut" icon={FiType} description="The button that jumps to the newest message">
        <Field id="chatWindow.showScrollButton">
          <Toggle
            label="Show the “Latest” button"
            description="Appears when a visitor scrolls up in a long chat."
            checked={value.showScrollButton}
            onChange={(v) => onChange("showScrollButton", v)}
          />
        </Field>
        <Field id="chatWindow.latestLabel">
          <Input label="Button text" value={value.latestLabel || ""} placeholder="Latest" maxLength={30} onChange={(e) => onChange("latestLabel", e.target.value)} />
        </Field>
      </FieldGroup>

      {GROUPS.map((g) => (
        <FieldGroup key={g.title} title={g.title} icon={g.icon} description={g.description} defaultOpen={false}>
          {g.items.map((it) => (
            <Field key={it.key} id={`chatWindow.${it.key}`}>
              {it.long ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{it.label}</span>
                  <textarea
                    rows={3}
                    value={value[it.key] || ""}
                    maxLength={MAX[it.key] || 240}
                    placeholder={it.builtIn}
                    onChange={(e) => onChange(it.key, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-gray-100"
                  />
                  {it.hint && <span className="mt-1 block text-[11px] text-gray-400">{it.hint}</span>}
                </label>
              ) : (
                <Input label={it.label} value={value[it.key] || ""} placeholder={it.builtIn} maxLength={MAX[it.key] || 60} onChange={(e) => onChange(it.key, e.target.value)} />
              )}
            </Field>
          ))}
        </FieldGroup>
      ))}

      {anySet && (
        <button type="button" onClick={resetAll} className="section-in inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary-600">
          <FiRotateCcw className="h-3 w-3" /> Reset all texts to the built-in wording
        </button>
      )}
    </div>
  );
}
