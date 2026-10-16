import { useLocation } from "react-router-dom";
import { usePanel } from "../../utils/panelPath.js";
import Tabs from "../../components/ui/Tabs.jsx";

const TAB_ROUTES = [
  { value: "/billing", label: "Overview" },
  { value: "/billing/plans", label: "Plans" },
  { value: "/billing/usage", label: "Usage" },
  { value: "/billing/history", label: "Billing History" },
  { value: "/billing/settings", label: "Settings" },
];

export default function BillingTabs() {
  const { navigate, path: panelPath } = usePanel();
  const { pathname } = useLocation();
  // Same tabs in both shells — mapped to /company/... inside the Company Panel.
  const tabs = TAB_ROUTES.map((t) => ({ ...t, value: panelPath(t.value) }));
  return <Tabs tabs={tabs} active={pathname} onChange={navigate} />;
}
