import { createContext, useCallback, useContext, useState } from "react";

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
            className={`cursor-pointer rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-200 ease-out ${
              t.leaving ? "translate-x-2 opacity-0" : "translate-x-0 opacity-100 animate-fade-in-up"
            } ${
              t.type === "error"
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-300"
                : "bg-white border-gray-200 text-gray-800 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
