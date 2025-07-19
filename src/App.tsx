import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Sonner } from 'sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

// Contexts
import { AuthProvider } from './contexts/AuthContext'
import { useNotifications } from './hooks/useNotifications'

// Components
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { InstallPrompt } from './components/pwa/InstallPrompt'
import { Navigation } from './components/Navigation'

// Pages
import { Auth } from './pages/Auth'
import { Index } from './pages/Index'
import { Dashboard } from './pages/Dashboard'
import { ChatIA } from './pages/ChatIA'
import { Projetos } from './pages/Projetos'
import { QualityGates } from './pages/QualityGates'
import { Deployments } from './pages/Deployments'
import { DetailedInnovationProject } from './components/DetailedInnovationProject'
import { NotificationSettings } from './components/notifications/NotificationSettings'
import { NotFound } from './pages/NotFound'

// Theme
import { theme } from './styles/medsenior-theme'

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

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
            <Router>
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
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  )
}

export default App
