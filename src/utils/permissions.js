// Phase 11 — UX-only mirror of backend/services/admin/permissions.service.js.
// This is NEVER the source of authorization truth: every real
// mutation is independently re-checked server-side regardless of
// what this returns (see GET /auth/permissions for the backend's
// own, authoritative computation). This static copy exists purely
// so sidebar visibility / button gating doesn't need a network
// round trip for every render decision. Deliberately keyed off the
// user's GLOBAL AdminUser.role (same convention the rest of this
// app already uses, e.g. `me?.role === "SUPER_ADMIN"` checks) since
// there is no single "current company" concept yet (see
// WorkspaceSwitcher.jsx).

export const PERMISSIONS = {
  COMPANIES_READ: "companies.read",
  COMPANIES_MANAGE: "companies.manage",
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  CHATBOTS_READ: "chatbots.read",
  CHATBOTS_CREATE: "chatbots.create",
  CHATBOTS_MANAGE: "chatbots.manage",
  CHATBOT_ACCESS_MANAGE: "chatbot.access.manage",
  CONVERSATIONS_READ: "conversations.read",
  CONVERSATIONS_REPLY: "conversations.reply",
  CONVERSATIONS_TAKEOVER: "conversations.takeover",
  CONVERSATIONS_ASSIGN: "conversations.assign",
  CONVERSATIONS_CLOSE: "conversations.close",
  VISITORS_READ: "visitors.read",
  ANALYTICS_READ: "analytics.read",
  KNOWLEDGE_READ: "knowledge.read",
  KNOWLEDGE_MANAGE: "knowledge.manage",
  INTEGRATIONS_READ: "integrations.read",
  INTEGRATIONS_MANAGE: "integrations.manage",
  INSTALLATION_READ: "installation.read",
  INSTALLATION_MANAGE: "installation.manage",
  AUDIT_READ: "audit.read",
  DEVELOPER_MANAGE: "developer.manage",

  // Phase 12 — Developer Platform.
  DEVELOPER_VIEW: "developer.view",
  DEVELOPER_KEYS_VIEW: "developer.keys.view",
  DEVELOPER_KEYS_CREATE: "developer.keys.create",
  DEVELOPER_KEYS_REVOKE: "developer.keys.revoke",
  DEVELOPER_KEYS_ROTATE: "developer.keys.rotate",
  DEVELOPER_WEBHOOKS_VIEW: "developer.webhooks.view",
  DEVELOPER_WEBHOOKS_CREATE: "developer.webhooks.create",
  DEVELOPER_WEBHOOKS_UPDATE: "developer.webhooks.update",
  DEVELOPER_WEBHOOKS_DELETE: "developer.webhooks.delete",
  DEVELOPER_DOCS_VIEW: "developer.docs.view",
  DEVELOPER_USAGE_VIEW: "developer.usage.view",
  DEVELOPER_SETTINGS_MANAGE: "developer.settings.manage",

  // Phase 13 — Billing + Usage.
  BILLING_VIEW: "billing.view",
  BILLING_MANAGE: "billing.manage",
  BILLING_CHANGE_PLAN: "billing.change_plan",
  BILLING_CANCEL: "billing.cancel",
  BILLING_INVOICES_VIEW: "billing.invoices.view",
  USAGE_VIEW: "usage.view",
  USAGE_EXPORT: "usage.export",

  // Enterprise RBAC phase — custom roles, per-user permission
  // overrides, and task assignment. Kept in sync by hand with
  // backend/services/admin/permissions.service.js (see that file's
  // own comment on this duplication being a known hazard).
  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_EDIT: "roles.edit",
  ROLES_DELETE: "roles.delete",
  ROLES_ASSIGN: "roles.assign",
  USERS_INVITE: "users.invite",
  USERS_SUSPEND: "users.suspend",
  USERS_ASSIGN_ROLE: "users.assignRole",
  USERS_MANAGE_PERMISSIONS: "users.managePermissions",
  TASKS_VIEW: "tasks.view",
  TASKS_CREATE: "tasks.create",
  TASKS_EDIT: "tasks.edit",
  TASKS_DELETE: "tasks.delete",
  TASKS_ASSIGN: "tasks.assign",
  TASKS_COMPLETE: "tasks.complete",
};

const ALL = Object.values(PERMISSIONS);

const READ_ONLY = [
  PERMISSIONS.COMPANIES_READ,
  PERMISSIONS.CHATBOTS_READ,
  PERMISSIONS.CONVERSATIONS_READ,
  PERMISSIONS.VISITORS_READ,
  PERMISSIONS.ANALYTICS_READ,
  PERMISSIONS.KNOWLEDGE_READ,
  PERMISSIONS.INTEGRATIONS_READ,
  PERMISSIONS.INSTALLATION_READ,
];

