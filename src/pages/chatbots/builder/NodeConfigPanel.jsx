import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Toggle from "../../../components/ui/Toggle.jsx";
import Button from "../../../components/ui/Button.jsx";
import { NODE_DEFS, MAX_DELAY_MS } from "./nodeDefs.js";

const INPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
];

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "exists", label: "exists" },
  { value: "not_exists", label: "does not exist" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
];

const METHODS = ["GET", "POST", "PUT", "PATCH"].map((m) => ({ value: m, label: m }));

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function TextArea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:text-gray-100 dark:border-[var(--border)]"
    />
  );
}

export default function NodeConfigPanel({ node, errors, onChange, onClose, onDelete, onDuplicate }) {
  if (!node) {
    return (
      <aside className="flex w-[300px] shrink-0 flex-col items-center justify-center border-l border-gray-200 bg-white p-6 text-center dark:bg-[var(--surface)] dark:border-[var(--border)]">
        <p className="text-sm text-gray-400">Select a node to configure it.</p>
      </aside>
    );
  }

  const def = NODE_DEFS[node.data.nodeType];
  const d = node.data.nodeData || {};
  const set = (patch) => onChange(node.id, { ...d, ...patch });
  const nodeErrors = errors.filter((e) => e.nodeId === node.id);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-gray-200 bg-white dark:bg-[var(--surface)] dark:border-[var(--border)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-[var(--border)]">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{def.label} properties</p>
        <button onClick={onClose} aria-label="Close properties" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
          <FiX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {nodeErrors.length > 0 && (
          <div className="mb-3 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
            {nodeErrors.map((e, i) => (
              <p key={i}>{e.message}</p>
            ))}
          </div>
        )}

        {node.data.nodeType === "start" && (
          <p className="text-xs text-gray-400">The Start node has no properties — it only marks where the flow begins.</p>
        )}

        {node.data.nodeType === "message" && (
          <Field label="Message">
            <TextArea value={d.message} onChange={(v) => set({ message: v })} placeholder="Hi! How can I help you today?" />
          </Field>
        )}

        {node.data.nodeType === "question" && (
          <>
            <Field label="Question">
              <TextArea value={d.question} onChange={(v) => set({ question: v })} placeholder="What is your email address?" />
            </Field>
            <Field label="Variable name">
              <Input value={d.variable || ""} onChange={(e) => set({ variable: e.target.value })} placeholder="flow.email" />
            </Field>
            <Field label="Input type">
              <Select options={INPUT_TYPES} value={d.inputType || "text"} onChange={(e) => set({ inputType: e.target.value })} />
            </Field>
            <Toggle checked={d.required !== false} onChange={(v) => set({ required: v })} label="Required" />
          </>
        )}

        {node.data.nodeType === "buttons" && (
          <>
            <Field label="Message">
              <TextArea value={d.message} onChange={(v) => set({ message: v })} placeholder="How can I help?" />
            </Field>
            <Field label="Buttons">
              <div className="space-y-2">
                {(d.buttons || []).map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      value={b.label}
                      onChange={(e) => {
                        const next = [...d.buttons];
                        next[i] = { ...b, label: e.target.value, value: b.value || e.target.value };
                        set({ buttons: next });
                      }}
                      placeholder={`Button ${i + 1}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/40 dark:bg-[var(--surface)] dark:border-[var(--border)] dark:text-gray-100"
                    />
                    <button
                      onClick={() => set({ buttons: d.buttons.filter((_, idx) => idx !== i) })}
                      className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600"
                      aria-label="Remove button"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    set({
                      buttons: [...(d.buttons || []), { label: `Option ${(d.buttons?.length || 0) + 1}`, value: `option-${(d.buttons?.length || 0) + 1}-${Date.now()}` }],
                    })
                  }
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  <FiPlus className="h-3 w-3" /> Add button
                </button>
              </div>
            </Field>
            <p className="text-[11px] text-gray-400">
              Each button needs its own connection drawn from the canvas to the node it should lead to.
            </p>
          </>
        )}

        {node.data.nodeType === "aiResponse" && (
          <>
            <Field label="Prompt / instruction">
              <TextArea value={d.prompt} onChange={(v) => set({ prompt: v })} placeholder="Leave empty to use the visitor's message as-is." />
            </Field>
            <Field label="Additional instruction">
              <TextArea rows={2} value={d.instruction} onChange={(v) => set({ instruction: v })} placeholder="e.g. Keep it under 3 sentences." />
            </Field>
            <Field label={`Temperature (${d.temperature ?? 0.3})`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={d.temperature ?? 0.3}
                onChange={(e) => set({ temperature: Number(e.target.value) })}
                className="w-full"
              />
            </Field>
            <Field label="Max tokens">
              <Input type="number" min="1" max="2000" value={d.maxTokens ?? 500} onChange={(e) => set({ maxTokens: Number(e.target.value) })} />
            </Field>
            <Toggle checked={d.historyEnabled !== false} onChange={(v) => set({ historyEnabled: v })} label="Use conversation history" />
          </>
        )}

        {node.data.nodeType === "knowledgeBase" && (
          <>
            <Field label="Instructions">
              <TextArea value={d.instructions} onChange={(v) => set({ instructions: v })} placeholder="Optional extra guidance for how to answer." />
            </Field>
            <Field label="Fallback response">
              <TextArea rows={2} value={d.fallback} onChange={(v) => set({ fallback: v })} placeholder="Shown if nothing relevant is found." />
            </Field>
            <p className="text-[11px] text-gray-400">
              Uses this chatbot's company knowledge base — the same one configured in Company settings.
            </p>
          </>
        )}

        {node.data.nodeType === "condition" && (
          <>
            <Field label="Variable">
              <Input value={d.variable || ""} onChange={(e) => set({ variable: e.target.value })} placeholder="flow.email" />
            </Field>
            <Field label="Operator">
              <Select options={OPERATORS} value={d.operator || "exists"} onChange={(e) => set({ operator: e.target.value })} />
            </Field>
            {!["exists", "not_exists"].includes(d.operator) && (
              <Field label="Value">
                <Input value={d.value ?? ""} onChange={(e) => set({ value: e.target.value })} />
              </Field>
            )}
            <p className="text-[11px] text-gray-400">Connect the TRUE and FALSE handles below the node on the canvas.</p>
          </>
        )}

        {node.data.nodeType === "webhook" && (
          <>
            <Field label="URL">
              <Input value={d.url || ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://example.com/hook" />
            </Field>
            <Field label="Method">
              <Select options={METHODS} value={d.method || "POST"} onChange={(e) => set({ method: e.target.value })} />
            </Field>
            <Field label="Timeout (ms, max 8000)">
              <Input type="number" min="500" max="8000" value={d.timeout ?? 5000} onChange={(e) => set({ timeout: Number(e.target.value) })} />
            </Field>
            <Field label="Success message (optional)">
              <TextArea rows={2} value={d.successMessage} onChange={(v) => set({ successMessage: v })} />
            </Field>
            <Field label="Failure message (optional)">
              <TextArea rows={2} value={d.failureMessage} onChange={(v) => set({ failureMessage: v })} />
            </Field>
            <p className="text-[11px] text-gray-400">
              Internal/private network destinations are blocked automatically for security.
            </p>
          </>
        )}

        {node.data.nodeType === "humanHandoff" && (
          <>
            <Field label="Message shown to visitor">
              <TextArea value={d.message} onChange={(v) => set({ message: v })} placeholder="Our team will be with you shortly." />
            </Field>
            <Field label="Department (optional)">
              <Input value={d.department || ""} onChange={(e) => set({ department: e.target.value })} placeholder="Sales" />
            </Field>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Live agent takeover doesn't exist yet — this records the handoff and stops routing this visitor through the
              flow, falling back to the regular assistant.
            </p>
          </>
        )}

        {node.data.nodeType === "delay" && (
          <Field label={`Duration in ms (max ${MAX_DELAY_MS})`}>
            <Input
              type="number"
              min="0"
              max={MAX_DELAY_MS}
              value={d.duration ?? 800}
              onChange={(e) => set({ duration: Number(e.target.value) })}
            />
          </Field>
        )}

        {node.data.nodeType === "end" && (
          <Field label="Closing message (optional)">
            <TextArea value={d.endMessage} onChange={(v) => set({ endMessage: v })} placeholder="Thanks for chatting!" />
          </Field>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-100 p-3 dark:border-[var(--border)]">
        <Button variant="secondary" className="flex-1" onClick={() => onDuplicate(node.id)}>
          Duplicate
        </Button>
        {node.data.nodeType !== "start" && (
          <Button variant="danger" className="flex-1" onClick={() => onDelete(node.id)}>
            Delete
          </Button>
        )}
      </div>
    </aside>
  );
}
