import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiCopy, FiCheck, FiExternalLink, FiPlay } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import Input from "../../components/ui/Input.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

// This is the real, already-deployed public widget CDN — the same
// URL frontend/public/widget.js and every existing production
// installation already points at. Not a placeholder.
const WIDGET_CDN_URL = "https://chatbot-frontend-nine-psi.vercel.app";

// Same derivation ApiDocumentation.jsx uses — the Developer API's
// real base URL, computed from the same env var the admin JWT client
// uses, never a separate/hardcoded host.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4002/api/admin";
const DEVELOPER_BASE = API_URL.replace(/\/api\/admin\/?$/, "/api/v1/developer");

const ENGINE_OPTIONS = [
  { value: "legacy", label: "Legacy (current production renderer)" },
  { value: "v1", label: "v1 — config-driven engine (test only)" },
];

export default function ChatbotInstall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [testToken, setTestToken] = useState("");
  const [testText, setTestText] = useState("Hello, what can you help me with?");
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [domainsText, setDomainsText] = useState("");
  const [domainsSaving, setDomainsSaving] = useState(false);
  const [domainsError, setDomainsError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${id}`)
      .then((res) => {
        setData(res.data);
        setDomainsText((res.data.chatbot.allowedDomains || []).join("\n"));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const saveDomains = async () => {
    setDomainsSaving(true);
    setDomainsError("");
    try {
      const domains = domainsText
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean);
      await api.patch(`/chatbots/${id}`, { allowedDomains: domains });
      showToast("Allowed domains updated.");
      load();
    } catch (err) {
      setDomainsError(getErrorMessage(err));
    } finally {
      setDomainsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-40 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { chatbot, company } = data;
  const companyId = company?.companyId;
  const isV1 = chatbot.widgetEngineVersion === "v1";

  // A v1 chatbot gets an explicit data-chatbot-id — required the
  // moment its company has more than one chatbot, since data-company-id
  // alone can't say which one (see widget.js/Embed.jsx). Legacy
  // chatbots keep the exact snippet shape every existing install
  // already uses, unchanged.
  const snippet = isV1
    ? `<script\n  src="${WIDGET_CDN_URL}/widget.js"\n  data-company-id="${companyId}"\n  data-chatbot-id="${chatbot._id}"\n></script>`
    : `<script\n  src="${WIDGET_CDN_URL}/widget.js"\n  data-company-id="${companyId}"\n></script>`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      showToast("Snippet copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy — select and copy manually.", "error");
    }
  };

  const webhookUrl = `${DEVELOPER_BASE}/chatbots/${chatbot._id}/messages`;

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWebhookCopied(true);
      showToast("Webhook URL copied.");
      setTimeout(() => setWebhookCopied(false), 2000);
    } catch {
      showToast("Could not copy — select and copy manually.", "error");
    }
  };

  // A REAL call — direct from this browser straight to the Developer
  // API, using whatever key the admin pastes in. No simulated/fake
  // response: this is the exact same request/response this endpoint
  // gives any outside integration.
  const runWebhookTest = async () => {
    if (!testToken.trim()) {
      showToast("Paste an API key with the messages:write scope first.", "error");
      return;
    }
    setTestBusy(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: testText }),
      });
      const body = await res.json().catch(() => ({}));
      setTestResult({ status: res.status, ok: res.ok, body });
    } catch (err) {
      setTestResult({ status: null, ok: false, body: { error: { message: err.message || "Network error" } } });
    } finally {
      setTestBusy(false);
    }
  };

  const changeEngine = async (widgetEngineVersion) => {
    setBusy(true);
    try {
      await api.patch(`/chatbots/${id}`, { widgetEngineVersion });
      showToast(
        widgetEngineVersion === "v1"
          ? "Switched to the v1 test engine. Only visitors loading this exact company's widget see the change."
          : "Reverted to the legacy renderer."
      );
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Installation"
        description={chatbot.name}
        breadcrumbs={[
          { label: "Chatbots", to: "/chatbots" },
          { label: chatbot.name, to: `/chatbots/${id}` },
          { label: "Installation" },
        ]}
        action={
          <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}`)}>
            Back to Chatbot
          </Button>
        }
      />

      <div className="space-y-6">
        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Embed snippet
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Paste this immediately before the closing <code>&lt;/body&gt;</code> tag
            of every page the widget should appear on. This loads the same
            production widget script already serving your live chatbots.
          </p>

          {!companyId && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              This company has no companyId on record — the snippet below is
              incomplete until that is set.
            </p>
          )}

          <div className="relative mt-3">
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
              <code>{snippet}</code>
            </pre>
            <button
              onClick={copySnippet}
              className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              {copied ? <FiCheck /> : <FiCopy />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <a
            href={WIDGET_CDN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            View widget CDN <FiExternalLink size={12} />
          </a>
        </section>

        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Rendering engine
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Controls which widget code renders for this chatbot's embed.
            <strong> Legacy</strong> is what every current installation uses
            and is unaffected by anything in this panel. <strong>v1</strong>{" "}
            is the new config-driven engine built in this phase — switch to
            it only on a chatbot you intend to test, since it does not yet
            reimplement voice input, text-to-speech, or file upload.
          </p>

          <div className="mt-3 max-w-xs">
            <Select
              label="Widget engine version"
              options={ENGINE_OPTIONS}
              value={chatbot.widgetEngineVersion || "legacy"}
              disabled={busy}
              onChange={(e) => changeEngine(e.target.value)}
            />
          </div>
        </section>

        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Allowed website domains
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            One domain per line, e.g. <code>example.com</code> or <code>*.example.com</code> for all
            subdomains. Leave empty to allow this chatbot on any website (today's default). This is
            enforced on the backend for the v1 engine's public config, messaging, and calculator
            endpoints — not just hidden in the frontend. Note: Origin/Referer headers can't be forged by
            a real browser making a cross-origin request, but a non-browser HTTP client can set any
            value it wants — this is a website-embedding control, not a substitute for authentication.
          </p>

          <textarea
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            rows={4}
            placeholder={"example.com\n*.example.com"}
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
          />

          {domainsError && (
            <p className="mt-2 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600 dark:bg-red-950 dark:text-red-300">
              {domainsError}
            </p>
          )}

          <Button onClick={saveDomains} loading={domainsSaving} variant="secondary" className="mt-3">
            Save Allowed Domains
          </Button>
        </section>

        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Inbound webhook
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            A real endpoint — send it a visitor's message and get back the actual AI/flow-engine reply, the same
            pipeline the embedded widget uses. This requires an API key with the <code>messages:write</code> scope,
            created under{" "}
            <Link to="/developer/api-keys" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              Developer → API Keys
            </Link>
            . There is no separate "webhook secret" to configure — your API key is the credential.
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Method & URL</span>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 pr-20 text-xs leading-relaxed text-gray-100">
                  <code>POST {webhookUrl}</code>
                </pre>
                <button
                  onClick={copyWebhookUrl}
                  className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  {webhookCopied ? <FiCheck /> : <FiCopy />}
                  {webhookCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Headers</span>
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">
                <code>{`Authorization: Bearer nf_live_YOUR_API_KEY\nContent-Type: application/json`}</code>
              </pre>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Request body</span>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">
                  <code>{`{\n  "text": "What are your business hours?",\n  "visitorId": "optional-existing-id",\n  "language": "English"\n}`}</code>
                </pre>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">Response — 201</span>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">
                  <code>{`{\n  "success": true,\n  "data": {\n    "visitorId": "api_...",\n    "conversationId": "...",\n    "message": {\n      "sender": "bot",\n      "text": "...",\n      "createdAt": "..."\n    }\n  }\n}`}</code>
                </pre>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              <code>text</code> is required (max 4000 chars). Omit <code>visitorId</code> to start a new conversation
              each call, or pass one back to continue the same thread. Full field/error reference in{" "}
              <Link to="/developer/docs" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                API Documentation
              </Link>
              .
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-4 dark:border-white/10">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Send a real test request
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              This fires an actual request from your browser straight to the endpoint above — not a simulation.
              The response you see is exactly what any outside integration would get back.
            </p>
            <div className="mt-3 space-y-3">
              <Input
                label="API key (needs messages:write scope)"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                placeholder="nf_live_..."
              />
              <Input
                label="Message text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
              />
              <Button onClick={runWebhookTest} loading={testBusy} variant="secondary">
                <FiPlay className="mr-1.5 h-3.5 w-3.5" />
                Send Test
              </Button>
            </div>

            {testResult && (
              <div className="mt-3">
                <span
                  className={`text-xs font-semibold ${
                    testResult.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {testResult.status ? `HTTP ${testResult.status}` : "Request failed"}
                </span>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100">
                  <code>{JSON.stringify(testResult.body, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </section>

        <section className="animate-fade-in-up rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Installation status
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Not verified. There is currently no mechanism that detects whether
            the snippet above has actually been installed on a live site —
            this is a known limitation, not a hidden feature. Confirm
            installation by opening the site yourself and checking for the
            launcher.
          </p>
        </section>
      </div>
    </div>
  );
}
