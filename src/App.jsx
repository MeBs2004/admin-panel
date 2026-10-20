import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
// Admin Panel
import Login from "./pages/Login.jsx";
import CompanyLogin from "./pages/CompanyLogin.jsx";
import CompanySignup from "./pages/CompanySignup.jsx";
import AcceptInvite from "./pages/AcceptInvite.jsx";
import PublicInstall from "./pages/PublicInstall.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Settings from "./pages/Settings.jsx";
import Reports from "./pages/Reports.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import Forbidden from "./pages/Forbidden.jsx";
import NotFound from "./pages/NotFound.jsx";

import UsersList from "./pages/users/UsersList.jsx";
import UserDetail from "./pages/users/UserDetail.jsx";
import RolesPermissions from "./pages/team/RolesPermissions.jsx";

import CompaniesList from "./pages/companies/CompaniesList.jsx";
import CompanyDetail from "./pages/companies/CompanyDetail.jsx";

import ChatbotsList from "./pages/chatbots/ChatbotsList.jsx";
import ChatbotDetail from "./pages/chatbots/ChatbotDetail.jsx";
import ChatbotInstall from "./pages/chatbots/ChatbotInstall.jsx";
import ChatbotAiSettings from "./pages/chatbots/aiSettings/ChatbotAiSettings.jsx";
import ChatbotChannels from "./pages/chatbots/ChatbotChannels.jsx";
import ChatbotKnowledge from "./pages/chatbots/knowledge/ChatbotKnowledge.jsx";
import CreateChatbotWizard from "./pages/chatbots/create/CreateChatbotWizard.jsx";
import ChatbotStudio from "./pages/chatbots/studio/ChatbotStudio.jsx";
import ChatbotBuilder from "./pages/chatbots/builder/ChatbotBuilder.jsx";

import LiveView from "./pages/liveview/LiveView.jsx";
import TasksList from "./pages/tasks/TasksList.jsx";

import VisitorsList from "./pages/visitors/VisitorsList.jsx";
import VisitorDetail from "./pages/visitors/VisitorDetail.jsx";

import ConversationsInbox from "./pages/conversations/ConversationsInbox.jsx";

import DeveloperOverview from "./pages/developer/DeveloperOverview.jsx";
import ApiKeysPage from "./pages/developer/ApiKeysPage.jsx";
import WebhooksPage from "./pages/developer/WebhooksPage.jsx";
import UsagePage from "./pages/developer/UsagePage.jsx";
import ApiDocumentation from "./pages/developer/ApiDocumentation.jsx";
import DeveloperSettings from "./pages/developer/DeveloperSettings.jsx";

import BillingOverview from "./pages/billing/BillingOverview.jsx";
import PlansPage from "./pages/billing/PlansPage.jsx";
import BillingUsagePage from "./pages/billing/UsagePage.jsx";
import BillingHistoryPage from "./pages/billing/BillingHistoryPage.jsx";
import BillingSettingsPage from "./pages/billing/BillingSettingsPage.jsx";

import AdminLayout from "./components/layout/AdminLayout.jsx";
import CompanyLayout from "./components/layout/CompanyLayout.jsx";
import ProtectedRoute, { PlatformOnly } from "./components/layout/ProtectedRoute.jsx";

import CompanyOverview from "./pages/company/CompanyOverview.jsx";
import CompanySettings from "./pages/company/CompanySettings.jsx";

// The public marketing page is its own chunk, so the panels never load it.
const Landing = lazy(() => import("./pages/landing/Landing.jsx"));

function App() {
  return (
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
          <ProtectedRoute>
            <ChatbotStudio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/chatbots/:id/builder"
        element={
          <ProtectedRoute>
            <ChatbotBuilder />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <CompanyLayout />
          </ProtectedRoute>
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
  );
}

export default App;
