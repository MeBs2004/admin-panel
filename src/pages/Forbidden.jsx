import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        403 — Forbidden
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You don't have permission to access this resource.
      </p>
      <Link to="/dashboard" className="mt-3 text-sm text-primary-500 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
