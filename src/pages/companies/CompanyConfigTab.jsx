import { useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";

// Mirrors backend/config/aiConfig.js's SUPPORTED_MODELS — the
// backend re-validates against that same allowlist regardless of
// what this dropdown sends (Phase 7).
const MODEL_OPTIONS = [
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (default, text)" },
  { value: "qwen/qwen3.6-27b", label: "Qwen 3.6 27B (vision-capable)" },
];

/**
 * Edits the exact fields the live chat pipeline reads
 * (services/groq.service.js) — a save here changes the running
 * bot's behavior immediately, no separate "publish" step.
 */
export default function CompanyConfigTab({ company, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    model: company.ai?.model || "",
    temperature: company.ai?.temperature ?? 0.3,
    maxTokens: company.ai?.maxTokens ?? 500,
    systemPrompt: company.ai?.systemPrompt || "",
    phone: company.contact?.phone || "",
    whatsapp: company.contact?.whatsapp || "",
    email: company.contact?.email || "",
    address: company.contact?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await api.patch(`/companies/${company.companyId}`, {
        ai: {
          ...company.ai,
          model: form.model,
          temperature: Number(form.temperature),
          maxTokens: Number(form.maxTokens),
          systemPrompt: form.systemPrompt,
        },
        contact: {
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          address: form.address,
        },
      });
      showToast("Chatbot configuration saved — now live.");
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
          AI Configuration
        </h3>
        <div className="space-y-4">
          <Select
            label="Model"
            options={MODEL_OPTIONS}
            value={form.model || MODEL_OPTIONS[0].value}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Temperature"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: e.target.value })}
            />
            <Input
              label="Max Tokens"
              type="number"
              value={form.maxTokens}
              onChange={(e) => setForm({ ...form, maxTokens: e.target.value })}
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              System Prompt
            </span>
            <textarea
              rows={6}
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary-400 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
          Contact Info
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Button onClick={handleSave} loading={saving}>
        Save Changes
      </Button>
    </div>
  );
}
