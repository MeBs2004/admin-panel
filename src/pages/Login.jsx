import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiShield } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { checkEmail, normalizeEmail } from "../config/accountRules.js";
import AuthLayout, { PlatformPulse } from "./auth/AuthLayout.jsx";
import { Field, PasswordField, Alert, SubmitButton, EmailSuggestion, suggestEmail, useTouched } from "./auth/fields.jsx";

const LAST_EMAIL = "nuformly-last-platform-email";
const remembered = () => {
  try {
    return localStorage.getItem(LAST_EMAIL) || "";
  } catch {
    return "";
  }
};

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Platform / staff login (/login). Company accounts can't sign in here. */
export default function Login() {
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

  if (user && user.role === "SUPER_ADMIN") {
    const redirectTo = location.state?.from || "/dashboard";
    navigate(redirectTo, { replace: true });
    return null;
  }

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
    const result = await login(normalizeEmail(email), password, "platform");
    setLoading(false);
    if (result.success) {
      try {
        localStorage.setItem(LAST_EMAIL, normalizeEmail(email));
      } catch {
        /* private mode */
      }
      navigate(location.state?.from || "/dashboard", { replace: true });
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
    <AuthLayout title="Platform login" variant="platform" scene={<PlatformPulse />}>
      <div className="au-in">
        <p className="au-eyebrow">
          <span className="au-dot" /> Platform admin
        </p>
        <h1 className="au-display au-title">Welcome back, team</h1>
        <p className="au-sub">Sign in to manage companies, chatbots and staff across Nuformly.</p>

        <form className={`au-form ${shake ? "au-shake" : ""}`} onAnimationEnd={(e) => e.target === e.currentTarget && setShake(0)} onSubmit={submit} noValidate>
          {failure && (
            <div ref={alertRef} tabIndex={-1} className="au-alert-wrap">
              <Alert>
                <b>{failure.message}</b>
                {failure.kind === "wait" && waitLeft > 0 && <span className="au-alert-sub">You can try again in {clock(waitLeft)}.</span>}
                {failure.kind === "refused" && fails >= 2 && <span className="au-alert-sub">Not your account to reset? Ask another platform admin for help.</span>}
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
            placeholder="you@nuformsocial.com"
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
              <span className="au-label-link is-disabled" title="Platform accounts are reset by another admin, not by email.">
                Forgot password?
              </span>
            }
          />
          <SubmitButton loading={loading} loadingText="Signing in…" disabled={waitLeft > 0}>
            {waitLeft > 0 ? `Try again in ${clock(waitLeft)}` : "Log in"}
          </SubmitButton>
        </form>

        <p className="au-fine au-platform-foot">
          <FiShield aria-hidden="true" /> Staff &amp; platform administration only.
        </p>
        <p className="au-switch au-platform-switch">
          <span className="au-switch-q">Looking for your company workspace?</span> <Link to="/company/login">Log in here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
