import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { isCompanyPanelPath, toPanelPath, platformEquivalent } from "../../utils/panelPath.js";
import PageLoader from "../ui/PageLoader.jsx";

const Loading = () => <PageLoader />;

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const inCompanyPanel = isCompanyPanelPath(pathname);

  if (loading) return <Loading />;

  if (!user) {
    return <Navigate to={inCompanyPanel ? "/company/login" : "/login"} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={inCompanyPanel ? "/company/forbidden" : "/forbidden"} replace />;
  }

  return children;
}

/**
 * The Nuform platform shell is for SUPER_ADMIN only. Anyone else who
 * lands on a platform URL (an old bookmark, a hard-coded link, the
 * default post-login "/dashboard") is sent to the same page inside
 * the Company Panel, or its overview if there's no equivalent.
 * UX only — the backend scopes every request regardless.
 */
export function PlatformOnly({ children }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== "SUPER_ADMIN") {
    return <Navigate to={toPanelPath(pathname + search, true)} replace />;
  }

  return children;
}

/**
 * The Company Panel is for company accounts only. A super admin who opens a
 * company URL (old bookmark, shared link) is sent to the same page in the
 * super-admin panel — the two panels never mix.
 */
export function CompanyOnly({ children }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/company/login" replace />;

  if (user.role === "SUPER_ADMIN") {
    return <Navigate to={platformEquivalent(pathname + search)} replace />;
  }

  return children;
}
