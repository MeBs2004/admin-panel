import { useEffect, useRef, useState } from "react";
import { FiUploadCloud, FiFileText, FiEdit3, FiDownload, FiTrash2, FiAlertTriangle, FiCheckCircle, FiZap } from "react-icons/fi";
import api, { getErrorMessage } from "../../../services/api.js";
import { SkeletonLine } from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";

// Same cap the server enforces (backend/services/knowledge.service.js).
const MAX_BYTES = 2 * 1024 * 1024;
const bytesOf = (s) => new TextEncoder().encode(s).length;
const kb = (n) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

// A starting outline for people writing from scratch.
const OUTLINE = (company) => `ABOUT ${company ? company.toUpperCase() : "US"}
Who you are, what you do and who you help, in two or three sentences.

PRODUCTS & SERVICES
- Product or service — what it is, who it's for, price or starting price

PRICING & OFFERS
Plans, prices, discounts, payment options (EMI, UPI, cards).

OPENING HOURS & LOCATION
Days and hours, address, areas you serve, delivery or visit details.

HOW TO CONTACT US
Phone, WhatsApp, email, and when a person will reply.

FREQUENTLY ASKED QUESTIONS
Q: A question customers often ask?
A: The answer, exactly as you'd want the chatbot to give it.

POLICIES
Returns, refunds, cancellations, warranty, shipping.
`;

/**
 * Wizard step: write or upload what the chatbot should know. Nothing is
 * saved here — the wizard saves it right after the chatbot is created.
 * The knowledge base belongs to the company, so every one of its
 * chatbots answers from the same text.
 */
