import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import EligibilityCheck from "./pages/EligibilityCheck";
import Protocols from "./pages/Protocols";
import Screening from "./pages/Screening";
import Matches from "./pages/Matches";
import Patients from "./pages/Patients";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProcessingMonitor from "./pages/admin/ProcessingMonitor";
import AuditTrail from "./pages/admin/AuditTrail";
import SystemLogs from "./pages/admin/SystemLogs";
import PITrials from "./pages/pi/PITrials";
import PITrialDetail from "./pages/pi/PITrialDetail";
import RoleManagement from "./pages/admin/RoleManagement";
import WorkflowConfiguration from "./pages/admin/WorkflowConfiguration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                }
              />
              <Route
                path="/eligibility-check"
                element={
                  <AppLayout>
                    <EligibilityCheck />
                  </AppLayout>
                }
              />
              <Route
                path="/protocols"
                element={
                  <AppLayout>
                    <Protocols />
                  </AppLayout>
                }
              />
              <Route
                path="/screening"
                element={
                  <AppLayout>
                    <Screening />
                  </AppLayout>
                }
              />
              <Route
                path="/matches"
                element={
                  <AppLayout>
                    <Matches />
                  </AppLayout>
                }
              />
              <Route
                path="/patients"
                element={
                  <AppLayout>
                    <Patients />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/processing"
                element={
                  <AppLayout>
                    <ProcessingMonitor />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <AppLayout>
                    <AuditTrail />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <AppLayout>
                    <SystemLogs />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <AppLayout>
                    <RoleManagement />
                  </AppLayout>
                }
              />
              <Route
                path="/admin/workflows"
                element={
                  <AppLayout>
                    <WorkflowConfiguration />
                  </AppLayout>
                }
              />
              <Route
                path="/pi/trials"
                element={
                  <AppLayout>
                    <PITrials />
                  </AppLayout>
                }
              />
              <Route
                path="/pi/trials/:trialId"
                element={
                  <AppLayout>
                    <PITrialDetail />
                  </AppLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
