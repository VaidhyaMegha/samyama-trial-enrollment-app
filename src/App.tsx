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
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Eligibility check page coming soon...</p>
                    </div>
                  </AppLayout>
                }
              />
              <Route
                path="/protocols"
                element={
                  <AppLayout>
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Protocol management page coming soon...</p>
                    </div>
                  </AppLayout>
                }
              />
              <Route
                path="/enrollment"
                element={
                  <AppLayout>
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Enrollment page coming soon...</p>
                    </div>
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
