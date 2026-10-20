import { createContext, useCallback, useContext, useState } from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const ToastContext = createContext(null);

let idCounter = 0;
const EXIT_MS = 180;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Two-step removal: mark `leaving` first so the exit transition can
  // play, then actually drop it from the array once that transition
  // has had time to finish. Removing it from state immediately would
  // unmount the DOM node before any exit animation could run.
  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`relative cursor-pointer overflow-hidden rounded-xl border px-4 py-3 pl-5 text-sm shadow-lift backdrop-blur transition-all duration-200 ease-out ${
              t.leaving ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100 animate-fade-in-up"
            } ${
              t.type === "error"
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-300"
                : "bg-white border-gray-200 text-gray-800 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
            }`}
          >
            <span
              className={`absolute inset-y-0 left-0 w-1.5 ${t.type === "error" ? "bg-gradient-to-b from-rose-400 to-red-500" : "bg-gradient-to-b from-emerald-400 to-teal-500"}`}
            />
            <span className="flex items-start gap-2.5">
              {t.type === "error" ? (
                <FiAlertCircle className="pop-in mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <FiCheckCircle className="pop-in mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              )}
              <span>{t.message}</span>
            </span>
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${t.type === "error" ? "bg-red-400/70" : "bg-emerald-400/70"}`}
              style={{ animation: "toastLife 4s linear forwards" }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
