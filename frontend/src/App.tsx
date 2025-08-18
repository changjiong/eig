import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import EnterprisePage from "@/pages/EnterprisePage";
import GraphPage from "@/pages/GraphPage";
import ProspectsPage from "@/pages/ProspectsPage";
import SearchPage from "@/pages/SearchPage";
import ClientsPage from "@/pages/ClientsPage";
import DataPage from "@/pages/DataPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 公开路由 - 登录页面 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 受保护的路由 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/enterprise" 
              element={
                <ProtectedRoute requiredPermission="view_enterprise">
                  <EnterprisePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/enterprise/:id" 
              element={
                <ProtectedRoute requiredPermission="view_enterprise">
                  <EnterprisePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/graph" 
              element={
                <ProtectedRoute requiredPermission="view_graph">
                  <GraphPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/prospects" 
              element={
                <ProtectedRoute requiredPermission="view_prospects">
                  <ProspectsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/prospects/:id" 
              element={
                <ProtectedRoute requiredPermission="view_enterprise">
                  <EnterprisePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/search" 
              element={
                <ProtectedRoute requiredPermission="view_search">
                  <SearchPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute requiredPermission="view_clients">
                  <ClientsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/data" 
              element={
                <ProtectedRoute 
                  requiredPermission="manage_data"
                  allowedRoles={['admin', 'manager']}
                >
                  <DataPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* 404页面 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