const DEVELOPER_PLATFORM_PERMISSIONS = [
  PERMISSIONS.DEVELOPER_VIEW,
  PERMISSIONS.DEVELOPER_KEYS_VIEW,
  PERMISSIONS.DEVELOPER_KEYS_CREATE,
  PERMISSIONS.DEVELOPER_KEYS_REVOKE,
  PERMISSIONS.DEVELOPER_KEYS_ROTATE,
  PERMISSIONS.DEVELOPER_WEBHOOKS_VIEW,
  PERMISSIONS.DEVELOPER_WEBHOOKS_CREATE,
  PERMISSIONS.DEVELOPER_WEBHOOKS_UPDATE,
  PERMISSIONS.DEVELOPER_WEBHOOKS_DELETE,
  PERMISSIONS.DEVELOPER_DOCS_VIEW,
  PERMISSIONS.DEVELOPER_USAGE_VIEW,
  PERMISSIONS.DEVELOPER_SETTINGS_MANAGE,
];

const BILLING_PERMISSIONS = [
  PERMISSIONS.BILLING_VIEW,
  PERMISSIONS.BILLING_MANAGE,
  PERMISSIONS.BILLING_CHANGE_PLAN,
  PERMISSIONS.BILLING_CANCEL,
  PERMISSIONS.BILLING_INVOICES_VIEW,
  PERMISSIONS.USAGE_VIEW,
  PERMISSIONS.USAGE_EXPORT,
];

const TEAM_MANAGEMENT_PERMISSIONS = [
  PERMISSIONS.ROLES_VIEW,
  PERMISSIONS.ROLES_CREATE,
  PERMISSIONS.ROLES_EDIT,
  PERMISSIONS.ROLES_DELETE,
  PERMISSIONS.ROLES_ASSIGN,
  PERMISSIONS.USERS_INVITE,
  PERMISSIONS.USERS_SUSPEND,
  PERMISSIONS.USERS_ASSIGN_ROLE,
  PERMISSIONS.USERS_MANAGE_PERMISSIONS,
];

const TASK_MANAGEMENT_PERMISSIONS = [
  PERMISSIONS.TASKS_VIEW,
  PERMISSIONS.TASKS_CREATE,
  PERMISSIONS.TASKS_EDIT,
  PERMISSIONS.TASKS_DELETE,
  PERMISSIONS.TASKS_ASSIGN,
  PERMISSIONS.TASKS_COMPLETE,
];

const TASK_SELF_SERVICE_PERMISSIONS = [PERMISSIONS.TASKS_VIEW, PERMISSIONS.TASKS_COMPLETE];

export const ROLE_PERMISSIONS = {
  COMPANY_ADMIN: [
    ...READ_ONLY,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.CHATBOTS_CREATE,
    PERMISSIONS.CHATBOTS_MANAGE,
    PERMISSIONS.CHATBOT_ACCESS_MANAGE,
    PERMISSIONS.CONVERSATIONS_REPLY,
    PERMISSIONS.CONVERSATIONS_TAKEOVER,
    PERMISSIONS.CONVERSATIONS_ASSIGN,
    PERMISSIONS.CONVERSATIONS_CLOSE,
    PERMISSIONS.KNOWLEDGE_MANAGE,
    PERMISSIONS.INTEGRATIONS_MANAGE,
    PERMISSIONS.INSTALLATION_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.DEVELOPER_MANAGE,
    ...DEVELOPER_PLATFORM_PERMISSIONS,
    ...BILLING_PERMISSIONS,
    ...TEAM_MANAGEMENT_PERMISSIONS,
    ...TASK_MANAGEMENT_PERMISSIONS,
  ],
  AGENT: [
    ...READ_ONLY,
    PERMISSIONS.CONVERSATIONS_REPLY,
    PERMISSIONS.CONVERSATIONS_TAKEOVER,
    PERMISSIONS.CONVERSATIONS_CLOSE,
    ...TASK_SELF_SERVICE_PERMISSIONS,
  ],
  VIEWER: [...READ_ONLY, ...TASK_SELF_SERVICE_PERMISSIONS],
  DEVELOPER: [
    ...READ_ONLY,
    PERMISSIONS.INTEGRATIONS_MANAGE,
    PERMISSIONS.DEVELOPER_MANAGE,
    ...DEVELOPER_PLATFORM_PERMISSIONS,
    PERMISSIONS.USAGE_VIEW,
    ...TASK_SELF_SERVICE_PERMISSIONS,
  ],
};

export function getPermissionsForRole(role) {
  if (role === "SUPER_ADMIN") return [...ALL];
  return [...(ROLE_PERMISSIONS[role] || [])];
}

// UX-only check — hides/shows nav items and buttons. Never the
// actual gate on a mutation; the backend always re-checks.
export function can(role, permission) {
  return getPermissionsForRole(role).includes(permission);
}
