import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/ui/notification";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import EnterprisePage from "@/pages/EnterprisePage";
import GraphPage from "@/pages/GraphPage";
import ProspectsPage from "@/pages/ProspectsPage";
import ProspectDetailPage from "@/pages/ProspectDetailPage";
import SearchPage from "@/pages/SearchPage";
import ClientsPage from "@/pages/ClientsPage";
import DataPage from "@/pages/DataPage";
import SettingsPage from "@/pages/SettingsPage";
import DataImportPage from "@/pages/DataImportPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// 路由配置
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute requiredPermission="view_dashboard">
        <HomePage />
      </ProtectedRoute>
    )
  },
  {
    path: "/enterprise",
    element: (
      <ProtectedRoute requiredPermission="view_enterprise">
        <EnterprisePage />
      </ProtectedRoute>
    )
  },
  {
    path: "/enterprise/:id",
    element: (
      <ProtectedRoute requiredPermission="view_enterprise">
        <EnterprisePage />
      </ProtectedRoute>
    )
  },
  {
    path: "/graph",
    element: (
      <ProtectedRoute requiredPermission="view_graph">
        <GraphPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/prospects",
    element: (
      <ProtectedRoute requiredPermission="view_prospects">
        <ProspectsPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/prospect/:id",
    element: (
      <ProtectedRoute requiredPermission="view_prospects">
        <ProspectDetailPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/search",
    element: (
      <ProtectedRoute requiredPermission="view_search">
        <SearchPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/clients",
    element: (
      <ProtectedRoute requiredPermission="view_clients">
        <ClientsPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/data",
    element: (
      <ProtectedRoute requiredPermission="manage_data">
        <DataPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute requiredPermission="view_dashboard">
        <SettingsPage />
      </ProtectedRoute>
    )
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <NotificationProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </NotificationProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
