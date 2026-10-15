import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same login() call as the staff Login page — one backend, one
// AdminUser model, one JWT mechanism. This page exists only to give
// companies a clearly-branded, separate entry point, per the product
// requirement to distinguish platform administration from company
// access. A company user signing in here lands in the new minimal
// Company Admin Panel (/company/overview) rather than the full
// staff shell.
export default function CompanyLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const redirectTo = location.state?.from || "/company/overview";
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="mb-4 text-center text-xs font-medium">
          <Link to="/login" className="text-gray-400 hover:underline dark:text-gray-500">
            Staff / Platform Admin login
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white shadow-glow">
            N
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Nuformly
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Company Login
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Sign in to your company
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[34px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {error && (
              <p className="animate-fade-in-up rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            New company?{" "}
            <Link to="/company/signup" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
