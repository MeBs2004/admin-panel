import Toggle from "../../../components/ui/Toggle.jsx";
import Field from "../../../components/studio/Field.jsx";

export default function SectionWelcome({ value, onChange, hindi = "", onHindiChange, show = true, onShowChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Welcome message</h3>
        <p className="mt-1 text-xs text-gray-400">The first message visitors see when they open the chat window.</p>
      </div>

      {onShowChange && (
        <Field id="chatWindow.showWelcome">
          <Toggle label="Show the welcome message" description="Turn off to open the chat straight to the buttons and suggestions." checked={show} onChange={onShowChange} />
        </Field>
      )}

      <Field id="chatWindow.welcomeMessage">
      <label className="block">
        <textarea
          rows={4}
          maxLength={300}
          placeholder="Hi! How can we help you today?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-gray-100"
        />
        <span className="mt-1 block text-xs text-gray-400">{value.length}/300</span>
      </label>
      </Field>

      {onHindiChange && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Hindi version (optional)</span>
          <textarea
            rows={4}
            maxLength={300}
            placeholder="नमस्ते! हम आपकी कैसे मदद कर सकते हैं?"
            value={hindi}
            onChange={(e) => onHindiChange(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-gray-100"
          />
          <span className="mt-1 block text-xs text-gray-400">
            Shown when the visitor switches to Hindi. Leave empty to keep the English message. {hindi.length}/300
          </span>
        </label>
      )}
    </div>
  );
}
