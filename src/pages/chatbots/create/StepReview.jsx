import { FiCheckCircle } from "react-icons/fi";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import PreviewFrame from "../../../components/preview/PreviewFrame.jsx";
import { SECTOR_LABELS } from "../../../config/sectorTemplates.js";

export default function StepReview({ form, companyName, config }) {
  const ctaCount = config?.ctas?.filter((c) => c.enabled && c.value).length || 0;
  const suggestionCount = config?.suggestions?.filter(Boolean).length || 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Review your chatbot</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This is exactly how it will look. Go back to any step to change something.
          </p>
        </div>

        <dl className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:divide-white/5 dark:border-[var(--border)]">
          <Row label="Chatbot">{form.name}</Row>
          <Row label="Template">{SECTOR_LABELS[form.template] || form.template}</Row>
          <Row label="Company">{companyName}</Row>
          <Row label="AI Model">{form.model}</Row>
          <Row label="Response Style">{form.temperature.toFixed(1)} temperature</Row>
          <Row label="Response Language">{form.language}</Row>
          <Row label="Instructions">
            {form.systemPrompt ? <span className="line-clamp-2">{form.systemPrompt}</span> : <span className="text-gray-400">Not set</span>}
          </Row>
          <Row label="Launcher">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: config?.launcher?.gradient?.enabled ? `linear-gradient(135deg, ${config.launcher.gradient.from}, ${config.launcher.gradient.to})` : config?.launcher?.color }} />
              {config?.launcher?.icon} · {config?.launcher?.animation}
            </span>
          </Row>
          <Row label="CTA buttons">{ctaCount > 0 ? `${ctaCount} enabled` : "None"}</Row>
          <Row label="Suggestions">{suggestionCount > 0 ? `${suggestionCount} custom` : "Using company default"}</Row>
          <Row label="Status">
            <StatusBadge status="DRAFT" />
          </Row>
        </dl>

        <p className="flex items-start gap-2 text-xs text-gray-400">
          <FiCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
          Your chatbot starts as <strong>Draft</strong> and won't be reachable publicly until it's set to Live from the Chatbot detail page.
        </p>
      </div>

      <div className="h-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-emerald-50/40 dark:border-[var(--border)] dark:from-black/10 dark:to-black/20">
        <PreviewFrame config={config} deviceMode="mobile" engine="v1" focus="window" />
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 dark:text-gray-100 sm:max-w-xs sm:text-right">{children}</dd>
    </div>
  );
}
