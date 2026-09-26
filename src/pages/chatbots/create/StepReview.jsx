import StatusBadge from "../../../components/ui/StatusBadge.jsx";

export default function StepReview({ form, companyName }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Review your chatbot
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Confirm everything looks right before creating your chatbot.
        </p>
      </div>

      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-white/5 dark:border-[var(--border)]">
        <Row label="Chatbot">{form.name}</Row>
        <Row label="Company">{companyName}</Row>
        <Row label="AI Model">{form.model}</Row>
        <Row label="Response Style">{form.temperature.toFixed(1)} temperature</Row>
        <Row label="Response Language">{form.language}</Row>
        <Row label="Instructions">
          {form.systemPrompt ? (
            <span className="line-clamp-2">{form.systemPrompt}</span>
          ) : (
            <span className="text-gray-400">Not set</span>
          )}
        </Row>
        <Row label="Status">
          <StatusBadge status="DRAFT" />
        </Row>
      </dl>

      <p className="text-xs text-gray-400">
        Your chatbot starts as <strong>Draft</strong> and won't be reachable
        publicly until it's set to Live from the Chatbot detail page.
      </p>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 dark:text-gray-100 sm:max-w-xs sm:text-right">
        {children}
      </dd>
    </div>
  );
}
