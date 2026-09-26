import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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

    const redirectTo = location.state?.from || "/dashboard";
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-400/5"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white shadow-glow">
            N
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Nuformly
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI Chatbot Management Platform
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded"
                />
                Remember me
              </label>
              <span className="cursor-not-allowed text-gray-400" title="Coming soon">
                Forgot password?
              </span>
            </div>

            {error && (
              <p className="animate-fade-in-up rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
