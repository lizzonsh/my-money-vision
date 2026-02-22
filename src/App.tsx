import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import React, { Suspense } from "react";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const ExpensesPage = React.lazy(() => import("@/pages/ExpensesPage"));
const IncomePage = React.lazy(() => import("@/pages/IncomePage"));
const SavingsPage = React.lazy(() => import("@/pages/SavingsPage"));
const GoalsPage = React.lazy(() => import("@/pages/GoalsPage"));
const SettingsPage = React.lazy(() => import("@/pages/SettingsPage"));
const IssuesPage = React.lazy(() => import("@/pages/IssuesPage"));
const LoginPage = React.lazy(() => import("@/pages/LoginPage"));
const SignupPage = React.lazy(() => import("@/pages/SignupPage"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FinanceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <Dashboard />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <ExpensesPage />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/income"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <IncomePage />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/savings"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <SavingsPage />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <GoalsPage />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <SettingsPage />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues"
                element={
                  <ProtectedRoute>
                    <Sidebar>
                      <IssuesPage />
                    </Sidebar>
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
