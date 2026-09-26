import { FiInfo } from "react-icons/fi";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
];

export default function StepAI({ form, setForm }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Configure your AI
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This controls how your chatbot responds. You don't need to know
          anything about the underlying AI provider.
        </p>
      </div>

      <Input
        label="AI Model"
        value={form.model}
        onChange={(e) => setForm({ ...form, model: e.target.value })}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Response Style
          </span>
          <span className="text-xs text-gray-400">{form.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={form.temperature}
          onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
          className="w-full accent-primary-500"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>Consistent</span>
          <span>Creative</span>
        </div>
      </div>

      <Select
        label="Response Language"
        options={LANGUAGE_OPTIONS}
        value={form.language}
        onChange={(e) => setForm({ ...form, language: e.target.value })}
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          How should your chatbot respond?
        </span>
        <textarea
          rows={4}
          placeholder="You are a helpful AI assistant for our company. Give concise, professional and friendly answers."
          value={form.systemPrompt}
          onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
        />
      </label>

      <div className="flex gap-2 rounded-lg bg-info-50 px-3 py-2.5 text-xs text-info-600 dark:bg-info-500/10 dark:text-info-500">
        <FiInfo className="h-4 w-4 shrink-0" />
        <p>
          These settings are saved with your chatbot now and will apply
          automatically once the Chatbot Customization Studio (coming soon)
          goes live. Until then, your company's shared AI configuration
          (Companies → Configuration) is what powers live responses.
        </p>
      </div>
    </div>
  );
}
