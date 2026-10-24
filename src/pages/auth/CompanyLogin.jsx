import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import { checkEmail, normalizeEmail } from "../../config/accountRules.js";
import AuthLayout from "./AuthLayout.jsx";
import { Field, PasswordField, Alert, SubmitButton, EmailSuggestion, suggestEmail, useTouched } from "./fields.jsx";

const LAST_EMAIL = "nuformly-last-email";
const remembered = () => {
  try {
    return localStorage.getItem(LAST_EMAIL) || "";
  } catch {
    return "";
  }
};

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Company login (/company/login). Super-admin accounts can't sign in here. */
export default function CompanyLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || remembered());
  const [password, setPassword] = useState("");
  const { touched, touch, touchAll } = useTouched();
  const [failure, setFailure] = useState(null); // { message, kind }
  const [fails, setFails] = useState(0);
  const [waitLeft, setWaitLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const alertRef = useRef(null);
  const notice = location.state?.notice;

  useEffect(() => {
    (email ? passwordRef : emailRef).current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Too many attempts": count down, then let them try again.
  useEffect(() => {
    if (!waitLeft) return undefined;
    const t = setTimeout(() => setWaitLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [waitLeft]);
  useEffect(() => {
    if (failure?.kind === "wait" && waitLeft === 0) setFailure(null);
  }, [waitLeft, failure]);

  // already signed in with a company account → straight to the workspace
  if (user && user.role !== "SUPER_ADMIN") return <Navigate to="/company/overview" replace />;

  const errors = {
    email: checkEmail(email),
    password: password ? "" : "Enter your password.",
  };
  const show = (k) => (touched[k] ? errors[k] : "");
  const suggestion = !errors.email && suggestEmail(normalizeEmail(email));

  const submit = async (e) => {
    e.preventDefault();
    if (loading || waitLeft) return;
    touchAll(["email", "password"]);
    setFailure(null);
    if (errors.email || errors.password) {
      setShake(1);
      (errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setLoading(true);
    const result = await login(normalizeEmail(email), password, "company");
    setLoading(false);
    if (result.success) {
      try {
        localStorage.setItem(LAST_EMAIL, normalizeEmail(email));
      } catch {
        /* private mode */
      }
      navigate(location.state?.from || "/company/overview", { replace: true });
      return;
    }

    setShake(1);
    if (result.offline) {
      setFailure({ kind: "offline", message: "Can't reach Nuformly right now. Check your internet connection and try again." });
    } else if (result.status === 429) {
      const wait = Math.min(15 * 60, result.retryAfter || 60);
      setWaitLeft(wait);
      setFailure({ kind: "wait", message: "Too many attempts. For your security, please wait before trying again." });
    } else if (result.refused) {
      setFails((n) => n + 1);
      setFailure({ kind: "refused", message: "Invalid details." });
      setPassword("");
      passwordRef.current?.focus();
      return;
    } else {
      setFailure({ kind: "other", message: result.message });
    }
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  return (
    <AuthLayout
      title="Log in"
      variant="login"
    >
      <div className="au-in">
        <p className="au-eyebrow">
          <span className="au-dot" /> Company workspace
        </p>
        <h1 className="au-display au-title">Welcome back</h1>
        <p className="au-sub">Log in to manage your chatbots, conversations and leads.</p>

        <form className={`au-form ${shake ? "au-shake" : ""}`} onAnimationEnd={(e) => e.target === e.currentTarget && setShake(0)} onSubmit={submit} noValidate>
          {notice && !failure && <Alert tone="ok">{notice}</Alert>}
          {failure && (
            <div ref={alertRef} tabIndex={-1} className="au-alert-wrap">
              <Alert>
                <b>{failure.message}</b>
                {failure.kind === "wait" && waitLeft > 0 && <span className="au-alert-sub">You can try again in {clock(waitLeft)}.</span>}
                {failure.kind === "refused" && fails >= 2 && (
                  <span className="au-alert-sub">
                    Can't remember it?{" "}
                    <Link to="/company/forgot-password" state={{ email: normalizeEmail(email) }}>
                      Reset your password
                    </Link>
                  </span>
                )}
              </Alert>
            </div>
          )}
          <Field
            ref={emailRef}
            id="email"
            name="email"
            label="Work email"
            icon={FiMail}
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={touch("email")}
            error={show("email")}
            valid={touched.email && !errors.email && !suggestion}
            hint={suggestion ? <EmailSuggestion suggestion={suggestion} onAccept={setEmail} /> : null}
          />
          <PasswordField
            ref={passwordRef}
            id="password"
            name="password"
            icon={FiLock}
            autoComplete="current-password"
            placeholder="Your password"
            maxLength={200}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={touch("password")}
            error={show("password")}
            aside={
              <Link to="/company/forgot-password" state={{ email: normalizeEmail(email) }} className="au-label-link">
                Forgot password?
              </Link>
            }
          />
          <SubmitButton loading={loading} loadingText="Logging in…" disabled={waitLeft > 0}>
            {waitLeft > 0 ? `Try again in ${clock(waitLeft)}` : "Log in"}
          </SubmitButton>
        </form>

        <div className="au-or">
          <span>New to Nuformly?</span>
        </div>
        <Link to="/company/signup" className="au-btn au-btn-ghost">
          Create a free account
        </Link>
      </div>
    </AuthLayout>
  );
}
