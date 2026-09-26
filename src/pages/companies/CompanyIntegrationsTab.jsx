import { useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

const OTHER_INTEGRATIONS = ["Slack", "Microsoft Teams", "WhatsApp", "CRM", "Google Sheets"];

export default function CompanyIntegrationsTab({ company, onSaved }) {
  const { showToast } = useToast();
  const [enabled, setEnabled] = useState(company.webhook?.enabled || false);
  const [url, setUrl] = useState(company.webhook?.url || "");
  // Phase 10: the backend never returns the secret (encrypted at
  // rest, write-only) — `hasSecret` is the only thing we know about
  // it until the admin types a new one. Leaving this field blank and
  // saving keeps whatever secret is already configured; it's never
  // silently cleared just because the page was reloaded.
  const [secret, setSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const webhook = { enabled, url };
      if (secret) webhook.secret = secret; // omit entirely -> backend keeps the existing one
      await api.patch(`/companies/${company.companyId}`, { webhook });
      showToast("Webhook configuration saved.");
      setSecret("");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearSecret = async () => {
    setSaving(true);
    try {
      await api.patch(`/companies/${company.companyId}`, { webhook: { enabled, url, secret: "" } });
      showToast("Webhook secret cleared.");
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/companies/${company.companyId}/webhook/test`);
      setTestResult(res.data.result);
      onSaved();
    } catch (err) {
      setTestResult({ ok: false, error: getErrorMessage(err) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Webhook</h3>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Nuformly sends real, signed events to this URL: conversation.created, conversation.message,
          conversation.handoff, conversation.closed. This URL can also return <code>{"{ reply: \"...\" }"}</code> to
          take over generating the bot's response for a turn.
        </p>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled
          </label>
          <Input label="Webhook URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          <div>
            <Input
              label={company.webhook?.hasSecret ? "Secret (configured — leave blank to keep it)" : "Secret (optional, used to sign requests)"}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
              placeholder={company.webhook?.hasSecret ? "••••••••" : ""}
            />
            {company.webhook?.hasSecret && (
              <button onClick={handleClearSecret} className="mt-1 text-xs text-danger-600 hover:underline">
                Clear secret
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
            <Button variant="secondary" onClick={handleTest} loading={testing} disabled={!url}>
              Test Webhook
            </Button>
          </div>

          {testResult && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                testResult.ok
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {testResult.ok
                ? `Success — HTTP ${testResult.statusCode} in ${testResult.latencyMs}ms`
                : `Failed — ${testResult.error || `HTTP ${testResult.statusCode}`}`}
              {testResult.testedAt && (
                <span className="ml-2 opacity-70">
                  {new Date(testResult.testedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          <div className="text-xs text-gray-400">
            {company.webhook?.lastConnectedAt
              ? `Last successful delivery: ${new Date(company.webhook.lastConnectedAt).toLocaleString()}`
              : "Never successfully delivered."}
            {company.webhook?.lastError && (
              <span className="ml-2 text-danger-500">Last error: {company.webhook.lastError}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
          Other Integrations
        </h3>
        <ul className="space-y-2">
          {OTHER_INTEGRATIONS.map((name) => (
            <li
              key={name}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-white/5"
            >
              <span className="text-gray-700 dark:text-gray-300">{name}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-white/10 dark:text-gray-400">
                Not configured
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
