import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { NotificationSettings } from './components/notifications/NotificationSettings';
import { useNotifications } from './hooks/useNotifications';
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import ChatIA from "./pages/ChatIA";
import Projetos from "./pages/Projetos";
import QualityGates from "./pages/QualityGates";
import Deployments from "./pages/Deployments";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DetailedInnovationProject from "./components/DetailedInnovationProject";

// Pages
import { LoginPage } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { DiscoveryPage } from './pages/Discovery'
import { ProjectsPage } from './pages/Projects'
import { QualityGatesPage } from './pages/QualityGates'
import { DeploymentsPage } from './pages/Deployments'
import { ChatPage } from './pages/Chat'

// Importar componentes de qualidade
import { NonConformities } from './pages/Quality/NonConformities'
import { KPIs } from './pages/Quality/KPIs'

const queryClient = new QueryClient();

function AppContent() {
  const { initialize } = useNotifications()

  useEffect(() => {
    // Inicializar notificações
    initialize()
    
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('🏥 Service Worker MedSênior registrado:', registration)
        })
        .catch(error => {
          console.error('❌ Erro ao registrar Service Worker:', error)
        })
    }
  }, [initialize])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={
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
                  <Route path="/projeto-detalhado" element={
                    <ProtectedRoute>
                      <DetailedInnovationProject onBack={() => window.history.back()} />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/notifications" element={
                    <ProtectedRoute>
                      <Navigation />
                      <NotificationSettings />
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              
              {/* PWA Install Prompt */}
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const App = () => <AppContent />;

// Components
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

function AppContent() {
  const { initialize } = useNotifications()

  useEffect(() => {
    // Inicializar notificações
    initialize()
    
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('🏥 Service Worker MedSênior registrado:', registration)
        })
        .catch(error => {
          console.error('❌ Erro ao registrar Service Worker:', error)
        })
    }
  }, [initialize])

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/discovery" element={
          <ProtectedRoute>
            <Layout>
              <DiscoveryPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/projects" element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/quality-gates" element={
          <ProtectedRoute>
            <Layout>
              <QualityGatesPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/deployments" element={
          <ProtectedRoute>
            <Layout>
              <DeploymentsPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <Layout>
              <ChatPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings/notifications" element={
          <ProtectedRoute>
            <Layout>
              <NotificationSettings />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
