import { forwardRef, useState } from "react";
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiArrowRight } from "react-icons/fi";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Input with a floating label and a leading icon. */
export const Field = forwardRef(function Field({ id, label, icon: Icon, error, hint, valid, trailing, className = "", ...input }, ref) {
  const describedBy = error || hint ? `${id}-note` : undefined;
  return (
    <div className={className}>
      <div className={`au-field ${error ? "is-invalid" : ""} ${valid ? "is-valid" : ""}`}>
        <input ref={ref} id={id} placeholder=" " aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...input} />
        <label htmlFor={id} className="au-label">
          {label}
        </label>
        {Icon && <Icon className="au-icon" aria-hidden="true" />}
        {trailing}
      </div>
      {(error || hint) && (
        <p id={describedBy} className={`au-hint ${error ? "is-error" : ""}`} role={error ? "alert" : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

/** Password field: show/hide toggle, Caps Lock warning, optional strength meter. */
export const PasswordField = forwardRef(function PasswordField({ id, label = "Password", icon, error, strength = false, value, ...input }, ref) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const onKey = (e) => setCaps(Boolean(e.getModifierState?.("CapsLock")));
  const s = strength ? scorePassword(value) : null;
  return (
    <div>
      <Field
        ref={ref}
        id={id}
        label={label}
        icon={icon}
        error={error}
        type={show ? "text" : "password"}
        value={value}
        onKeyUp={onKey}
        onKeyDown={onKey}
        trailing={
          <button type="button" className="au-eye" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        }
        {...input}
      />
      {caps && !error && <p className="au-hint is-warn">Caps Lock is on</p>}
      {s && value && (
        <>
          <div className="au-meter" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < s.score ? "is-on" : ""} style={{ "--c": s.color }} />
            ))}
          </div>
          <p className="au-hint" aria-live="polite">
            <b style={{ color: s.color }}>{s.label}</b> · {s.tip}
          </p>
        </>
      )}
    </div>
  );
});

/** 0–4 for the meter; at least 8 characters is what the server requires. */
export function scorePassword(pw = "") {
  if (pw.length < 8) return { score: 1, label: "Too short", tip: `${8 - pw.length} more character${8 - pw.length === 1 ? "" : "s"} needed`, color: "#c2341b", ok: false };
  let score = 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  else if (/\d|[^A-Za-z0-9]/.test(pw)) score += 0.5;
  score = Math.min(4, Math.round(score));
  const levels = {
    1: ["Okay", "Add a number or symbol to make it stronger", "#d97706"],
    2: ["Good", "A longer password is even safer", "#65a30d"],
    3: ["Strong", "Nice — that's a solid password", "#1a8a56"],
    4: ["Excellent", "Very hard to guess", "#0d5537"],
  };
  const [label, tip, color] = levels[score];
  return { score, label, tip, color, ok: true };
}

// "name@gmial.com" → "name@gmail.com"
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "rediffmail.com", "yahoo.in"];
export function suggestEmail(email = "") {
  const [user, domain] = email.toLowerCase().split("@");
  if (!user || !domain || DOMAINS.includes(domain)) return null;
  const dist = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
    for (let i = 1; i <= a.length; i += 1)
      for (let j = 1; j <= b.length; j += 1) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  const best = DOMAINS.map((d) => [d, dist(domain, d)]).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] > 0 && best[1] <= 2 ? `${user}@${best[0]}` : null;
}

export function Alert({ tone = "error", children, id }) {
  const Icon = tone === "ok" ? FiCheckCircle : FiAlertCircle;
  return (
    <div id={id} className={`au-alert ${tone === "ok" ? "is-ok" : "is-error"}`} role={tone === "ok" ? "status" : "alert"}>
      <Icon aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText = "Please wait…", arrow = true, ...rest }) {
  return (
    <button type="submit" className="au-btn" disabled={loading} aria-busy={loading || undefined} {...rest}>
      {loading ? (
        <>
          <span className="au-spinner" aria-hidden="true" /> {loadingText}
        </>
      ) : (
        <>
          {children} {arrow && <FiArrowRight aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
