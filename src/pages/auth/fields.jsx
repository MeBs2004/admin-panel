import { forwardRef, useId, useState } from "react";
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiCheck, FiArrowRight, FiInfo } from "react-icons/fi";
import { passwordChecks, passwordStrength } from "../../config/accountRules.js";

/**
 * A labelled input. The label sits above the box (always visible, so people
 * never lose track of what a field was for); the note under it shows the
 * error, or a hint. `aside` puts a small link on the label row.
 */
export const Field = forwardRef(function Field(
  { id, label, icon: Icon, error, hint, valid, trailing, aside, className = "", "aria-describedby": extraNote, ...input },
  ref,
) {
  const noteId = `${id}-note`;
  const showNote = Boolean(error || hint);
  const describedBy = [showNote && noteId, extraNote].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`au-field ${error ? "is-invalid" : ""} ${valid && !error ? "is-valid" : ""} ${className}`}>
      <div className="au-label-row">
        <label htmlFor={id} className="au-label">
          {label}
        </label>
        {aside}
      </div>
      <div className="au-box">
        {Icon && <Icon className="au-icon" aria-hidden="true" />}
        <input ref={ref} id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...input} />
        {valid && !error && !trailing && <FiCheck className="au-ok" aria-hidden="true" />}
        {trailing}
      </div>
      {showNote && (
        <p id={noteId} className={`au-note ${error ? "is-error" : ""}`} aria-live="polite">
          {error && <FiAlertCircle aria-hidden="true" />}
          <span>{error || hint}</span>
        </p>
      )}
    </div>
  );
});

/**
 * Password input with show/hide and a Caps Lock warning. `rules` adds the
 * live checklist and strength bar used when creating a password; `ctx`
 * ({ email, name, company }) lets it refuse passwords built from those.
 */
export const PasswordField = forwardRef(function PasswordField(
  { id, label = "Password", icon, error, rules = false, ctx, value = "", aside, ...input },
  ref,
) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const listId = useId();
  const onKey = (e) => setCaps(Boolean(e.getModifierState?.("CapsLock")));
  const checks = rules ? passwordChecks(value, ctx) : null;
  const strength = rules && value ? passwordStrength(value, ctx) : null;
  return (
    <div className="au-pw">
      <Field
        ref={ref}
        id={id}
        label={label}
        icon={icon}
        error={error}
        hint={caps && !error ? "Caps Lock is on" : undefined}
        aside={aside}
        type={show ? "text" : "password"}
        value={value}
        onKeyUp={onKey}
        onKeyDown={onKey}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby={rules ? listId : undefined}
        trailing={
          <button type="button" className="au-eye" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        }
        {...input}
      />
      {rules && (
        <div className="au-pw-rules">
          <div className="au-meter" data-score={strength?.score ?? 0} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <span>{strength?.label || " "}</span>
          </div>
          <ul id={listId} className="au-checklist" aria-label="Password requirements">
            {checks.map((c) => (
              <li key={c.id} className={c.ok ? "is-ok" : ""}>
                <span aria-hidden="true">{c.ok ? <FiCheck /> : null}</span>
                {c.label}
                <span className="sr-only">{c.ok ? " — done" : " — not yet"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

// "name@gmial.com" → "name@gmail.com"
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "rediffmail.com", "yahoo.in", "yahoo.co.in", "proton.me", "protonmail.com", "live.com", "zoho.com"];
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

/** "Did you mean …?" under an email field. */
export function EmailSuggestion({ suggestion, onAccept }) {
  if (!suggestion) return null;
  return (
    <>
      Did you mean{" "}
      <button type="button" className="au-inline-link" onClick={() => onAccept(suggestion)}>
        {suggestion}
      </button>
      ?
    </>
  );
}

export function Alert({ tone = "error", children, id }) {
  const Icon = tone === "ok" ? FiCheckCircle : tone === "info" ? FiInfo : FiAlertCircle;
  return (
    <div id={id} className={`au-alert is-${tone}`} role={tone === "error" ? "alert" : "status"} tabIndex={-1}>
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText = "Please wait…", arrow = true, className = "", ...rest }) {
  return (
    <button type="submit" className={`au-btn ${className}`} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading ? (
        <>
          <span className="au-spinner" aria-hidden="true" /> {loadingText}
        </>
      ) : (
        <>
          {children} {arrow && <FiArrowRight className="au-btn-arrow" aria-hidden="true" />}
        </>
      )}
    </button>
  );
}

/**
 * Tracks which fields were touched so errors appear on blur, not while the
 * person is still typing — then update live once shown.
 */
export function useTouched() {
  const [touched, setTouched] = useState({});
  const touch = (k) => () => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const touchAll = (keys) => setTouched((t) => ({ ...t, ...Object.fromEntries(keys.map((k) => [k, true])) }));
  return { touched, touch, touchAll, reset: () => setTouched({}) };
}
