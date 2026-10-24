import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMail, FiArrowLeft, FiSend } from "react-icons/fi";
import { passwordResetApi, getErrorMessage } from "../../services/api.js";
import AuthLayout from "./AuthLayout.jsx";
import { checkEmail, normalizeEmail } from "../../config/accountRules.js";
import { Field, Alert, SubmitButton, EmailSuggestion, suggestEmail } from "./fields.jsx";

const RESEND_AFTER = 30; // seconds

/** /company/forgot-password — asks for the email, then "check your inbox". */
export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const ref = useRef(null);

  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    if (!wait) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const emailError = touched ? checkEmail(email) : "";
  const suggestion = !checkEmail(email) && suggestEmail(normalizeEmail(email));

  const send = async (e) => {
    e?.preventDefault();
    setTouched(true);
    if (checkEmail(email)) return ref.current?.focus();
    setError("");
    setLoading(true);
    try {
      await passwordResetApi.post("/forgot", { email: normalizeEmail(email) });
      setSent(true);
      setWait(RESEND_AFTER);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      variant="recover"
      switcher={
        <p className="au-switch">
          <span className="au-switch-q">Remembered it?</span> <Link to="/company/login">Log in</Link>
        </p>
      }
    >
      {sent ? (
        <div className="au-state au-in" role="status">
          <div className="au-state-art">
            <FiSend />
          </div>
          <h1 className="au-display au-title">Check your inbox</h1>
          <p className="au-sub">
            If <b>{normalizeEmail(email)}</b> has a Nuformly account, we&apos;ve sent a link to reset your password. It works once and expires in 30 minutes.
          </p>
          <p className="au-hint" style={{ marginTop: 14 }}>
            Not there? Check your spam folder, or{" "}
            {wait ? (
              <span>send it again in {wait}s</span>
            ) : (
              <button type="button" onClick={() => send()} disabled={loading}>
                {loading ? "sending…" : "send it again"}
              </button>
            )}
            .
          </p>
          {error && (
            <div style={{ marginTop: 14 }}>
              <Alert>{error}</Alert>
            </div>
          )}
          <div style={{ marginTop: 26 }}>
            <Link to="/company/login" state={{ email: normalizeEmail(email) }} className="au-btn au-btn-ghost">
              <FiArrowLeft /> Back to log in
            </Link>
          </div>
          <p className="au-hint" style={{ marginTop: 16 }}>
            Wrong email?{" "}
            <button type="button" onClick={() => setSent(false)}>
              Use a different one
            </button>
          </p>
        </div>
      ) : (
        <div className="au-in">
          <Link to="/company/login" className="au-back" style={{ marginBottom: 18 }}>
            <FiArrowLeft /> Back to log in
          </Link>
          <h1 className="au-display au-title">Forgot your password?</h1>
          <p className="au-sub">Enter the email you use for Nuformly and we&apos;ll send you a link to choose a new one.</p>
          <form className="au-form" onSubmit={send} noValidate>
            {error && <Alert>{error}</Alert>}
            <Field
              ref={ref}
              id="email"
              label="Work email"
              icon={FiMail}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@company.com"
              maxLength={254}
              error={emailError}
              valid={touched && !emailError}
              hint={suggestion ? <EmailSuggestion suggestion={suggestion} onAccept={setEmail} /> : null}
            />
            <SubmitButton loading={loading} loadingText="Sending…">
              Send reset link
            </SubmitButton>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
