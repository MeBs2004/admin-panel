import { useLocation } from "react-router-dom";
import { usePanel } from "../../utils/panelPath.js";
import Tabs from "../../components/ui/Tabs.jsx";

const TAB_ROUTES = [
  { value: "/developer", label: "Overview" },
  { value: "/developer/api-keys", label: "API Keys" },
  { value: "/developer/webhooks", label: "Webhooks" },
  { value: "/developer/usage", label: "Usage" },
  { value: "/developer/docs", label: "API Documentation" },
  { value: "/developer/settings", label: "Settings" },
];

export default function DeveloperTabs() {
  const { navigate, path: panelPath } = usePanel();
  const { pathname } = useLocation();
  // Same tabs in both shells — mapped to /company/... inside the Company Panel.
  const tabs = TAB_ROUTES.map((t) => ({ ...t, value: panelPath(t.value) }));
  return <Tabs tabs={tabs} active={pathname} onChange={navigate} />;
}
