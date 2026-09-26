import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invitationsApi, getErrorMessage } from "../services/api.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    invitationsApi
      .get(`/${token}`)
      .then((res) => {
        setInvitation(res.data.invitation);
        setName(res.data.invitation.name || "");
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!name.trim()) return setSubmitError("Name is required.");
    if (password.length < 8) return setSubmitError("Password must be at least 8 characters.");

    setSubmitting(true);
    try {
      await invitationsApi.post(`/${token}/accept`, { name, password });
      setDone(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nuformly</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">You've been invited to join a team.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card-hover dark:bg-[var(--surface)] dark:border-[var(--border)]">
          {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Checking invitation...</p>}

          {!loading && loadError && (
            <div>
              <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
                {loadError}
              </p>
              <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
            </div>
          )}

          {!loading && !loadError && done && (
            <div>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                Account created. You can now log in with {invitation?.email}.
              </p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            </div>
          )}

          {!loading && !loadError && !done && invitation && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Join {invitation.companyAccess.map((c) => c.companyName).join(", ") || "Nuformly"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {invitation.email} — {invitation.role.replaceAll("_", " ")}
                </p>
              </div>

              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />

              {submitError && (
                <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600 dark:bg-red-950 dark:text-red-300">
                  {submitError}
                </p>
              )}

              <Button type="submit" loading={submitting} className="w-full">
                Create Account
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
