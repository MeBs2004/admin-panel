import { useRef, useState } from "react";
import { FiUploadCloud, FiTrash2, FiLink, FiImage } from "react-icons/fi";
import { FieldLabel } from "./FieldGroup.jsx";

const MAX_DATA_URL = 58000; // backend cap is 60000 chars

// Downscale to fit `size`, keep transparency for png/webp/gif, and
// step quality/size down until the encoded image fits the backend cap.
function fileToSmallDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      reject(new Error("Use a PNG, JPG, WebP or GIF image."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const keepAlpha = file.type !== "image/jpeg";
      for (let dim = size; dim >= 48; dim = Math.round(dim * 0.8)) {
        const scale = Math.min(1, dim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const qualities = keepAlpha ? [undefined] : [0.9, 0.75, 0.6];
        for (const q of qualities) {
          const out = canvas.toDataURL(keepAlpha ? "image/png" : "image/jpeg", q);
          if (out.length <= MAX_DATA_URL) return resolve(out);
        }
      }
      reject(new Error("That image is too detailed to embed. Try a simpler or smaller one."));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };
    img.src = url;
  });
}

/**
 * Drag-and-drop / click-to-browse image field with a URL fallback.
 * The result is always either "" or a value the backend accepts
 * (https URL or a small data: image).
 */
export default function ImageUpload({ label, hint, value, onChange, size = 128, round = true }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await fileToSmallDataUrl(file, size));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const isData = value?.startsWith("data:");

  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition-all duration-200 ${
          dragging ? "drop-active border-transparent bg-primary-50 dark:bg-primary-500/10" : "border-gray-200 hover:border-primary-300 dark:border-[var(--border)]"
        }`}
      >
        <div
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-gray-50 ring-1 ring-black/5 dark:bg-white/5 ${
            round ? "rounded-full" : "rounded-2xl"
          }`}
        >
          {value ? (
            <img key={value.slice(-24)} src={value} alt="" className="pop-in h-full w-full object-cover" />
          ) : (
            <FiImage className="h-6 w-6 text-gray-300" />
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50"><span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></span>}
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-glow active:scale-95"
          >
            <FiUploadCloud className="h-3.5 w-3.5" /> {value ? "Replace" : "Upload"}
          </button>
          <p className="mt-1 text-[11px] text-gray-400">Drop an image here or browse. Resized automatically.</p>
          <div className="mt-1 flex gap-3 text-[11px]">
            <button type="button" onClick={() => setShowUrl((s) => !s)} className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-600">
              <FiLink className="h-3 w-3" /> Use a URL
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 text-gray-500 hover:text-danger-500">
                <FiTrash2 className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      {showUrl && (
        <input
          type="url"
          value={isData ? "" : value || ""}
          placeholder="https://example.com/logo.png"
          onChange={(e) => onChange(e.target.value.trim())}
          className="section-in mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-gray-100"
        />
      )}
      {error && <p className="mt-1.5 animate-fade-in text-xs text-danger-500">{error}</p>}
    </div>
  );
}
