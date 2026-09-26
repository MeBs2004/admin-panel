import { useEffect, useState } from "react";
import { FiPlus, FiKey, FiCopy } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { can, PERMISSIONS } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { SkeletonTable } from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import DeveloperTabs from "./DeveloperTabs.jsx";
import DeveloperCompanyPicker from "./DeveloperCompanyPicker.jsx";
import CreateApiKeyModal from "./CreateApiKeyModal.jsx";
import { useDeveloperCompany } from "./useDeveloperCompany.js";

export default function ApiKeysPage() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const { companies, companyId, selectCompany, loading: loadingCompanies } = useDeveloperCompany();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newSecret, setNewSecret] = useState(null);

  const canCreate = can(me?.role, PERMISSIONS.DEVELOPER_KEYS_CREATE);
  const canRotate = can(me?.role, PERMISSIONS.DEVELOPER_KEYS_ROTATE);
  const canRevoke = can(me?.role, PERMISSIONS.DEVELOPER_KEYS_REVOKE);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/developer/api-keys", { params: { companyId } })
      .then((res) => setKeys(res.data.apiKeys))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [companyId]);

  const rotate = async (id) => {
    setBusy(true);
    try {
      const res = await api.post(`/developer/api-keys/${id}/rotate`);
      setNewSecret(res.data.token);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const revoke = async (id) => {
    setBusy(true);
    try {
      await api.post(`/developer/api-keys/${id}/revoke`);
      showToast("API key revoked.");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const copySecret = () => {
    navigator.clipboard?.writeText(newSecret);
    showToast("API key copied.");
  };

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Credentials for external applications to call the Nuformly Developer API."
        action={
          <div className="flex items-center gap-2">
            <DeveloperCompanyPicker companies={companies} companyId={companyId} onChange={selectCompany} />
            {canCreate && companyId && (
              <Button onClick={() => setShowCreate(true)}>
                <FiPlus /> Create API Key
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
        {!loading && !loadingCompanies && !error && !companyId && (
          <EmptyState icon={FiKey} title="No company selected." />
        )}
        {!loading && !loadingCompanies && !error && companyId && keys.length === 0 && (
          <EmptyState icon={FiKey} title="No API keys yet." description="Create one to start integrating with Nuformly." />
        )}

        {!loading && !error && keys.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-[var(--border)] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Prefix</th>
                  <th className="px-4 py-3 font-medium">Scopes</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Used</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k._id} className="border-b border-gray-50 dark:border-white/5">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{k.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-500 dark:text-gray-400">{k.keyPrefix}...</code>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span key={s} className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={k.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {k.status === "ACTIVE" && (
                        <div className="flex gap-2">
                          {canRotate && (
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setConfirm({
                                  title: "Rotate API Key?",
                                  message: `A new secret will be generated for "${k.name}". The current secret will stop working immediately.`,
                                  confirmLabel: "Rotate",
                                  action: () => rotate(k._id),
                                })
                              }
                            >
                              Rotate
                            </Button>
                          )}
                          {canRevoke && (
                            <Button
                              variant="danger"
                              onClick={() =>
                                setConfirm({
                                  title: "Revoke API Key?",
                                  message: `"${k.name}" will stop working immediately. This cannot be undone.`,
                                  confirmLabel: "Revoke",
                                  action: () => revoke(k._id),
                                })
                              }
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateApiKeyModal open={showCreate} onClose={() => setShowCreate(false)} companyId={companyId} onSaved={load} />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
      />

      <Modal
        open={!!newSecret}
        onClose={() => setNewSecret(null)}
        title="New API Key Secret"
        footer={<Button onClick={() => setNewSecret(null)}>Done</Button>}
      >
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          This secret will not be shown again — copy it now.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-white/10 dark:text-gray-100">
            {newSecret}
          </code>
          <Button variant="secondary" onClick={copySecret}>
            <FiCopy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Modal>
    </div>
  );
}
