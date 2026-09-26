import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiPlus, FiX, FiCpu } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import Input from "../../components/ui/Input.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import AssignAccessModal from "./AssignAccessModal.jsx";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "LIVE", label: "Live" },
  { value: "PAUSED", label: "Paused" },
  { value: "OFFLINE", label: "Offline" },
];

export default function ChatbotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/chatbots/${id}`)
      .then((res) => {
        setData(res.data);
        setName(res.data.chatbot.name);
        setModel(res.data.chatbot.model);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      await api.patch(`/chatbots/${id}`, { status });
      showToast(`Chatbot set to ${status}.`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const saveConfig = async () => {
    setBusy(true);
    try {
      await api.patch(`/chatbots/${id}`, { name, model });
      showToast("Chatbot configuration saved.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const removeAccess = async (userId) => {
    try {
      await api.delete(`/chatbots/${id}/access/${userId}`);
      showToast("Access removed.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-32 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const { chatbot, company, access } = data;

  const isLive = chatbot.status === "LIVE";

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-500 transition-shadow dark:bg-primary-500/10 dark:text-primary-300 ${
                isLive ? "shadow-glow" : ""
              }`}
            >
              <FiCpu className="h-4 w-4" />
            </span>
            {chatbot.name}
          </span>
        }
        description={company?.name}
        breadcrumbs={[{ label: "Chatbots", to: "/chatbots" }, { label: chatbot.name }]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/chatbots")}>
              Back to Chatbots
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}/ai-settings`)}>
              AI Settings
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}/knowledge`)}>
              Knowledge Base
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}/install`)}>
              Installation
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}/channels`)}>
              Channels
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/chatbots/${id}/builder`)}>
              Bot Builder
            </Button>
            <Button onClick={() => navigate(`/chatbots/${id}/customize`)}>
              Customize
            </Button>
          </div>
        }
      />

      <div className="animate-fade-in-up rounded-xl border border-gray-200 bg-white shadow-card dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <Tabs
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "configuration", label: "Configuration" },
            { value: "access", label: "Access" },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="p-5">
          {tab === "overview" && (
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <StatusBadge status={chatbot.status} />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Model</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {chatbot.model}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Company</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {company?.name}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(chatbot.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          )}

          {tab === "configuration" && (
            <div className="max-w-md space-y-4">
              <Input label="Bot Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={chatbot.status}
                disabled={busy}
                onChange={(e) => changeStatus(e.target.value)}
              />
              <Button onClick={saveConfig} loading={busy}>
                Save Changes
              </Button>
            </div>
          )}

          {tab === "access" && (
            <div>
              <div className="mb-3 flex justify-end">
                <Button onClick={() => setShowAssign(true)}>
                  <FiPlus /> Assign User
                </Button>
              </div>

              {access.length === 0 ? (
                <EmptyState
                  title="No users assigned."
                  description="Assign a user to this chatbot to grant them access."
                />
              ) : (
                <ul className="space-y-2">
                  {access.map((a, i) => (
                    <li
                      key={a._id}
                      className="stagger-in flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                      style={{ "--stagger-index": i }}
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {a.user?.name || "Unknown user"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {a.user?.role?.replaceAll("_", " ")}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAccess(a.userId)}
                        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-red-950/30"
                        aria-label="Remove access"
                      >
                        <FiX />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <AssignAccessModal
        open={showAssign}
        chatbotId={id}
        onClose={() => setShowAssign(false)}
        onSaved={load}
      />
    </div>
  );
}
