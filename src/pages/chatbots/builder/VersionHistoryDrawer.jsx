import { useState } from "react";
import { FiRotateCcw } from "react-icons/fi";
import Drawer from "../../../components/ui/Drawer.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import ConfirmDialog from "../../../components/ui/ConfirmDialog.jsx";

// Phase: Bot Builder hardening — the backend has always supported
// full version history + rollback-to-any-archived-version
// (flow.service.js), but no frontend ever surfaced it. This is the
// first UI onto GET /:id/flow/versions and POST /:id/flow/rollback.
export default function VersionHistoryDrawer({ open, onClose, versions, onRollback, rollingBack }) {
  const [confirmVersion, setConfirmVersion] = useState(null);

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Version History">
        {versions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No published versions yet — publish your draft to start building history.
          </p>
        ) : (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v._id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-sm dark:border-white/5"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Version {v.version}</p>
                  <p className="text-xs text-gray-400">
                    {v.publishedAt ? new Date(v.publishedAt).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.status} />
                  {v.status === "ARCHIVED" && (
                    <button
                      onClick={() => setConfirmVersion(v.version)}
                      className="text-gray-400 hover:text-primary-500"
                      aria-label={`Roll back to version ${v.version}`}
                      title="Roll back to this version"
                    >
                      <FiRotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmVersion !== null}
        title="Roll back published flow?"
        message={`Version ${confirmVersion} will become the live published flow immediately, replacing the current published version. Your draft (unpublished edits) is not affected.`}
        confirmLabel="Roll Back"
        loading={rollingBack}
        onCancel={() => setConfirmVersion(null)}
        onConfirm={async () => {
          await onRollback(confirmVersion);
          setConfirmVersion(null);
        }}
      />
    </>
  );
}
