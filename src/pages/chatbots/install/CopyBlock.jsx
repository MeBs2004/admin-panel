import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

/** A dark code block with a Copy button. */
export default function CopyBlock({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the text is still selectable.
    }
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-gray-900 p-4 pr-24 text-xs leading-relaxed text-gray-100">
        <code>{text}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
      >
        {copied ? <FiCheck /> : <FiCopy />}
        {copied ? "Copied" : label}
      </button>
    </div>
  );
}
