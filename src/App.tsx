import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Assessments from "./pages/Assessments";
import AssessmentGroups from "./pages/AssessmentGroups";
import Participants from "./pages/Participants";
import OrganizationSettings from "./pages/OrganizationSettings";
import Auth from "./pages/Auth";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessments" 
                element={
                  <ProtectedRoute>
                    <Assessments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessment-groups" 
                element={
                  <ProtectedRoute>
                    <AssessmentGroups />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/participants" 
                element={
                  <ProtectedRoute>
                    <Participants />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute requiredRoles={['org_admin', 'super_admin']}>
                    <OrganizationSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/super-admin"
                element={
                  <ProtectedRoute requiredRoles={['super_admin']}>
                    <SuperAdmin />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
