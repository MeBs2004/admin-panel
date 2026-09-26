import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return <Tabs tabs={TAB_ROUTES} active={pathname} onChange={navigate} />;
}
