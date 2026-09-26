import { useEffect, useState } from "react";
import { FiPlus, FiLink, FiSend } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import DeveloperTabs from "./DeveloperTabs.jsx";
import DeveloperCompanyPicker from "./DeveloperCompanyPicker.jsx";
import WebhookFormModal from "./WebhookFormModal.jsx";
import { useDeveloperCompany } from "./useDeveloperCompany.js";

export default function WebhooksPage() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useDeveloperCompany();

  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const canCreate = can(me?.role, PERMISSIONS.DEVELOPER_WEBHOOKS_CREATE);
  const canUpdate = can(me?.role, PERMISSIONS.DEVELOPER_WEBHOOKS_UPDATE);
  const canDelete = can(me?.role, PERMISSIONS.DEVELOPER_WEBHOOKS_DELETE);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/developer/webhooks", { params: { companyId } })
      .then((res) => {
        setWebhooks(res.data.webhooks);
        setAvailableEvents(res.data.availableEvents);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  const toggleStatus = async (webhook) => {
    setBusy(webhook._id);
    try {
      await api.patch(`/developer/webhooks/${webhook._id}`, { status: webhook.status === "ACTIVE" ? "DISABLED" : "ACTIVE" });
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const test = async (webhook) => {
    setBusy(webhook._id);
    setTestResult(null);
    try {
      const res = await api.post(`/developer/webhooks/${webhook._id}/test`);
      setTestResult({ id: webhook._id, ...res.data.result });
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id) => {
    setBusy(id);
    try {
      await api.delete(`/developer/webhooks/${id}`);
      showToast("Webhook deleted.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Subscribe an external endpoint to real-time Nuformly events."
        action={
          <div className="flex items-center gap-2">
            <DeveloperCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />
            {canCreate && companyId && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <FiPlus /> Create Webhook
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4">
        <DeveloperTabs />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {(loading || loadingCompanies) && <SkeletonTable />}
        {!loading && !loadingCompanies && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !loadingCompanies && !error && !companyId && <EmptyState icon={FiLink} title="No company selected." />}
        {!loading && !loadingCompanies && !error && companyId && webhooks.length === 0 && (
          <EmptyState icon={FiLink} title="No webhooks yet." description="Create one to receive real-time events." />
        )}

        {!loading && !error && webhooks.length > 0 && (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {webhooks.map((w) => (
              <div key={w._id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{w.name}</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{w.url}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {w.events.map((e) => (
                        <span key={e} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                          {e}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      {w.lastDeliveryAt
                        ? `Last delivery: ${new Date(w.lastDeliveryAt).toLocaleString()} (HTTP ${w.lastStatusCode ?? "—"})`
                        : "Never delivered."}
                      {w.failureCount > 0 && <span className="ml-2 text-danger-500">{w.failureCount} consecutive failures</span>}
                    </p>
                    {testResult?.id === w._id && (
                      <p className={`mt-1 text-xs ${testResult.ok ? "text-success-600" : "text-danger-500"}`}>
                        {testResult.ok
                          ? `Test succeeded — HTTP ${testResult.statusCode} in ${testResult.latencyMs}ms`
                          : `Test failed — ${testResult.error || `HTTP ${testResult.statusCode}`}`}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {canUpdate && (
                      <Button variant="secondary" onClick={() => test(w)} loading={busy === w._id}>
                        <FiSend className="h-3.5 w-3.5" /> Test
                      </Button>
                    )}
                    {canUpdate && (
                      <Button variant="secondary" onClick={() => toggleStatus(w)} loading={busy === w._id}>
                        {w.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditing(w);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="danger"
                        onClick={() =>
                          setConfirm({
                            title: "Delete Webhook?",
                            message: `"${w.name}" will stop receiving events. This cannot be undone.`,
                            action: () => remove(w._id),
                          })
                        }
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WebhookFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        companyId={companyId}
        webhook={editing}
        availableEvents={availableEvents}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        loading={!!busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
      />
    </div>
  );
}
