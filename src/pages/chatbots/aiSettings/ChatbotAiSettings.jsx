import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSend, FiRotateCcw } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { subscribeCompany } from "../../../services/realtime.js";
import { useToast } from "../../../context/ToastContext.jsx";
import PageHeader from "../../../components/ui/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Toggle from "../../../components/ui/Toggle.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";

const DEFAULT_AI = {
  model: "openai/gpt-oss-20b",
  temperature: 0.3,
  maxTokens: 500,
  systemPrompt: "",
  language: "English",
  fallbackMessage: "",
  responseStyle: { length: "balanced", tone: "professional", customTone: "", useEmojis: true, useMarkdown: true },
};

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      {description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ChatbotAiSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [chatbotMeta, setChatbotMeta] = useState(null);
  const [options, setOptions] = useState(null);
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [testMessage, setTestMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [testReply, setTestReply] = useState(null);
  const [testError, setTestError] = useState("");
  const [updatedElsewhere, setUpdatedElsewhere] = useState(false);
  const justSavedRef = useRef(false);

  const load = () => {
    setLoading(true);
    setError("");
    setUpdatedElsewhere(false);
    api
      .get(`/chatbots/${id}/ai-settings`)
      .then((res) => {
        setChatbotMeta({
          companyName: res.data.companyName,
          chatbotId: res.data.chatbotId,
          companyId: res.data.companyId,
          siblingChatbotCount: res.data.siblingChatbotCount,
        });
        setOptions(res.data.options);
        setSaved(res.data.ai);
        setDraft(res.data.ai);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  // AI config is shared at the Company level (see Company.ai) — if
  // another admin saves it (from this chatbot's page or a sibling
  // chatbot's), this tab's draft is now stale. Never silently
  // overwrite unsaved edits (Section 31) — just surface a banner the
  // admin can act on.
  useEffect(() => {
    if (!chatbotMeta?.companyId) return undefined;
    return subscribeCompany(chatbotMeta.companyId, (evt) => {
      if (evt.type === "ai.settings.updated" && !justSavedRef.current) setUpdatedElsewhere(true);
    });
  }, [chatbotMeta?.companyId]);

  const hasChanges = saved && draft && JSON.stringify(saved) !== JSON.stringify(draft);
  const set = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const setStyle = (field, value) => setDraft((d) => ({ ...d, responseStyle: { ...d.responseStyle, [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    justSavedRef.current = true;
    setTimeout(() => (justSavedRef.current = false), 3000);
    try {
      const res = await api.put(`/chatbots/${id}/ai-settings`, { ai: draft });
      setSaved(res.data.ai);
      setDraft(res.data.ai);
      setUpdatedElsewhere(false);
      showToast("AI settings saved — live for the next visitor message.");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(DEFAULT_AI);
    setConfirmReset(false);
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setTesting(true);
    setTestError("");
    setTestReply(null);
    try {
      const res = await api.post(`/chatbots/${id}/ai/test`, { message: testMessage, language: draft.language });
      setTestReply(res.data.reply);
    } catch (err) {
      setTestError(getErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!draft || !options) return null;

  return (
    <div>
      <PageHeader
        title="AI Settings"
        description={chatbotMeta?.companyName}
        breadcrumbs={[
          { label: "Chatbots", to: "/chatbots" },
          { label: chatbotMeta?.companyName || "Chatbot", to: `/chatbots/${id}` },
          { label: "AI Settings" },
        ]}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}`)}>
              Back to Chatbot
            </Button>
            <Button variant="secondary" onClick={() => setConfirmReset(true)}>
              <FiRotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!hasChanges}>
              {hasChanges ? "Save Changes" : "Saved"}
            </Button>
          </div>
        }
      />

      {updatedElsewhere && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-info-50 px-4 py-3 text-sm text-info-700 dark:bg-info-500/10 dark:text-info-300">
          <span>AI settings were updated elsewhere. Your unsaved changes here are kept, but may now conflict.</span>
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
      )}

      {chatbotMeta?.siblingChatbotCount > 0 && (
        <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
          This company has {chatbotMeta.siblingChatbotCount + 1} chatbots. AI Settings are shared across all of
          them — saving here changes the AI behavior for every chatbot in {chatbotMeta.companyName}, not just this
          one.
        </p>
      )}

      <div className="space-y-6">
        <Section title="Model" description="Only Groq-supported models can be selected — the backend re-validates this regardless of what's sent.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <Input value="Groq" disabled />
            </Field>
            <Field label="Model">
              <Select
                options={options.models.map((m) => ({ value: m.value, label: m.label }))}
                value={draft.model}
                onChange={(e) => set("model", e.target.value)}
              />
            </Field>
            <Field label={`Temperature (${draft.temperature})`} hint="Lower = more focused and deterministic. Higher = more varied.">
              <input
                type="range"
                min={options.temperatureRange[0]}
                max={options.temperatureRange[1]}
                step="0.1"
                value={draft.temperature}
                onChange={(e) => set("temperature", Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label="Max Tokens" hint={`Between ${options.maxTokensRange[0]} and ${options.maxTokensRange[1]}.`}>
              <Input
                type="number"
                min={options.maxTokensRange[0]}
                max={options.maxTokensRange[1]}
                value={draft.maxTokens}
                onChange={(e) => set("maxTokens", Number(e.target.value))}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="AI Instructions"
          description="Layered under Nuformly's fixed platform rules — it can steer tone and focus, but can never remove tenant isolation, safety rules, or the knowledge scope."
        >
          <textarea
            rows={5}
            value={draft.systemPrompt}
            onChange={(e) => set("systemPrompt", e.target.value)}
            placeholder="You are the AI assistant for our company. Be concise, professional and helpful."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
          />
        </Section>

        <Section title="Response Style" description="Each option here actually changes how the AI is instructed to respond — nothing here is cosmetic-only.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Response length">
              <Select
                options={options.responseLengths.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))}
                value={draft.responseStyle.length}
                onChange={(e) => setStyle("length", e.target.value)}
              />
            </Field>
            <Field label="Tone">
              <Select
                options={options.tones.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))}
                value={draft.responseStyle.tone}
                onChange={(e) => setStyle("tone", e.target.value)}
              />
            </Field>
            {draft.responseStyle.tone === "custom" && (
              <Field label="Custom tone description">
                <Input value={draft.responseStyle.customTone} onChange={(e) => setStyle("customTone", e.target.value)} placeholder="e.g. Warm and reassuring, like a trusted advisor" />
              </Field>
            )}
          </div>
          <div className="mt-2 space-y-3">
            <Toggle checked={draft.responseStyle.useEmojis} onChange={(v) => setStyle("useEmojis", v)} label="Use emojis" />
            <Toggle checked={draft.responseStyle.useMarkdown} onChange={(v) => setStyle("useMarkdown", v)} label="Markdown formatting" />
          </div>
        </Section>

        <Section title="Language">
          <Field label="Default language" hint="Used when the widget doesn't send a language for this visitor.">
            <Select options={options.languages.map((l) => ({ value: l, label: l }))} value={draft.language} onChange={(e) => set("language", e.target.value)} />
          </Field>
        </Section>

        <Section title="Fallback" description="Shown when the AI determines a question is outside what it's allowed to answer.">
          <textarea
            rows={2}
            value={draft.fallbackMessage}
            onChange={(e) => set("fallbackMessage", e.target.value)}
            placeholder="I'm sorry, I don't have enough information to answer that. Would you like to speak with our team?"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
          />
        </Section>

        <Section title="Test AI" description="Runs through the real backend AI service with this chatbot's saved configuration — not a separate simulation.">
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
              placeholder="How can you help me?"
              className="flex-1"
            />
            <Button onClick={handleTest} loading={testing} disabled={!testMessage.trim()}>
              <FiSend className="h-3.5 w-3.5" /> Test
            </Button>
          </div>
          {hasChanges && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Testing runs against your last saved settings — save first to test unsaved changes.
            </p>
          )}
          {testError && <p className="mt-3 text-sm text-danger-600">{testError}</p>}
          {testReply && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-200">
              {testReply}
            </div>
          )}
        </Section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset to defaults?"
        message="This discards your unsaved changes and restores the original defaults. You'll still need to click Save to persist it."
        confirmLabel="Reset"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
