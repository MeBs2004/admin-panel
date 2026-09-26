import {
  FiActivity,
  FiPlusCircle,
  FiEdit3,
  FiTrash2,
  FiShield,
  FiKey,
  FiLogIn,
  FiLogOut,
  FiBookOpen,
  FiMessageSquare,
} from "react-icons/fi";

const RULES = [
  { match: /^LOGIN/, icon: FiLogIn, accent: "text-info-500 bg-info-50 dark:bg-info-500/10" },
  { match: /^LOGOUT/, icon: FiLogOut, accent: "text-gray-500 bg-gray-100 dark:bg-white/5" },
  { match: /^CREATE/, icon: FiPlusCircle, accent: "text-success-600 bg-success-50 dark:bg-success-500/10" },
  { match: /^DELETE/, icon: FiTrash2, accent: "text-danger-500 bg-danger-50 dark:bg-danger-500/10" },
  { match: /^(SET_USER_STATUS|SET_COMPANY_STATUS)/, icon: FiShield, accent: "text-warning-600 bg-warning-50 dark:bg-warning-500/10" },
  { match: /^PASSWORD_RESET/, icon: FiKey, accent: "text-warning-600 bg-warning-50 dark:bg-warning-500/10" },
  { match: /^KNOWLEDGE/, icon: FiBookOpen, accent: "text-primary-500 bg-primary-50 dark:bg-primary-500/10" },
  { match: /^CONVERSATION/, icon: FiMessageSquare, accent: "text-info-500 bg-info-50 dark:bg-info-500/10" },
  { match: /^UPDATE/, icon: FiEdit3, accent: "text-info-500 bg-info-50 dark:bg-info-500/10" },
];

export function activityIconFor(action) {
  return (
    RULES.find((r) => r.match.test(action)) || {
      icon: FiActivity,
      accent: "text-gray-500 bg-gray-100 dark:bg-white/5",
    }
  );
}
