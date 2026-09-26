import { useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";

/**
 * The real, existing knowledge system: one flat text file per
 * company (Company.knowledgeFile), read directly by
 * services/groq.service.js. Saving here writes the actual file
 * and invalidates the server's in-memory cache — no separate
 * "processing" pipeline exists, so we don't fake one.
 */
export default function CompanyKnowledgeTab({ companyId }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeout = useRef(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/companies/${companyId}/knowledge`)
      .then((res) => {
        setData(res.data);
        setContent(res.data.content);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);
  useEffect(() => () => clearTimeout(savedTimeout.current), []);

  const handleSave = async () => {
    setSaving(true);
    setJustSaved(false);
    try {
      await api.put(`/companies/${companyId}/knowledge`, { content });
      showToast("Knowledge base updated — now live.");
      setJustSaved(true);
      savedTimeout.current = setTimeout(() => setJustSaved(false), 2200);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonLine className="h-64 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-200">{data.knowledgeFile}</span>
        <span>
          {(data.sizeBytes / 1024).toFixed(1)} KB
          {data.updatedAt && ` · Updated ${new Date(data.updatedAt).toLocaleString()}`}
        </span>
      </div>

      {data.error && (
        <p className="mb-3 animate-fade-in rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
          {data.error}
        </p>
      )}

      <textarea
        rows={16}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
      />

      <div className="mt-3 flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          {saving ? "Saving..." : "Save Knowledge Base"}
        </Button>
        {justSaved && (
          <span className="flex animate-fade-in-up items-center gap-1 text-sm font-medium text-success-600 dark:text-success-500">
            <FiCheck className="h-4 w-4" /> Saved
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
