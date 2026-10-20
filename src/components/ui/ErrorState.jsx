import { FiAlertTriangle } from "react-icons/fi";
import Button from "./Button.jsx";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex animate-fade-in-up flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="pop-in flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-orange-100 text-danger-500 ring-1 ring-danger-500/20 dark:from-danger-500/15 dark:to-orange-500/10">
        <FiAlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-danger-600 dark:text-danger-500">
        {message || "Something went wrong."}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
