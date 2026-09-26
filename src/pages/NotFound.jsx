import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        404 — Not Found
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Resource not found.
      </p>
      <Link to="/dashboard" className="mt-3 text-sm text-primary-500 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
