import { FiAlertTriangle } from "react-icons/fi";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {variant === "danger" && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-500 dark:bg-danger-500/10">
            <FiAlertTriangle className="h-4 w-4" />
          </span>
        )}
        <p className="pt-1.5 text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </Modal>
  );
}
