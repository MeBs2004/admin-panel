import {
  FiPlay,
  FiMessageSquare,
  FiHelpCircle,
  FiList,
  FiCpu,
  FiBookOpen,
  FiGitBranch,
  FiLink,
  FiUserCheck,
  FiClock,
  FiSquare,
} from "react-icons/fi";

// Single source of truth for every node type the builder knows about:
// icon/label/color for rendering, and the default `data` a new node
// of that type starts with. The backend validator (see
// backend/validators/flow.validator.js) is the actual authority on
// what makes a node valid — this file only drives the UI.
export const NODE_DEFS = {
  start: {
    label: "Start",
    icon: FiPlay,
    color: "#0d5537",
    description: "Beginning of the flow.",
    defaultData: {},
  },
  message: {
    label: "Message",
    icon: FiMessageSquare,
    color: "#2563eb",
    description: "Send a message to the visitor.",
    defaultData: { message: "" },
  },
  question: {
    label: "Question",
    icon: FiHelpCircle,
    color: "#7c3aed",
    description: "Ask the visitor for information.",
    defaultData: { question: "", variable: "", inputType: "text", required: true },
  },
  buttons: {
    label: "Buttons",
    icon: FiList,
    color: "#c2410c",
    description: "Show selectable options.",
    defaultData: { message: "", buttons: [{ label: "Option 1", value: "option-1" }] },
  },
  aiResponse: {
    label: "AI Response",
    icon: FiCpu,
    color: "#0891b2",
    description: "Reply using the existing AI assistant.",
    defaultData: { prompt: "", instruction: "", temperature: 0.3, maxTokens: 500, historyEnabled: true },
  },
  knowledgeBase: {
    label: "Knowledge Base",
    icon: FiBookOpen,
    color: "#0d9488",
    description: "Answer from the company knowledge base.",
    defaultData: { instructions: "", fallback: "" },
  },
  condition: {
    label: "Condition",
    icon: FiGitBranch,
    color: "#ca8a04",
    description: "Branch the flow based on a variable.",
    defaultData: { variable: "", operator: "exists", value: "" },
  },
  webhook: {
    label: "Webhook",
    icon: FiLink,
    color: "#4338ca",
    description: "Call an external endpoint.",
    defaultData: { url: "", method: "POST", headers: {}, body: {}, timeout: 5000, successMessage: "", failureMessage: "" },
  },
  humanHandoff: {
    label: "Human Handoff",
    icon: FiUserCheck,
    color: "#be123c",
    description: "Hand the conversation to a human (message + persistence only today).",
    defaultData: { message: "", department: "" },
  },
  delay: {
    label: "Delay",
    icon: FiClock,
    color: "#64748b",
    description: "Wait before continuing.",
    defaultData: { duration: 800 },
  },
  end: {
    label: "End",
    icon: FiSquare,
    color: "#334155",
    description: "Terminate the flow.",
    defaultData: { endMessage: "" },
  },
};

export const NODE_LIBRARY_ORDER = [
  "start",
  "message",
  "question",
  "buttons",
  "aiResponse",
  "knowledgeBase",
  "condition",
  "webhook",
  "humanHandoff",
  "delay",
  "end",
];

export const MAX_DELAY_MS = 4000;
