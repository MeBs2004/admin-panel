import { useNavigate, useLocation } from "react-router-dom";
import Tabs from "../../components/ui/Tabs.jsx";

const TAB_ROUTES = [
  { value: "/billing", label: "Overview" },
  { value: "/billing/plans", label: "Plans" },
  { value: "/billing/usage", label: "Usage" },
  { value: "/billing/history", label: "Billing History" },
  { value: "/billing/settings", label: "Settings" },
];

export default function BillingTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return <Tabs tabs={TAB_ROUTES} active={pathname} onChange={navigate} />;
}
