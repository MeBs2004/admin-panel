import { FiAlertTriangle } from "react-icons/fi";
import Button from "./Button.jsx";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex animate-fade-in-up flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-500 dark:bg-danger-500/10">
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
