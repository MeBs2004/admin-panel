import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiArrowLeft, FiSend, FiLock, FiShield, FiCheck } from "react-icons/fi";
import { passwordResetApi, getErrorMessage } from "../../services/api.js";
import AuthLayout from "./AuthLayout.jsx";
import { checkEmail, checkPassword, normalizeEmail } from "../../config/accountRules.js";
import { Field, PasswordField, Alert, SubmitButton, EmailSuggestion, suggestEmail } from "./fields.jsx";

const RESEND_AFTER = 30; // seconds

/**
 * /company/forgot-password — asks for the email, then either:
 *  - the emailed link (opens ResetPassword.jsx in a new tab), or
 *  - the emailed 6-digit code, entered right here.
 * Both come from the same email and both work once.
 */
export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // "ask" the email · "sent" check your inbox (link or code) · "code" enter
  // the code · "newpass" choose a new password (code already checked) ·
  // "done" password changed via the code
  const [view, setView] = useState("ask");
  const [wait, setWait] = useState(0);
  const ref = useRef(null);

  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwTouched, setPwTouched] = useState({});
  const codeRef = useRef(null);
  const pwRef = useRef(null);

  useEffect(() => {
    if (view === "ask") ref.current?.focus();
    if (view === "code") codeRef.current?.focus();
    if (view === "newpass") pwRef.current?.focus();
  }, [view]);
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
      setView("sent");
      setWait(RESEND_AFTER);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const pwErrors = {
    password: checkPassword(password),
    confirm: !confirm ? "Type the same password again." : confirm !== password ? "The two passwords don't match." : "",
  };

  // Step 1 of the code path: just checks the code (doesn't spend it —
  // see verifyResetCode on the backend), then moves to the password step.
  const verifyCode = async (e) => {
    e.preventDefault();
    setCodeTouched(true);
    if (!/^\d{6}$/.test(code)) return codeRef.current?.focus();
    setCodeError("");
    setLoading(true);
    try {
      await passwordResetApi.post("/verify-code", { email: normalizeEmail(email), code });
      setView("newpass");
    } catch (err) {
      const data = err?.response?.data;
      const message = getErrorMessage(err);
      if (data?.field === "code") setCodeError(message);
      else if (data?.field === "email") {
        setView("ask");
        setError(message);
      } else setCodeError(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: the code was already checked — this is the real,
  // code-consuming call that actually sets the new password.
  const submitCode = async (e) => {
    e.preventDefault();
    setPwTouched({ password: true, confirm: true });
    if (pwErrors.password || pwErrors.confirm) return;
    setError("");
    setLoading(true);
    try {
      await passwordResetApi.post("/reset-with-code", { email: normalizeEmail(email), code, password });
      setView("done");
    } catch (err) {
      const data = err?.response?.data;
      const message = getErrorMessage(err);
      if (data?.field === "code") {
        // The code expired or got used elsewhere between the two steps —
        // back to entering it, with the reason shown there.
        setView("code");
        setCode("");
        setCodeTouched(false);
        setCodeError(message);
      } else if (data?.field === "password") setError(message);
      else if (data?.field === "email") {
        setView("ask");
        setError(message);
      } else setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      variant="recover"
      switcher={
        view !== "done" && (
          <p className="au-switch">
            <span className="au-switch-q">Remembered it?</span> <Link to="/company/login">Log in</Link>
          </p>
        )
      }
    >
      {view === "done" && (
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

      {view === "code" && (
        <div className="au-in">
          <button type="button" className="au-back" style={{ marginBottom: 18 }} onClick={() => setView("sent")}>
            <FiArrowLeft aria-hidden="true" /> Back
          </button>
          <h1 className="au-display au-title">Enter your code</h1>
          <p className="au-sub">
            Type the 6-digit code we emailed to <b>{normalizeEmail(email)}</b>.
          </p>
          <form className="au-form" onSubmit={verifyCode} noValidate>
            <Field
              ref={codeRef}
              id="reset-code"
              name="one-time-code"
              label="Verification code"
              icon={FiShield}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (codeError) setCodeError("");
              }}
              onBlur={() => setCodeTouched(true)}
              error={codeTouched && !/^\d{6}$/.test(code) ? "Enter the 6-digit code from your email." : codeError}
              valid={codeTouched && /^\d{6}$/.test(code) && !codeError}
            />
            <SubmitButton loading={loading} loadingText="Checking…">
              Continue
            </SubmitButton>
          </form>
        </div>
      )}

      {view === "newpass" && (
        <div className="au-in">
          <button
            type="button"
            className="au-back"
            style={{ marginBottom: 18 }}
            onClick={() => {
              setView("code");
              setCodeTouched(false);
            }}
          >
            <FiArrowLeft aria-hidden="true" /> Back
          </button>
          <h1 className="au-display au-title">Choose a new password</h1>
          <p className="au-sub">Make it something you haven&apos;t used here before.</p>
          <form className="au-form" onSubmit={submitCode} noValidate>
            {error && <Alert>{error}</Alert>}
            <PasswordField
              ref={pwRef}
              id="new-password"
              label="New password"
              icon={FiLock}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPwTouched((t) => ({ ...t, password: true }))}
              placeholder="Create a password"
              maxLength={72}
              error={pwTouched.password ? pwErrors.password : ""}
              rules
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              icon={FiLock}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setPwTouched((t) => ({ ...t, confirm: true }))}
              placeholder="Type it again"
              maxLength={72}
              error={pwTouched.confirm ? pwErrors.confirm : ""}
              valid={pwTouched.confirm && !pwErrors.confirm}
            />
            <SubmitButton loading={loading} loadingText="Saving…">
              Save new password
            </SubmitButton>
          </form>
        </div>
      )}

      {view === "sent" && (
        <div className="au-state au-in" role="status">
          <div className="au-state-art">
            <FiSend />
          </div>
          <h1 className="au-display au-title">Check your inbox</h1>
          <p className="au-sub">
            If <b>{normalizeEmail(email)}</b> has a Nuformly account, we&apos;ve sent a link — and a 6-digit code — to reset your password. Either one works once and expires in 30 minutes.
          </p>
          <div style={{ marginTop: 22 }}>
            <button type="button" className="au-btn" onClick={() => setView("code")}>
              I have the code
            </button>
          </div>
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
            <button type="button" onClick={() => setView("ask")}>
              Use a different one
            </button>
          </p>
        </div>
      )}

      {view === "ask" && (
        <div className="au-in">
          <Link to="/company/login" className="au-back" style={{ marginBottom: 18 }}>
            <FiArrowLeft /> Back to log in
          </Link>
          <h1 className="au-display au-title">Forgot your password?</h1>
          <p className="au-sub">Enter the email you use for Nuformly and we&apos;ll send you a link and a code to choose a new one.</p>
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
