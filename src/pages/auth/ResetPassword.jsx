import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiCheck, FiAlertTriangle } from "react-icons/fi";
import { passwordResetApi, getErrorMessage } from "../../services/api.js";
import AuthLayout from "./AuthLayout.jsx";
import { checkPassword } from "../../config/accountRules.js";
import { PasswordField, Alert, SubmitButton } from "./fields.jsx";

/** /company/reset-password?token=… — the page the emailed link opens. */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | ready | invalid | done
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setStatus("invalid");
      return undefined;
    }
    passwordResetApi
      .get("/verify", { params: { token } })
      .then((r) => alive && setStatus(r.data?.valid ? "ready" : "invalid"))
      .catch(() => alive && setStatus("invalid"));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (status === "ready") ref.current?.focus();
  }, [status]);

  const errors = {
    password: checkPassword(password),
    confirm: !confirm ? "Type the same password again." : confirm !== password ? "The two passwords don't match." : "",
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (errors.password || errors.confirm) return;
    setError("");
    setLoading(true);
    try {
      await passwordResetApi.post("/reset", { token, password });
      setStatus("done");
    } catch (err) {
      const message = getErrorMessage(err);
      if (/invalid or has expired/i.test(message)) setStatus("invalid");
      else if (err?.response?.status === 400) {
        // a password rule the page can't check (e.g. built from your own name)
        setTouched({ password: true, confirm: true });
        setError(message);
      }
      else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      variant="recover"
      switcher={
        <p className="au-switch">
          <Link to="/company/login">Back to log in</Link>
        </p>
      }
    >
      {status === "checking" && (
        <div className="au-state" role="status">
          <span className="au-spinner is-dark" />
          <p className="au-sub">Checking your link…</p>
        </div>
      )}

      {status === "invalid" && (
        <div className="au-state au-in" role="alert">
          <div className="au-state-art" style={{ background: "linear-gradient(135deg,#ffedd5,#fed7aa)", color: "#b4490c" }}>
            <FiAlertTriangle />
          </div>
          <h1 className="au-display au-title">This link has expired</h1>
          <p className="au-sub">Reset links work once and only for 30 minutes. Request a fresh one and you&apos;ll be back in shortly.</p>
          <div style={{ marginTop: 26 }}>
            <Link to="/company/forgot-password" className="au-btn">
              Send me a new link
            </Link>
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="au-state au-in" role="status">
          <div className="au-state-art">
            <FiCheck />
          </div>
          <h1 className="au-display au-title">Password updated</h1>
          <p className="au-sub">You&apos;ve been signed out of other devices. Log in with your new password.</p>
          <div style={{ marginTop: 26 }}>
            <button type="button" className="au-btn" onClick={() => navigate("/company/login", { replace: true, state: { notice: "Password updated — log in with your new password." } })}>
              Go to log in
            </button>
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="au-in">
          <h1 className="au-display au-title">Choose a new password</h1>
          <p className="au-sub">Make it something you haven&apos;t used here before.</p>
          <form className="au-form" onSubmit={submit} noValidate>
            {error && <Alert>{error}</Alert>}
            <PasswordField
              ref={ref}
              id="password"
              label="New password"
              icon={FiLock}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Create a password"
              maxLength={72}
              error={touched.password ? errors.password : ""}
              rules
            />
            <PasswordField
              id="confirm"
              label="Confirm new password"
              icon={FiLock}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder="Type it again"
              maxLength={72}
              error={touched.confirm ? errors.confirm : ""}
              valid={touched.confirm && !errors.confirm}
            />
            <SubmitButton loading={loading} loadingText="Saving…">
              Save new password
            </SubmitButton>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
