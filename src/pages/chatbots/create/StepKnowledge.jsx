import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";

export default function StepKnowledge({ companyId, companyName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get(`/companies/${companyId}/knowledge`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Give your chatbot knowledge
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your chatbot uses this information to answer questions about{" "}
          {companyName}.
        </p>
      </div>

      {loading && (
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-40" />
          <SkeletonLine className="h-32 w-full" />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 dark:border-[var(--border)] dark:bg-white/5 dark:text-gray-400">
            {data.knowledgeFile} · {(data.sizeBytes / 1024).toFixed(1)} KB
            {data.updatedAt && ` · Updated ${new Date(data.updatedAt).toLocaleDateString()}`}
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs text-gray-600 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-300">
            {data.content ? (
              <pre className="whitespace-pre-wrap">{data.content}</pre>
            ) : (
              <span className="text-gray-400">No knowledge content yet.</span>
            )}
          </div>

          <p className="text-xs text-gray-400">
            This knowledge base is shared across all of {companyName}'s
            chatbots. You can create your chatbot now and edit this content
            anytime — including right after creation.
          </p>

          <Link
            to={`/companies/${companyId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
          >
            Edit Knowledge Base <FiExternalLink className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}
