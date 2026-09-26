import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { NODE_DEFS } from "./nodeDefs.js";

function summarize(type, data) {
  switch (type) {
    case "message":
      return data.message || "(empty message)";
    case "question":
      return data.question || "(empty question)";
    case "buttons":
      return (data.buttons || []).map((b) => b.label).join(" · ") || "(no buttons)";
    case "aiResponse":
      return data.prompt || "(uses visitor message as prompt)";
    case "knowledgeBase":
      return data.instructions || "Answers from the knowledge base";
    case "condition":
      return data.variable ? `${data.variable} ${data.operator || ""} ${data.value ?? ""}`.trim() : "(not configured)";
    case "webhook":
      return data.url || "(no URL set)";
    case "humanHandoff":
      return data.message || "(no message set)";
    case "delay":
      return `${data.duration ?? 0}ms`;
    case "end":
      return data.endMessage || "(no closing message)";
    default:
      return "";
  }
}

function FlowNode({ id, data, selected }) {
  const def = NODE_DEFS[data.nodeType] || NODE_DEFS.message;
  const Icon = def.icon;
  const hasErrors = (data.errors || []).length > 0;

  return (
    <div
      className={`w-[220px] rounded-xl border bg-white shadow-card transition-shadow dark:bg-[var(--surface)] ${
        selected ? "ring-2 ring-primary-400" : ""
      } ${hasErrors ? "border-danger-400" : "border-gray-200 dark:border-[var(--border)]"}`}
    >
      {data.nodeType !== "start" && (
        <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !bg-gray-400" />
      )}

      <div
        className="flex items-center gap-2 rounded-t-xl px-3 py-2 text-white"
        style={{ backgroundColor: def.color }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate text-xs font-semibold">{def.label}</span>
      </div>

      <div className="px-3 py-2 text-[11px] leading-snug text-gray-600 dark:text-gray-300">
        <p className="line-clamp-3 break-words">{summarize(data.nodeType, data.nodeData || {})}</p>
        {hasErrors && (
          <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-danger-600">
            {data.errors.length} issue{data.errors.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {data.nodeType === "condition" && (
        <div className="flex justify-between px-3 pb-2 text-[9px] font-semibold text-gray-400">
          <span>TRUE</span>
          <span>FALSE</span>
        </div>
      )}

      {data.nodeType === "condition" ? (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ left: "30%" }} className="!h-2.5 !w-2.5 !bg-success-500" />
          <Handle type="source" position={Position.Bottom} id="false" style={{ left: "70%" }} className="!h-2.5 !w-2.5 !bg-danger-500" />
        </>
      ) : data.nodeType === "buttons" ? (
        (data.nodeData?.buttons || []).map((b, i, arr) => (
          <Handle
            key={b.value || b.label || i}
            type="source"
            position={Position.Bottom}
            id={String(b.value ?? b.label ?? i)}
            style={{ left: `${((i + 1) / (arr.length + 1)) * 100}%` }}
            className="!h-2.5 !w-2.5 !bg-primary-500"
          />
        ))
      ) : data.nodeType === "end" ? null : (
        <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !bg-gray-400" />
      )}
    </div>
  );
}

export default memo(FlowNode);
