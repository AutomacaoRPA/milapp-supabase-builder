import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import ChatIA from "./pages/ChatIA";
import Projetos from "./pages/Projetos";
import QualityGates from "./pages/QualityGates";
import Deployments from "./pages/Deployments";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigation />
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Navigation />
                  <ChatIA />
                </ProtectedRoute>
              } />
              <Route path="/projetos" element={
                <ProtectedRoute>
                  <Navigation />
                  <Projetos />
                </ProtectedRoute>
              } />
              <Route path="/quality-gates" element={
                <ProtectedRoute>
                  <Navigation />
                  <QualityGates />
                </ProtectedRoute>
              } />
              <Route path="/deployments" element={
                <ProtectedRoute>
                  <Navigation />
                  <Deployments />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
