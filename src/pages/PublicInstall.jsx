import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PUBLIC_API_BASE, WIDGET_URL } from "../config/widget.js";
import { buildSnippet } from "./chatbots/install/installUtils.js";
import InstallGuides from "./chatbots/install/InstallGuides.jsx";

// Public, no-login page a company sends to whoever manages its
// website: the one line to paste plus per-platform steps. Shows only
// the chatbot's and company's display names (GET /api/widget/install-info).
export default function PublicInstall() {
  const { chatbotId } = useParams();
  const [info, setInfo] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing

  useEffect(() => {
    let cancelled = false;
    fetch(`${PUBLIC_API_BASE}/api/widget/install-info/${encodeURIComponent(chatbotId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        if (body?.success) {
          setInfo(body.chatbot);
          setState("ready");
        } else setState("missing");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [chatbotId]);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">N</div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nuformly</span>
        </div>

        {state === "loading" && <p className="text-sm text-gray-500">Loading…</p>}

        {state === "missing" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[var(--border)] dark:bg-[var(--surface)]">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">This install link isn't valid</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              The chatbot may have been removed. Ask whoever sent you this link for a new one.
            </p>
          </div>
        )}

        {state === "ready" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card dark:border-[var(--border)] dark:bg-[var(--surface)]">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add the {info.name} chat to your website
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {info.companyName} uses Nuformly for its website chat. Paste the line below into the website once — the
              chat's look and answers are managed by {info.companyName}, so nothing else needs changing later.
            </p>
            <div className="mt-6">
              <InstallGuides snippet={buildSnippet({ widgetUrl: WIDGET_URL, chatbotId: info.id })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
