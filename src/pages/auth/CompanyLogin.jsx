import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "./AuthLayout.jsx";
import { Field, PasswordField, Alert, SubmitButton, EMAIL_RE, suggestEmail } from "./fields.jsx";

/** Company login (/company/login). Super-admin accounts can't sign in here. */
export default function CompanyLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const notice = location.state?.notice;

  useEffect(() => {
    (email ? passwordRef : emailRef).current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // already signed in with a company account → straight to the workspace
  if (user && user.role !== "SUPER_ADMIN") return <Navigate to="/company/overview" replace />;

  const emailError = touched.email && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : "";
  const passwordError = touched.password && !password ? "Enter your password." : "";
  const suggestion = !emailError && suggestEmail(email.trim());

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError("");
    if (!EMAIL_RE.test(email.trim()) || !password) {
      setShake(1);
      (!EMAIL_RE.test(email.trim()) ? emailRef : passwordRef).current?.focus();
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password, "company");
    setLoading(false);
    if (!result.success) {
      setError(result.refused ? "Invalid details." : result.message);
      setShake(1);
      setPassword("");
      passwordRef.current?.focus();
      return;
    }
    navigate(location.state?.from || "/company/overview", { replace: true });
  };

  return (
    <AuthLayout
      title="Log in"
      variant="login"
      switcher={
        <p className="au-switch">
          New to Nuformly?<Link to="/company/signup">Start free</Link>
        </p>
      }
    >
      <div className="au-in">
        <p className="au-eyebrow">
          <span className="au-dot" /> Company workspace
        </p>
        <h1 className="au-display au-title">Welcome back</h1>
        <p className="au-sub">Log in to manage your chatbots, conversations and leads.</p>

        <form className={`au-form ${shake ? "au-shake" : ""}`} onAnimationEnd={(e) => e.target === e.currentTarget && setShake(0)} onSubmit={submit} noValidate>
          {notice && !error && <Alert tone="ok">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}
          <Field
            ref={emailRef}
            id="email"
            label="Work email"
            icon={FiMail}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={emailError}
            hint={
              suggestion ? (
                <>
                  Did you mean{" "}
                  <button type="button" onClick={() => setEmail(suggestion)}>
                    {suggestion}
                  </button>
                  ?
                </>
              ) : null
            }
          />
          <PasswordField
            ref={passwordRef}
            id="password"
            icon={FiLock}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={passwordError}
          />
          <div className="au-row">
            <span />
            <Link to="/company/forgot-password" state={{ email: email.trim() }} className="au-link">
              Forgot password?
            </Link>
          </div>
          <SubmitButton loading={loading} loadingText="Logging in…">
            Log in
          </SubmitButton>
        </form>

        <p className="au-sub" style={{ marginTop: 24, fontSize: 14, textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <Link to="/company/signup" className="au-link">
            Create one for free
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
