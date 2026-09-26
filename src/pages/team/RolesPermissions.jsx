import PageHeader from "../../components/ui/PageHeader.jsx";
import { PERMISSIONS, getPermissionsForRole } from "../../utils/permissions.js";

const ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT", "VIEWER", "DEVELOPER"];

const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: "Platform-level administration — every company, every chatbot, platform configuration.",
  COMPANY_ADMIN: "Full administration of the companies they belong to: users, chatbots, access, knowledge, integrations.",
  AGENT: "Operational: reply to visitors, take over and close conversations. Cannot manage users or credentials.",
  VIEWER: "Read-only access to everything they can see. Cannot reply, take over, or change any configuration.",
  DEVELOPER: "Technical scope: channels and integrations (e.g. webhooks). No user, billing, or platform administration.",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export default function RolesPermissions() {
  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="What each role can do, enforced by the backend on every request — this page is a read-only reference, not a configuration screen."
      />

      <div className="space-y-4">
        {ROLES.map((role) => {
          const granted = new Set(role === "SUPER_ADMIN" ? ALL_PERMISSIONS : getPermissionsForRole(role));
          return (
            <div
              key={role}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:bg-[var(--surface)] dark:border-[var(--border)]"
            >
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {role.replaceAll("_", " ")}
              </h3>
              <p className="mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                {ROLE_DESCRIPTIONS[role]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role === "SUPER_ADMIN" ? (
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                    All permissions
                  </span>
                ) : (
                  ALL_PERMISSIONS.map((perm) => (
                    <span
                      key={perm}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        granted.has(perm)
                          ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                          : "bg-gray-100 text-gray-400 line-through dark:bg-white/5 dark:text-gray-600"
                      }`}
                    >
                      {perm}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        This matrix is company-scoped: a role applies within a company a user has been granted access to (see the
        Company Access section on each user's profile), except Super Admin, which is platform-wide.
      </p>
    </div>
  );
}
