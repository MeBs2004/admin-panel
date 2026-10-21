import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ======================================================
// Two shells share the same page components: the Nuform platform
// shell (AdminLayout, SUPER_ADMIN only) at "/..." and the Company
// Panel (CompanyLayout) at "/company/...". A shared page must never
// link out of the shell it's rendered in, so every in-app path a
// shared page navigates to goes through toPanelPath().
// ======================================================

// Platform path prefix -> Company Panel equivalent. Anything not
// listed has no company equivalent and falls back to the overview.
const COMPANY_EQUIVALENTS = [
  ["/chatbots", "/company/chatbots"],
  ["/conversations", "/company/conversations"],
  ["/visitors", "/company/visitors"],
  ["/users", "/company/team"],
  ["/reports", "/company/analytics"],
  ["/billing", "/company/billing"],
  ["/settings", "/company/account"],
  ["/developer", "/company/developer"],
];

/** The Company Panel path for a platform path, or null if none. */
export function companyEquivalent(path) {
  for (const [from, to] of COMPANY_EQUIVALENTS) {
    if (path === from || path.startsWith(`${from}/`) || path.startsWith(`${from}?`)) {
      return to + path.slice(from.length);
    }
  }
  return null;
}

/**
 * The super-admin (platform) page for a Company Panel path — used to send a
 * super admin who opens a company URL to the same page in their own panel.
 * Anything without an equivalent goes to the dashboard.
 */
export function platformEquivalent(path) {
  if (typeof path !== "string") return "/dashboard";
  for (const [from, to] of COMPANY_EQUIVALENTS) {
    if (path === to || path.startsWith(`${to}/`) || path.startsWith(`${to}?`)) {
      return from + path.slice(to.length);
    }
  }
  return "/dashboard";
}

export function toPanelPath(path, inCompanyPanel) {
  if (!inCompanyPanel || typeof path !== "string" || !path.startsWith("/") || path.startsWith("/company")) {
    return path;
  }
  return companyEquivalent(path) || "/company/overview";
}

export function isCompanyPanelPath(pathname) {
  return pathname === "/company" || pathname.startsWith("/company/");
}

/**
 * { navigate, path, inCompanyPanel } — `navigate` and `path` map
 * platform paths to the current shell automatically.
 */
export function usePanel() {
  const { pathname } = useLocation();
  const rawNavigate = useNavigate();
  const inCompanyPanel = isCompanyPanelPath(pathname);

  const path = useCallback((p) => toPanelPath(p, inCompanyPanel), [inCompanyPanel]);
  const navigate = useCallback(
    (to, options) => rawNavigate(typeof to === "string" ? toPanelPath(to, inCompanyPanel) : to, options),
    [rawNavigate, inCompanyPanel]
  );

  return { navigate, path, inCompanyPanel };
}