export default function StepKnowledge({ companyId, companyName, knowledge, setKnowledge }) {
  const [loading, setLoading] = useState(!knowledge.loaded || knowledge.companyId !== companyId);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("write");
  const [pending, setPending] = useState(null); // an uploaded file waiting for "replace or add?"
  const [fileNote, setFileNote] = useState(null); // { tone, text }
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
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  // Load once per company (keeps what was typed when moving between steps).
  useEffect(() => {
    if (knowledge.loaded && knowledge.companyId === companyId) setLoading(false);
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const content = knowledge.content;
  const setContent = (value) => setKnowledge((k) => ({ ...k, content: value }));
  const size = bytesOf(content);
  const tooBig = size > MAX_BYTES;
  const changed = knowledge.loaded && content !== knowledge.original;

  const readFile = (file) => {
    setFileNote(null);
    if (!file) return;
    const isTxt = /\.txt$/i.test(file.name) || file.type === "text/plain";
    if (!isTxt) {
      setFileNote({ tone: "error", text: `"${file.name}" isn't a .txt file. Save it as plain text (.txt) and upload again.` });
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileNote({ tone: "error", text: `"${file.name}" is ${kb(file.size)} — the limit is 2 MB.` });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setFileNote({ tone: "error", text: `Couldn't read "${file.name}". Try again.` });
    reader.onload = () => {
      // Normalise Windows line endings and drop a byte-order mark.
      const text = String(reader.result || "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
      if (!text.trim()) {
        setFileNote({ tone: "error", text: `"${file.name}" is empty.` });
        return;
      }
      if (/�/.test(text)) {
        setFileNote({ tone: "warn", text: `Some characters in "${file.name}" couldn't be read. Save the file as UTF-8 text if words look garbled.` });
      }
      if (content.trim()) setPending({ name: file.name, text });
      else apply(file.name, text, "replace");
    };
    reader.readAsText(file, "utf-8");
  };

  const apply = (name, text, mode) => {
    setContent(mode === "append" ? `${content.replace(/\s+$/, "")}\n\n${text}` : text);
    setPending(null);
    setTab("write");
    setFileNote((n) => (n?.tone === "warn" ? n : { tone: "ok", text: `${mode === "append" ? "Added" : "Loaded"} "${name}" — review it below.` }));
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "knowledge.txt" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Give your chatbot knowledge</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your chatbot answers questions about {companyName || "your company"} from this text. Write it here or upload a <b>.txt</b> file.
        </p>
      </div>

      {loading && (
        <div className="space-y-2">
          <SkeletonLine className="h-9 w-56" />
          <SkeletonLine className="h-64 w-full" />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && knowledge.loaded && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/5" role="tablist" aria-label="How to add knowledge">
              {[
                ["write", "Write", FiEdit3],
                ["upload", "Upload .txt", FiUploadCloud],
              ].map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                    tab === key ? "bg-white text-gray-900 shadow-sm dark:bg-[var(--surface)] dark:text-gray-100" : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {!content.trim() && (
                <button type="button" onClick={() => setContent(OUTLINE(companyName))} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-emerald-300 dark:hover:bg-white/5">
                  <FiZap className="h-3.5 w-3.5" /> Start from an outline
                </button>
              )}
              {content.trim() && (
                <>
                  <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/5">
                    <FiDownload className="h-3.5 w-3.5" /> Download .txt
                  </button>
                  <button type="button" onClick={() => setContent("")} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-white/5">
                    <FiTrash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {fileNote && (
            <p
              role={fileNote.tone === "error" ? "alert" : "status"}
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                fileNote.tone === "error"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : fileNote.tone === "warn"
                    ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              {fileNote.tone === "ok" ? <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              {fileNote.text}
            </p>
          )}

          {pending && (
            <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-sm text-gray-800 dark:text-gray-100">
                <b>{pending.name}</b> ({kb(bytesOf(pending.text))}) is ready. There's already text in your knowledge base — what should we do?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => apply(pending.name, pending.text, "append")} className="rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Add it to the end
                </button>
                <button type="button" onClick={() => apply(pending.name, pending.text, "replace")} className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-gray-200">
                  Replace everything
                </button>
                <button type="button" onClick={() => setPending(null)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-800">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {tab === "upload" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                readFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                dragging ? "border-primary-400 bg-primary-50/60 dark:bg-emerald-950/30" : "border-gray-300 bg-gray-50/60 dark:border-[var(--border)] dark:bg-white/[0.03]"
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-[var(--surface)] dark:text-emerald-300">
                <FiFileText className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Drop your knowledge.txt here</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Plain text (.txt) · up to 2 MB</p>
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
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  readFile(e.target.files?.[0]);
                  e.target.value = ""; // allow picking the same file again
                }}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="knowledge-text" className="sr-only">
                Knowledge base text
              </label>
              <textarea
                id="knowledge-text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                spellCheck
                placeholder={`Write what your chatbot should know — your products and prices, opening hours, delivery and return policies, and answers to common questions.\n\nTip: "Start from an outline" gives you headings to fill in.`}
                aria-invalid={tooBig || undefined}
                className={`w-full resize-y rounded-xl border bg-white p-4 font-mono text-[13px] leading-relaxed text-gray-800 outline-none transition-shadow focus:ring-4 dark:bg-[var(--surface)] dark:text-gray-100 ${
                  tooBig ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-primary-400 focus:ring-primary-100 dark:border-[var(--border)] dark:focus:ring-emerald-900/40"
                }`}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={tooBig ? "font-medium text-red-600" : "text-gray-400"}>
              {content.length.toLocaleString()} characters · {kb(size)} of 2 MB
              {tooBig && " — too large, remove some text before creating the chatbot"}
            </span>
            {changed ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">Will be saved when you create the chatbot</span>
            ) : content.trim() ? (
              <span className="text-gray-400">No changes</span>
            ) : null}
          </div>

          <p className="text-xs text-gray-400">
            This knowledge base is shared by all of {companyName || "this company"}&apos;s chatbots. You can edit it any time later from the chatbot&apos;s Knowledge Base page.
          </p>
        </>
      )}
    </div>
  );
}

export { MAX_BYTES as KNOWLEDGE_MAX_BYTES, bytesOf as knowledgeBytes };
