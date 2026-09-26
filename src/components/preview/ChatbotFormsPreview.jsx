import { useState } from "react";
import { ALLOWED_FORM_FIELDS } from "../../config/chatbotConfigDefaults.js";

// Shared by both brand renderers so the (stateful, validated) pre-chat
// form logic exists in exactly one place — brand look is passed in via
// props (primaryColor/panelText/inputBg/inputBorder), not hardcoded.
//
// Schema reality (backend/config/chatbotConfig.js, mirrored in
// admin-panel/src/config/chatbotConfigDefaults.js): `forms` only has
// `enabled`, `style` ("classic"|"conversational"), and `fields` (a
// subset of name/email/phone/company). There is no per-field
// "required" flag, no title/description/button-text config — every
// configured field is treated as required, which is the only
// interpretation consistent with "fields to collect" gating a chat.
// This is a LOCAL, in-memory preview only: no visitor, conversation,
// or message is ever created, and nothing here calls any backend API.

const FIELD_META = Object.fromEntries(ALLOWED_FORM_FIELDS.map((f) => [f.value, f]));
const FIELD_TYPE = { name: "text", email: "email", phone: "tel", company: "text" };
const FIELD_PLACEHOLDER = {
  name: "Jane Doe",
  email: "jane@company.com",
  phone: "+1 555 000 1234",
  company: "Acme Inc.",
};

export default function ChatbotFormsPreview({ fields, style, primaryColor, panelText, inputBg, inputBorder, onComplete }) {
  const orderedFields = (fields || []).filter((f) => FIELD_META[f]);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);

  const inputStyle = { background: inputBg, borderColor: inputBorder, color: panelText };

  const setValue = (field, v) => {
    setValues((prev) => ({ ...prev, [field]: v }));
    if (errors[field] && v.trim()) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  if (orderedFields.length === 0) {
    // Enabled but nothing configured to collect — still a real gate
    // (matches "enabled" doing something), just with no fields.
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[13px]" style={{ color: panelText }}>
          Let&apos;s get started.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-full px-5 py-2 text-[13px] font-semibold text-white"
          style={{ background: primaryColor }}
        >
          Start Chat
        </button>
      </div>
    );
  }

  if (style === "conversational") {
    const field = orderedFields[step];
    const meta = FIELD_META[field];
    const isLast = step === orderedFields.length - 1;

    const next = () => {
      if (!values[field]?.trim()) {
        setErrors((p) => ({ ...p, [field]: true }));
        return;
      }
      if (isLast) onComplete();
      else setStep((s) => s + 1);
    };

    return (
      <div className="flex h-full flex-col justify-center gap-4 px-5">
        <div className="rounded-2xl px-4 py-3 text-[13px]" style={{ background: inputBg, color: panelText, border: `1px solid ${inputBorder}` }}>
          What&apos;s your {meta.label.toLowerCase()}? <span className="text-[10px] opacity-60">(required)</span>
        </div>
        <div>
          <input
            key={field}
            autoFocus
            type={FIELD_TYPE[field]}
            value={values[field] || ""}
            onChange={(e) => setValue(field, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && next()}
            placeholder={FIELD_PLACEHOLDER[field]}
            aria-label={meta.label}
            className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
            style={inputStyle}
          />
          {errors[field] && <p className="mt-1 text-[11px] text-red-500">{meta.label} is required.</p>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] opacity-50" style={{ color: panelText }}>
            {step + 1} / {orderedFields.length}
          </span>
          <button
            type="button"
            onClick={next}
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-white"
            style={{ background: primaryColor }}
          >
            {isLast ? "Start Chat" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  // classic — every field at once
  const submit = () => {
    const next = {};
    let ok = true;
    orderedFields.forEach((f) => {
      if (!values[f]?.trim()) {
        next[f] = true;
        ok = false;
      }
    });
    setErrors(next);
    if (ok) onComplete();
  };

  return (
    <div className="flex h-full flex-col justify-center gap-3.5 overflow-y-auto px-5 py-4">
      <div>
        <h3 className="text-[14px] font-semibold" style={{ color: panelText }}>
          Before we start
        </h3>
        <p className="mt-0.5 text-[12px] opacity-60" style={{ color: panelText }}>
          A few details so we can help you faster.
        </p>
      </div>
      {orderedFields.map((f) => {
        const meta = FIELD_META[f];
        return (
          <label key={f} className="block">
            <span className="mb-1 block text-[12px] font-medium" style={{ color: panelText }}>
              {meta.label} <span className="text-red-500">*</span>
            </span>
            <input
              type={FIELD_TYPE[f]}
              value={values[f] || ""}
              onChange={(e) => setValue(f, e.target.value)}
              placeholder={FIELD_PLACEHOLDER[f]}
              className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
              style={inputStyle}
            />
            {errors[f] && <p className="mt-1 text-[11px] text-red-500">{meta.label} is required.</p>}
          </label>
        );
      })}
      <button
        type="button"
        onClick={submit}
        className="mt-1 rounded-full py-2 text-[13px] font-semibold text-white"
        style={{ background: primaryColor }}
      >
        Start Chat
      </button>
    </div>
  );
}
