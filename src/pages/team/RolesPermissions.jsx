import { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { PERMISSIONS, getPermissionsForRole, can } from "../../utils/permissions.js";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Button from "../../components/ui/Button.jsx";
import Select from "../../components/ui/Select.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Modal from "../../components/ui/Modal.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonLine } from "../../components/ui/Skeleton.jsx";
import RoleFormModal from "./RoleFormModal.jsx";

const SYSTEM_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT", "VIEWER", "DEVELOPER"];

const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: "Platform-level administration — every company, every chatbot, platform configuration.",
  COMPANY_ADMIN: "Full administration of the companies they belong to: users, chatbots, access, knowledge, integrations.",
  AGENT: "Operational: reply to visitors, take over and close conversations. Cannot manage users or credentials.",
  VIEWER: "Read-only access to everything they can see. Cannot reply, take over, or change any configuration.",
  DEVELOPER: "Technical scope: channels and integrations (e.g. webhooks). No user, billing, or platform administration.",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export default function RolesPermissions() {
  const { user: me } = useAuth();
  const { showToast } = useToast();

  const canManageRoles = can(me?.role, PERMISSIONS.ROLES_CREATE) || me?.role === "SUPER_ADMIN";

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [features, setFeatures] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replacementRole, setReplacementRole] = useState("");
  const [deleteBlocked, setDeleteBlocked] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/companies", { params: { limit: 100 } })
      .then((res) => {
        const list = res.data.companies || [];
        setCompanies(list);
        if (list.length && !companyId) setCompanyId(list[0].companyId);
      })
      .catch(() => setCompanies([]));
    api
      .get("/features")
      .then((res) => setFeatures(res.data.features || []))
      .catch(() => setFeatures([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRoles = () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    api
      .get("/roles", { params: { companyId } })
      .then((res) => setRoles(res.data.roles || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadRoles, [companyId]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/roles/${deleteTarget._id}`, { data: replacementRole ? { replacementRole } : {} });
      showToast("Role deleted.");
      setDeleteTarget(null);
      setDeleteBlocked(null);
      setReplacementRole("");
      loadRoles();
    } catch (err) {
      if (err.response?.data?.code === "ROLE_IN_USE") {
        setDeleteBlocked(err.response.data.message);
      } else {
        showToast(getErrorMessage(err), "error");
        setDeleteTarget(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const replacementOptions = [
    { value: "COMPANY_ADMIN", label: "Company Admin" },
    { value: "AGENT", label: "Agent" },
    { value: "VIEWER", label: "Viewer" },
    { value: "DEVELOPER", label: "Developer" },
    ...roles.filter((r) => r._id !== deleteTarget?._id).map((r) => ({ value: r._id, label: r.name })),
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="System roles are fixed and enforced by the backend. Custom roles let you grant a precise, company-scoped set of permissions."
      />

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">System Roles</h2>
        {SYSTEM_ROLES.map((role) => {
          const granted = new Set(role === "SUPER_ADMIN" ? ALL_PERMISSIONS : getPermissionsForRole(role));
          return (
            <div
              key={role}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]"
            >
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {role.replaceAll("_", " ")}
              </h3>
              <p className="mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                {ROLE_DESCRIPTIONS[role]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role === "SUPER_ADMIN" ? (
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                    All permissions
                  </span>
                ) : (
                  ALL_PERMISSIONS.map((perm) => (
                    <span
                      key={perm}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        granted.has(perm)
                          ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                          : "bg-gray-100 text-gray-400 line-through dark:bg-white/5 dark:text-gray-600"
                      }`}
                    >
                      {perm}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Custom Roles</h2>
        <div className="flex items-center gap-2">
          <div className="w-52">
            <Select
              options={companies.map((c) => ({ value: c.companyId, label: c.name }))}
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          </div>
          {canManageRoles && (
            <Button
              onClick={() => {
                setEditingRole(null);
                setShowForm(true);
              }}
              disabled={!companyId}
            >
              <FiPlus /> Create Role
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
        {loading && (
          <div className="space-y-2 p-5">
            <SkeletonLine className="h-5 w-full" />
            <SkeletonLine className="h-5 w-full" />
          </div>
        )}
        {!loading && error && <p className="p-5 text-sm text-danger-500">{error}</p>}
        {!loading && !error && roles.length === 0 && (
          <EmptyState
            title="No custom roles for this company"
            description="Create a role to define access beyond the fixed system roles."
          />
        )}
        {!loading && !error && roles.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {roles.map((role) => (
              <div key={role._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{role.name}</p>
                  <p className="text-xs text-gray-400">
                    {role.description || "No description"} · {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                  </p>
                </div>
                {canManageRoles && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setShowForm(true);
                      }}
                      className="text-gray-400 hover:text-primary-500"
                      aria-label="Edit"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      className="text-gray-400 hover:text-danger-500"
                      aria-label="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <RoleFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={loadRoles}
        companyId={companyId}
        role={editingRole}
        features={features}
      />

      <ConfirmDialog
        open={!!deleteTarget && !deleteBlocked}
        title="Delete Role?"
        message={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <Modal
        open={!!deleteBlocked}
        onClose={() => {
          setDeleteBlocked(null);
          setDeleteTarget(null);
          setReplacementRole("");
        }}
        title="Role In Use"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteBlocked(null);
                setDeleteTarget(null);
                setReplacementRole("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} loading={busy} disabled={!replacementRole}>
              Move Users & Delete
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{deleteBlocked}</p>
        <Select
          label="Replacement role"
          options={[{ value: "", label: "Select a replacement..." }, ...replacementOptions]}
          value={replacementRole}
          onChange={(e) => setReplacementRole(e.target.value)}
        />
      </Modal>

      <p className="mt-4 text-xs text-gray-400">
        Custom roles are company-scoped: they apply only within the company they were created for. Every grant is
        re-validated server-side — you can never create a role that grants a permission you don't already have
        yourself.
      </p>
    </div>
  );
}
