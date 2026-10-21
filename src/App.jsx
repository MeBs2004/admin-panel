import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import CompanyLayout from "./components/layout/CompanyLayout.jsx";
import ProtectedRoute, { PlatformOnly, CompanyOnly } from "./components/layout/ProtectedRoute.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";

// Every page is its own chunk, loaded when it is first opened: the landing
// page (and each panel) only downloads the code it actually shows.
const Login = lazy(() => import("./pages/Login.jsx"));
const CompanyLogin = lazy(() => import("./pages/CompanyLogin.jsx"));
const CompanySignup = lazy(() => import("./pages/CompanySignup.jsx"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite.jsx"));
const PublicInstall = lazy(() => import("./pages/PublicInstall.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AuditLogs = lazy(() => import("./pages/AuditLogs.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.jsx"));
const Forbidden = lazy(() => import("./pages/Forbidden.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const UsersList = lazy(() => import("./pages/users/UsersList.jsx"));
const UserDetail = lazy(() => import("./pages/users/UserDetail.jsx"));
const RolesPermissions = lazy(() => import("./pages/team/RolesPermissions.jsx"));
const CompaniesList = lazy(() => import("./pages/companies/CompaniesList.jsx"));
const CompanyDetail = lazy(() => import("./pages/companies/CompanyDetail.jsx"));
const ChatbotsList = lazy(() => import("./pages/chatbots/ChatbotsList.jsx"));
const ChatbotDetail = lazy(() => import("./pages/chatbots/ChatbotDetail.jsx"));
const ChatbotInstall = lazy(() => import("./pages/chatbots/ChatbotInstall.jsx"));
const ChatbotAiSettings = lazy(() => import("./pages/chatbots/aiSettings/ChatbotAiSettings.jsx"));
const ChatbotChannels = lazy(() => import("./pages/chatbots/ChatbotChannels.jsx"));
const ChatbotKnowledge = lazy(() => import("./pages/chatbots/knowledge/ChatbotKnowledge.jsx"));
const CreateChatbotWizard = lazy(() => import("./pages/chatbots/create/CreateChatbotWizard.jsx"));
const ChatbotStudio = lazy(() => import("./pages/chatbots/studio/ChatbotStudio.jsx"));
const ChatbotBuilder = lazy(() => import("./pages/chatbots/builder/ChatbotBuilder.jsx"));
const LiveView = lazy(() => import("./pages/liveview/LiveView.jsx"));
const TasksList = lazy(() => import("./pages/tasks/TasksList.jsx"));
const VisitorsList = lazy(() => import("./pages/visitors/VisitorsList.jsx"));
const VisitorDetail = lazy(() => import("./pages/visitors/VisitorDetail.jsx"));
const ConversationsInbox = lazy(() => import("./pages/conversations/ConversationsInbox.jsx"));
const DeveloperOverview = lazy(() => import("./pages/developer/DeveloperOverview.jsx"));
const ApiKeysPage = lazy(() => import("./pages/developer/ApiKeysPage.jsx"));
const WebhooksPage = lazy(() => import("./pages/developer/WebhooksPage.jsx"));
const UsagePage = lazy(() => import("./pages/developer/UsagePage.jsx"));
const ApiDocumentation = lazy(() => import("./pages/developer/ApiDocumentation.jsx"));
const DeveloperSettings = lazy(() => import("./pages/developer/DeveloperSettings.jsx"));
const BillingOverview = lazy(() => import("./pages/billing/BillingOverview.jsx"));
const PlansPage = lazy(() => import("./pages/billing/PlansPage.jsx"));
const BillingUsagePage = lazy(() => import("./pages/billing/UsagePage.jsx"));
const BillingHistoryPage = lazy(() => import("./pages/billing/BillingHistoryPage.jsx"));
const BillingSettingsPage = lazy(() => import("./pages/billing/BillingSettingsPage.jsx"));
const CompanyOverview = lazy(() => import("./pages/company/CompanyOverview.jsx"));
const CompanySettings = lazy(() => import("./pages/company/CompanySettings.jsx"));

const Landing = lazy(() => import("./pages/landing/Landing.jsx"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<div className="min-h-screen bg-[#f2f7f4]" />}>
            <Landing />
          </Suspense>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/company/login" element={<CompanyLogin />} />
      <Route path="/company/signup" element={<CompanySignup />} />
      <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      {/* Public, no login: install instructions shared with a website's developer. */}
      <Route path="/install/:chatbotId" element={<PublicInstall />} />

      {/* Full-viewport takeover, own top bar — deliberately not
          nested inside AdminLayout (no outer sidebar/header), same
          as how a design tool's canvas/builder view works. */}
      <Route
        path="/chatbots/:id/customize"
        element={
          <PlatformOnly>
            <ChatbotStudio />
          </PlatformOnly>
        }
      />

      <Route
        path="/chatbots/:id/builder"
        element={
          <PlatformOnly>
            <ChatbotBuilder />
          </PlatformOnly>
        }
      />

      {/* Nuform platform shell — SUPER_ADMIN only (see PlatformOnly). */}
      <Route
        element={
          <PlatformOnly>
            <AdminLayout />
          </PlatformOnly>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live-view" element={<LiveView />} />
        <Route path="/tasks" element={<TasksList />} />

        <Route path="/users" element={<UsersList />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/roles-permissions" element={<RolesPermissions />} />

        <Route path="/companies" element={<CompaniesList />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />

        <Route path="/chatbots" element={<ChatbotsList />} />
        <Route path="/chatbots/new" element={<CreateChatbotWizard />} />
        <Route path="/chatbots/:id" element={<ChatbotDetail />} />
        <Route path="/chatbots/:id/install" element={<ChatbotInstall />} />
        <Route path="/chatbots/:id/channels" element={<ChatbotChannels />} />
        <Route path="/chatbots/:id/ai-settings" element={<ChatbotAiSettings />} />
        <Route path="/chatbots/:id/knowledge" element={<ChatbotKnowledge />} />

        <Route path="/visitors" element={<VisitorsList />} />
        <Route path="/visitors/:id" element={<VisitorDetail />} />

        <Route path="/conversations" element={<ConversationsInbox />} />
        <Route path="/conversations/:companyId/:visitorId" element={<ConversationsInbox />} />

        <Route path="/reports" element={<Reports />} />

        <Route
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "COMPANY_ADMIN", "DEVELOPER"]}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/developer" element={<DeveloperOverview />} />
          <Route path="/developer/api-keys" element={<ApiKeysPage />} />
          <Route path="/developer/webhooks" element={<WebhooksPage />} />
          <Route path="/developer/usage" element={<UsagePage />} />
          <Route path="/developer/docs" element={<ApiDocumentation />} />
          <Route path="/developer/settings" element={<DeveloperSettings />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "COMPANY_ADMIN", "DEVELOPER"]}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/billing" element={<BillingOverview />} />
          <Route path="/billing/plans" element={<PlansPage />} />
          <Route path="/billing/usage" element={<BillingUsagePage />} />
          <Route path="/billing/history" element={<BillingHistoryPage />} />
          <Route path="/billing/settings" element={<BillingSettingsPage />} />
        </Route>

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN", "COMPANY_ADMIN"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<Settings />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/forbidden" element={<Forbidden />} />
      </Route>

      {/* Company Panel — every non-Super-Admin user. Reuses the same
          page components as the platform shell; those pages build
          their links with utils/panelPath.js so they never leave this
          shell. Studio/Builder render full-viewport, outside any
          sidebar, same as on the platform side. */}
      <Route
        path="/company/chatbots/:id/customize"
        element={
          <CompanyOnly>
            <ChatbotStudio />
          </CompanyOnly>
        }
      />
      <Route
        path="/company/chatbots/:id/builder"
        element={
          <CompanyOnly>
            <ChatbotBuilder />
          </CompanyOnly>
        }
      />

      <Route
        element={
          <CompanyOnly>
            <CompanyLayout />
          </CompanyOnly>
        }
      >
        <Route path="/company" element={<Navigate to="/company/overview" replace />} />
        <Route path="/company/overview" element={<CompanyOverview />} />
        <Route path="/company/chatbots" element={<ChatbotsList />} />
        <Route path="/company/chatbots/new" element={<CreateChatbotWizard />} />
        <Route path="/company/chatbots/:id" element={<ChatbotDetail />} />
        <Route path="/company/chatbots/:id/install" element={<ChatbotInstall />} />
        <Route path="/company/chatbots/:id/channels" element={<ChatbotChannels />} />
        <Route path="/company/chatbots/:id/ai-settings" element={<ChatbotAiSettings />} />
        <Route path="/company/chatbots/:id/knowledge" element={<ChatbotKnowledge />} />
        <Route path="/company/conversations" element={<ConversationsInbox />} />
        <Route path="/company/conversations/:companyId/:visitorId" element={<ConversationsInbox />} />
        <Route path="/company/visitors" element={<VisitorsList />} />
        <Route path="/company/visitors/:id" element={<VisitorDetail />} />
        <Route path="/company/analytics" element={<Reports />} />
        <Route path="/company/team" element={<UsersList />} />
        <Route path="/company/team/:id" element={<UserDetail />} />

        <Route
          element={
            <ProtectedRoute roles={["COMPANY_ADMIN", "DEVELOPER"]}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/company/billing" element={<BillingOverview />} />
          <Route path="/company/billing/plans" element={<PlansPage />} />
          <Route path="/company/billing/usage" element={<BillingUsagePage />} />
          <Route path="/company/billing/history" element={<BillingHistoryPage />} />
          <Route path="/company/billing/settings" element={<BillingSettingsPage />} />

          <Route path="/company/developer" element={<DeveloperOverview />} />
          <Route path="/company/developer/api-keys" element={<ApiKeysPage />} />
          <Route path="/company/developer/webhooks" element={<WebhooksPage />} />
          <Route path="/company/developer/usage" element={<UsagePage />} />
          <Route path="/company/developer/docs" element={<ApiDocumentation />} />
          <Route path="/company/developer/settings" element={<DeveloperSettings />} />
        </Route>

        <Route path="/company/settings" element={<CompanySettings />} />
        <Route path="/company/account" element={<Settings />} />
        <Route path="/company/forbidden" element={<Forbidden />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default App;
