import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCopy, FiCheck, FiExternalLink } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

// This is the real, already-deployed public widget CDN — the same
// URL frontend/public/widget.js and every existing production
// installation already points at. Not a placeholder.
const WIDGET_CDN_URL = "https://chatbot-frontend-nine-psi.vercel.app";

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

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

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

  const snippet = `<script\n  src="${WIDGET_CDN_URL}/widget.js"\n  data-company-id="${companyId}"\n></script>`;

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
