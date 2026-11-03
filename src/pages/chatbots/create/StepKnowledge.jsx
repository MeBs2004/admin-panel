import { useEffect, useRef, useState } from "react";
import {
  FiGlobe,
  FiUploadCloud,
  FiFileText,
  FiDownload,
  FiAlertTriangle,
  FiCheckCircle,
  FiArrowLeft,
  FiExternalLink,
  FiRefreshCw,
} from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";

// Same cap the server enforces (backend/services/knowledge.service.js).
const MAX_BYTES = 2 * 1024 * 1024;
const bytesOf = (s) => new TextEncoder().encode(s).length;
const kb = (n) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

const ACCEPT = ".txt,.pdf,.docx,.xls,.xlsx";
const ACCEPT_LABEL = ".txt, .pdf, .docx, .xls or .xlsx";

/**
 * Wizard step: build the chatbot's knowledge base from the company's
 * website or an uploaded file, then review and edit the result. Nothing
 * is saved here — the wizard saves it right after the chatbot is
 * created (see CreateChatbotWizard.jsx). The knowledge base belongs to
 * the company, so every one of its chatbots answers from the same text.
 */
export default function StepKnowledge({ companyId, companyName, knowledge, setKnowledge }) {
  const [loading, setLoading] = useState(!knowledge.loaded || knowledge.companyId !== companyId);
  const [error, setError] = useState("");
  // "pick" (choose a source), "working" (scanning/generating), or "result"
  // (generated or already-saved content, editable).
  const [phase, setPhase] = useState("pick");
  const [source, setSource] = useState("url"); // which tab is active while picking
  const [url, setUrl] = useState("");
  const [working, setWorking] = useState("");
  const [pickError, setPickError] = useState("");
  const [resultMeta, setResultMeta] = useState(null); // { origin: "existing"|"url"|"file", label, pagesScanned, truncated }
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get(`/companies/${companyId}/knowledge`)
      .then((res) => {
        const content = res.data.content || "";
        setKnowledge({ companyId, content, original: content, updatedAt: res.data.updatedAt || null, loaded: true });
        if (content.trim()) {
          setResultMeta({ origin: "existing" });
          setPhase("result");
        } else {
          setPhase("pick");
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  // Load once per company (keeps progress when moving between wizard steps).
  useEffect(() => {
    if (knowledge.loaded && knowledge.companyId === companyId) {
      setLoading(false);
      if (knowledge.content.trim()) {
        setResultMeta((m) => m || { origin: "existing" });
        setPhase("result");
      }
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const content = knowledge.content;
  const setContent = (value) => setKnowledge((k) => ({ ...k, content: value }));
  const size = bytesOf(content);
  const tooBig = size > MAX_BYTES;
  const changed = knowledge.loaded && content !== knowledge.original;

  const generateFromUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setPickError("Enter a website address.");
      return;
    }
    setPickError("");
    setWorking(`Reading ${trimmed.replace(/^https?:\/\//i, "").split("/")[0]}…`);
    try {
      const res = await api.post(`/companies/${companyId}/knowledge/generate-from-url`, { url: trimmed }, { timeout: 60000 });
      setKnowledge((k) => ({ ...k, content: res.data.content }));
      setResultMeta({
        origin: "url",
        label: res.data.source?.url || trimmed,
        pagesScanned: res.data.source?.pagesScanned?.length || 1,
        truncated: res.data.truncated,
      });
      setPhase("result");
    } catch (err) {
      setPickError(getErrorMessage(err));
    } finally {
      setWorking("");
    }
  };

  const generateFromFile = async (file) => {
    if (!file) return;
    setPickError("");
    setWorking(`Reading ${file.name}…`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/companies/${companyId}/knowledge/generate-from-file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      setKnowledge((k) => ({ ...k, content: res.data.content }));
      setResultMeta({ origin: "file", label: file.name, structured: res.data.structured, truncated: res.data.truncated });
      setPhase("result");
    } catch (err) {
      setPickError(getErrorMessage(err));
    } finally {
      setWorking("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const download = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const dlUrl = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: dlUrl, download: "knowledge.txt" });
    a.click();
    URL.revokeObjectURL(dlUrl);
  };

  const startOver = () => {
    setPickError("");
    setUrl("");
    setPhase("pick");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-9 w-56" />
        <SkeletonLine className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!knowledge.loaded) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Give your chatbot knowledge</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Point it at {companyName || "your company"}&apos;s website, or upload a file — the AI reads it and writes a ready-to-use knowledge base.
        </p>
      </div>

      {phase !== "result" ? (
        <>
          <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/5" role="tablist" aria-label="Knowledge base source">
            {[
              ["url", "Website URL", FiGlobe],
              ["file", "Upload a file", FiUploadCloud],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={source === key}
                disabled={Boolean(working)}
                onClick={() => {
                  setSource(key);
                  setPickError("");
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  source === key ? "bg-white text-gray-900 shadow-sm dark:bg-[var(--surface)] dark:text-gray-100" : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {pickError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {pickError}
            </p>
          )}

          {working ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 px-6 py-14 text-center dark:border-[var(--border)] dark:bg-white/[0.03]">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{working}</p>
              <p className="text-xs text-gray-400">This can take up to a minute.</p>
            </div>
          ) : source === "url" ? (
            <form
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]"
              onSubmit={(e) => {
                e.preventDefault();
                generateFromUrl();
              }}
            >
              <label htmlFor="kb-url" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Your website address
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="kb-url"
                  type="text"
                  inputMode="url"
                  placeholder="www.yourcompany.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
                />
                <button type="submit" className="whitespace-nowrap rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700">
                  Scan website
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                We'll read the homepage and a few of its most useful pages — pricing, about, contact, FAQs — and leave out menus and boilerplate.
              </p>
            </form>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                generateFromFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                dragging ? "border-primary-400 bg-primary-50/60 dark:bg-emerald-950/30" : "border-gray-300 bg-gray-50/60 dark:border-[var(--border)] dark:bg-white/[0.03]"
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-[var(--surface)] dark:text-emerald-300">
                <FiFileText className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Drop a file here</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ACCEPT_LABEL} · up to 5 MB</p>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Choose a file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => generateFromFile(e.target.files?.[0])}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-[var(--border)] dark:bg-white/5">
            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <FiCheckCircle className="h-4 w-4 shrink-0 text-primary-500" />
              {resultMeta?.origin === "url" && (
                <span className="truncate">
                  Generated from <b className="text-gray-800 dark:text-gray-100">{resultMeta.label}</b>
                  {resultMeta.pagesScanned > 1 ? ` (${resultMeta.pagesScanned} pages)` : ""} — review it below.
                </span>
              )}
              {resultMeta?.origin === "file" && (
                <span className="truncate">
                  {resultMeta.structured === false ? "Loaded" : "Generated"} from <b className="text-gray-800 dark:text-gray-100">{resultMeta.label}</b> — review it below.
                </span>
              )}
              {resultMeta?.origin === "existing" && <span>{companyName || "This company"}&apos;s current knowledge base, shared across all its chatbots.</span>}
            </div>
            <button type="button" onClick={startOver} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-emerald-300">
              <FiRefreshCw className="h-3.5 w-3.5" /> {resultMeta?.origin === "existing" ? "Generate instead" : "Try a different source"}
            </button>
          </div>

          {resultMeta?.truncated && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> The source had more content than we could fit — the most relevant parts were kept.
            </p>
          )}

          <div className="flex items-center justify-between">
            <label htmlFor="knowledge-text" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Knowledge base
            </label>
            <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/5">
              <FiDownload className="h-3.5 w-3.5" /> Download .txt
            </button>
          </div>
          <textarea
            id="knowledge-text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            spellCheck
            aria-invalid={tooBig || undefined}
            className={`w-full resize-y rounded-xl border bg-white p-4 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition-shadow focus:ring-4 dark:bg-[var(--surface)] dark:text-gray-100 ${
              tooBig ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-primary-400 focus:ring-primary-100 dark:border-[var(--border)] dark:focus:ring-emerald-900/40"
            }`}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={tooBig ? "font-medium text-red-600" : "text-gray-400"}>
              {content.length.toLocaleString()} characters · {kb(size)} of 2 MB
              {tooBig && " — too large, remove some text before creating the chatbot"}
            </span>
            {changed ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">Will be saved when you create the chatbot</span>
            ) : (
              <span className="text-gray-400">No changes</span>
            )}
          </div>

          {!content.trim() && (
            <button type="button" onClick={startOver} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-emerald-300">
              <FiArrowLeft className="h-3.5 w-3.5" /> Generate it from a website or file instead
            </button>
          )}
        </>
      )}

      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <FiExternalLink className="h-3 w-3 shrink-0" />
        Shared by all of {companyName || "this company"}&apos;s chatbots. You can edit it any time later from the chatbot&apos;s Knowledge Base page.
      </p>
    </div>
  );
}

export { MAX_BYTES as KNOWLEDGE_MAX_BYTES, bytesOf as knowledgeBytes };
