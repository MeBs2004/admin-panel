import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";

// Phase 6 — checkbox dependencies: checking any action auto-checks
// the feature's own base/view permission (you can't grant "Create"
// without "View"); unchecking the base permission clears every action
// under it. Pure client-side normalization — the backend independently
// re-validates the final permissions array against the real registry
// regardless of what this produces.
function toggleBase(selected, feature, checked) {
  const next = new Set(selected);
  if (checked) {
    next.add(feature.permission);
  } else {
    next.delete(feature.permission);
    for (const action of feature.actions || []) next.delete(action.permission);
  }
  return next;
}

function toggleAction(selected, feature, action, checked) {
  const next = new Set(selected);
  if (checked) {
    next.add(action.permission);
    next.add(feature.permission);
  } else {
    next.delete(action.permission);
  }
  return next;
}

export default function RoleFormModal({ open, onClose, onSaved, companyId, role, features }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(role?.name || "");
    setDescription(role?.description || "");
    setSelected(new Set(role?.permissions || []));
    setError("");
  }, [open, role]);

  const setCategorySelection = (category, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const feature of category.items) {
        if (checked) {
          next.add(feature.permission);
          for (const action of feature.actions || []) next.add(action.permission);
        } else {
          next.delete(feature.permission);
          for (const action of feature.actions || []) next.delete(action.permission);
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { name: name.trim(), description, permissions: [...selected] };
      if (role) {
        await api.patch(`/roles/${role._id}`, payload);
        showToast("Role updated.");
      } else {
        await api.post("/roles", { ...payload, companyId });
        showToast("Role created.");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={role ? "Edit Role" : "Create Role"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {role ? "Save Changes" : "Create Role"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Role Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SEO Manager" />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Feature Access</h3>
            <span className="text-xs text-gray-400">{selected.size} permission{selected.size === 1 ? "" : "s"} selected</span>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-[var(--border)]">
            {features.map((category) => {
              const categoryPerms = category.items.flatMap((f) => [f.permission, ...(f.actions || []).map((a) => a.permission)]);
              const allSelected = categoryPerms.every((p) => selected.has(p));
              return (
                <div key={category.category} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-white/5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{category.category}</span>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        disabled={allSelected}
                        onClick={() => setCategorySelection(category, true)}
                        className="text-primary-600 hover:underline disabled:text-gray-300 disabled:no-underline dark:text-primary-400 dark:disabled:text-gray-600"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategorySelection(category, false)}
                        className="text-gray-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {category.items.map((feature) => (
                      <div key={feature.id}>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={selected.has(feature.permission)}
                            onChange={(e) => setSelected(toggleBase(selected, feature, e.target.checked))}
                            className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                          />
                          {feature.label}
                        </label>
                        {feature.actions && feature.actions.length > 0 && (
                          <div className="ml-6 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            {feature.actions.map((action) => (
                              <label key={action.id} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <input
                                  type="checkbox"
                                  disabled={!selected.has(feature.permission)}
                                  checked={selected.has(action.permission)}
                                  onChange={(e) => setSelected(toggleAction(selected, feature, action, e.target.checked))}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400 disabled:opacity-40"
                                />
                                {action.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
