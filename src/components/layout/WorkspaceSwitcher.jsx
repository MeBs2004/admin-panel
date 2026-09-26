import { useEffect, useState } from "react";
import { FiChevronDown, FiCheck, FiCpu } from "react-icons/fi";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STORAGE_KEY = "nuformly-workspace";
const ALL_OPTION = { companyId: "__all__", name: "All Companies" };

/**
 * Company/workspace switcher. Real company data (scoped server-side
 * exactly like every other page — SUPER_ADMIN sees all, others see
 * only their assigned companies). The selection is currently
 * display-only and stored client-side: no existing page filters its
 * data by this yet (that would be a backend/API change, out of
 * scope for this shell phase — see ADMIN_ARCHITECTURE.md).
 */
export default function WorkspaceSwitcher({ collapsed }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [chatbotCount, setChatbotCount] = useState(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => {
        const list = res.data.companies || [];
        setCompanies(list);
        if (!selected && list.length) {
          const initial = user?.role === "SUPER_ADMIN" ? ALL_OPTION.companyId : list[0].companyId;
          setSelected(initial);
        }
      })
      .catch(() => setCompanies([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(STORAGE_KEY, selected);
    } catch {
      // ignore storage failures (private mode etc.)
    }

    if (selected === ALL_OPTION.companyId) {
      setChatbotCount(null);
      return;
    }

    api
      .get("/chatbots", { params: { companyId: selected, limit: 1 } })
      .then((res) => setChatbotCount(res.data.pagination?.total ?? res.data.chatbots?.length ?? 0))
      .catch(() => setChatbotCount(null));
  }, [selected]);

  const options = user?.role === "SUPER_ADMIN" ? [ALL_OPTION, ...companies] : companies;
  const current =
    options.find((c) => c.companyId === selected) ||
    (options.length ? options[0] : null);

  if (options.length === 0) return null;

  if (collapsed) {
    return (
      <div
        className="mx-2 mb-2 flex h-9 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-white/5"
        title={current?.name}
      >
        <FiCpu className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="relative mx-2 mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:border-[var(--border)] dark:bg-white/5 dark:hover:bg-white/10"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
            {current?.name || "Select workspace"}
          </p>
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
            {chatbotCount === null
              ? current?.companyId === ALL_OPTION.companyId
                ? "All workspaces"
                : " "
              : `${chatbotCount} chatbot${chatbotCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <FiChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 origin-top animate-scale-in overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]">
            {options.map((c) => (
              <button
                key={c.companyId}
                onClick={() => {
                  setSelected(c.companyId);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
              >
                <span className="truncate">{c.name}</span>
                {c.companyId === selected && (
                  <FiCheck className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
