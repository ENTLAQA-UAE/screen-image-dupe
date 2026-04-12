import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { OrganizationBrandingProvider } from "@/contexts/OrganizationBrandingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Assessments from "./pages/Assessments";
import AssessmentBuilder from "./pages/AssessmentBuilder";
import AssessmentPreview from "./pages/AssessmentPreview";
import AssessmentGroups from "./pages/AssessmentGroups";
import GroupReport from "./pages/GroupReport";
import Reports from "./pages/Reports";
import Participants from "./pages/Participants";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import QuestionBank from "./pages/QuestionBank";
import OrganizationSettings from "./pages/OrganizationSettings";
import TakeAssessment from "./pages/TakeAssessment";
import Auth from "./pages/Auth";
import SuperAdmin from "./pages/SuperAdmin";
import UserManagement from "./pages/UserManagement";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import PrintPreview from "./pages/PrintPreview";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <OrganizationBrandingProvider>
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
                path="/assessments/new" 
                element={
                  <ProtectedRoute>
                    <AssessmentBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assessments/:assessmentId/preview" 
                element={
                  <ProtectedRoute>
                    <AssessmentPreview />
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
                path="/assessment-groups/:groupId/report" 
                element={
                  <ProtectedRoute>
                    <GroupReport />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Reports />
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
                path="/employees" 
                element={
                  <ProtectedRoute>
                    <Employees />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employees/:email" 
                element={
                  <ProtectedRoute>
                    <EmployeeDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/question-bank" 
                element={
                  <ProtectedRoute>
                    <QuestionBank />
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
                path="/user-management" 
                element={
                  <ProtectedRoute requiredRoles={['org_admin', 'super_admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/subscription" 
                element={
                  <ProtectedRoute requiredRoles={['org_admin', 'super_admin']}>
                    <Subscription />
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
              {/* Public assessment taking page */}
              <Route path="/assess/:token" element={<TakeAssessment />} />
              {/* Print preview page for PDF export */}
              <Route path="/print-preview" element={<PrintPreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
          </OrganizationBrandingProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
