import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock MedSênior services
vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithIdToken: vi.fn(),
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    }
  }
}))

// Mock Azure AD
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    loginPopup: vi.fn().mockResolvedValue({
      account: {
        username: 'test@medsenior.com.br',
        name: 'Teste MedSênior'
      },
      idToken: 'mock-token'
    }),
    logoutPopup: vi.fn().mockResolvedValue(undefined),
    getAllAccounts: vi.fn().mockReturnValue([{
      username: 'test@medsenior.com.br',
      name: 'Teste MedSênior'
    }]),
    acquireTokenSilent: vi.fn().mockResolvedValue({
      accessToken: 'mock-access-token'
    })
  }))
}))

// Mock NotificationService
vi.mock('@/services/notifications/NotificationService', () => ({
  MedSeniorNotificationService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      showNotification: vi.fn().mockResolvedValue(undefined),
      requestNotificationPermission: vi.fn().mockResolvedValue(true),
      isSupported: vi.fn().mockReturnValue(true)
    }))
  }
}))

// Mock TeamsIntegrationService
vi.mock('@/services/integrations/TeamsIntegrationService', () => ({
  TeamsIntegrationService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      sendMessageToChannel: vi.fn().mockResolvedValue(undefined),
      isRunningInTeams: vi.fn().mockReturnValue(false)
    }))
  }
}))

// Mock BackupService
vi.mock('@/services/backup/BackupService', () => ({
  BackupService: {
    getInstance: vi.fn(() => ({
      performBackup: vi.fn().mockResolvedValue({
        id: 'test-backup',
        status: 'completed',
        timestamp: new Date().toISOString()
      }),
      listBackups: vi.fn().mockResolvedValue([]),
      isBackupRunning: vi.fn().mockReturnValue(false)
    }))
  }
}))

// Mock MLAnalyticsService
vi.mock('@/services/analytics/MLAnalyticsService', () => ({
  MLAnalyticsService: {
    getInstance: vi.fn(() => ({
      predictROI: vi.fn().mockResolvedValue({
        type: 'roi',
        value: 45,
        confidence: 0.85,
        factors: []
      }),
      generateInsights: vi.fn().mockResolvedValue([]),
      getSummaryMetrics: vi.fn().mockReturnValue({
        totalProjects: 10,
        completedProjects: 8,
        averageROI: 42,
        qualityRate: 95
      })
    }))
  }
}))

// Mock PDFReportService
vi.mock('@/services/reports/PDFReportService', () => ({
  MedSeniorPDFReportService: {
    getInstance: vi.fn(() => ({
      generateProjectReport: vi.fn().mockResolvedValue(new Blob()),
      generateAnalyticsReport: vi.fn().mockResolvedValue(new Blob()),
      downloadPDF: vi.fn().mockResolvedValue(undefined)
    }))
  }
}))

// Mock ProcessAnalyzer
vi.mock('@/services/ai/ProcessAnalyzer', () => ({
  ProcessAnalyzerService: {
    getInstance: vi.fn(() => ({
      analyzeProcess: vi.fn().mockResolvedValue({
        analysis: 'Análise mock do processo',
        insights: [
          { description: 'Insight 1', confidence: 0.9, impact: 'Alto' }
        ],
        recommendations: ['Recomendação 1'],
        pdd: 'PDD mock gerado'
      }),
      generatePDD: vi.fn().mockResolvedValue('PDD mock completo'),
      getRecommendations: vi.fn().mockResolvedValue(['Recomendação mock'])
    }))
  }
}))

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user',
      email: 'test@medsenior.com.br',
      name: 'Teste MedSênior',
      role: 'analyst',
      permissions: {
        discovery: { create: true, read: true, update: true, delete: false },
        projects: { create: true, read: true, update: true, delete: false, approve: false },
        qualityGates: { g1: true, g2: true, g3: false, g4: false },
        analytics: { view: true, export: false, advanced: false },
        administration: { users: false, settings: false, audit: false }
      }
    },
    isLoading: false,
    error: null,
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    hasPermission: vi.fn().mockReturnValue(true),
    canAccessModule: vi.fn().mockReturnValue(true)
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Mock useNotifications hook
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    isSupported: true,
    permission: 'granted',
    isInitialized: true,
    requestPermission: vi.fn().mockResolvedValue(true),
    showNotification: vi.fn().mockResolvedValue(undefined),
    notifyQualityGateApproval: vi.fn().mockResolvedValue(undefined),
    notifyAutomationDeployed: vi.fn().mockResolvedValue(undefined),
    clearNotifications: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock useProjects hook
