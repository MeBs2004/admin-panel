import { FiZap, FiBookOpen, FiBarChart2, FiMessageSquare } from "react-icons/fi";

// Mirrors backend/services/sectors/index.js's SECTOR_TEMPLATES
// exactly — the backend re-validates this regardless of what the
// wizard sends, same convention as every other options list in this
// app (INDUSTRY_OPTIONS, MODEL_OPTIONS, etc).
export const SECTOR_TEMPLATES = [
  {
    value: "energy",
    label: "Energy",
    icon: FiZap,
    description: "For energy companies and energy-related websites. Includes an energy-focused assistant and a BOM (Bill of Materials) sizing calculator.",
  },
  {
    value: "education",
    label: "Education",
    icon: FiBookOpen,
    description: "For schools, colleges, universities, coaching providers, and education businesses. Course discovery, admissions FAQs, and consultation requests.",
  },
  {
    value: "digital_marketing",
    label: "Digital Marketing Calculator",
    icon: FiBarChart2,
    description: "For marketing agencies and teams. Deterministic marketing calculators (ROI, ROAS, CPC, CPM, CTR, and more) with an assistant that explains results.",
  },
  {
    value: "general",
    label: "General",
    icon: FiMessageSquare,
    description: "A flexible, knowledge-based AI chatbot for businesses that don't need a specialized sector workflow.",
  },
];

export const SECTOR_LABELS = Object.fromEntries(SECTOR_TEMPLATES.map((t) => [t.value, t.label]));