vi.mock('@/hooks/useProjects', () => ({
  useProjects: vi.fn(() => ({
    projects: [
      {
        id: '1',
        name: 'Automação de Faturamento',
        description: 'Automação do processo de faturamento',
        status: 'desenvolvimento',
        priority: 'alta',
        complexity: 8,
        estimated_roi: 45,
        start_date: '2024-01-15',
        target_date: '2024-03-15',
        owner: 'Teste MedSênior'
      }
    ],
    loading: false,
    error: null,
    createProject: vi.fn().mockResolvedValue(undefined),
    updateProject: vi.fn().mockResolvedValue(undefined),
    deleteProject: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted')
  }
})

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      active: { postMessage: vi.fn() }
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
})

// Mock PushManager
Object.defineProperty(window, 'PushManager', {
  writable: true,
  value: {
    supported: true
  }
})

// Mock URL.createObjectURL
URL.createObjectURL = vi.fn(() => 'mock-url')
URL.revokeObjectURL = vi.fn()

// Mock window.scrollTo
window.scrollTo = vi.fn()

// Setup e teardown
beforeAll(() => {
  // Configurar ambiente de teste
  console.log('🧪 Configurando ambiente de testes MedSênior...')
})

beforeEach(() => {
  // Limpar mocks antes de cada teste
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})

afterEach(() => {
  // Limpar DOM após cada teste
  cleanup()
})

afterAll(() => {
  // Limpeza final
  console.log('✅ Testes MedSênior finalizados')
})

// Configurações globais de teste
export const testConfig = {
  timeout: 10000,
  retries: 2,
  slowTestThreshold: 1000
}

// Utilitários de teste
export const testUtils = {
  // Simular usuário MedSênior
  mockMedSeniorUser: {
    id: 'test-user-id',
    email: 'test@medsenior.com.br',
    name: 'Teste MedSênior',
    department: 'CoE Automação',
    role: 'analyst' as const,
    permissions: {
      discovery: { create: true, read: true, update: true, delete: false },
      projects: { create: true, read: true, update: true, delete: false, approve: false },
      qualityGates: { g1: true, g2: true, g3: false, g4: false },
      analytics: { view: true, export: false, advanced: false },
      administration: { users: false, settings: false, audit: false }
    },
    company: 'MedSênior',
    theme: 'medsenior' as const,
    accessibility: {
      highContrast: false,
      fontSize: 'normal' as const,
      reducedMotion: false
    }
  },

  // Simular projeto MedSênior
  mockMedSeniorProject: {
    id: 'test-project-id',
    name: 'Automação de Faturamento',
    description: 'Automação do processo de faturamento da MedSênior',
    status: 'desenvolvimento',
    priority: 'alta',
    complexity: 8,
    estimated_roi: 45,
    actual_roi: 52,
    start_date: '2024-01-15',
    target_date: '2024-03-15',
    owner: 'Teste MedSênior',
    team_size: 4,
    budget: 50000,
    quality_gates_passed: 2,
    total_quality_gates: 4
  },

  // Simular análise de discovery
  mockDiscoveryAnalysis: {
    process_name: 'Validação de Documentos Médicos',
    analysis: 'Processo manual que pode ser automatizado com RPA',
    insights: [
      {
        description: 'Alto potencial de automação',
        confidence: 0.95,
        impact: 'Alto'
      },
      {
        description: 'ROI estimado de 45%',
        confidence: 0.88,
        impact: 'Médio'
      }
    ],
    recommendations: [
      'Implementar RPA para validação automática',
      'Integrar com sistema de documentos',
      'Criar dashboard de monitoramento'
    ],
    pdd: 'PDD completo para automação de validação de documentos'
  },

  // Simular dados de analytics
  mockAnalyticsData: {
    total_projects: 15,
    active_projects: 8,
    completed_projects: 7,
    total_roi: 42.5,
    time_saved: 1200,
    ideation_count: 3,
    planning_count: 4,
    development_count: 5,
    production_count: 3
  }
}

// Configurações de teste específicas do MedSênior
export const medSeniorTestConfig = {
  // Cores MedSênior para testes de acessibilidade
  colors: {
    primary: '#327746',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8'
  },

  // Tempos de resposta esperados
  performance: {
    pageLoad: 3000, // 3 segundos
    apiResponse: 1000, // 1 segundo
    animation: 300 // 300ms
  },

  // Configurações de acessibilidade
  accessibility: {
    minContrastRatio: 4.5,
    minTouchTarget: 44, // pixels
    maxFontSize: 24 // pixels
  }
} 