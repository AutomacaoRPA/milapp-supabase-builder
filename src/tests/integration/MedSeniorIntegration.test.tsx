import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, expect, it, describe, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { AuthProvider } from '../../contexts/AuthContext'
import { theme } from '../../styles/theme'
import { Dashboard } from '../../pages/Dashboard'
import { DiscoveryPage } from '../../pages/Discovery'
import { ProjectsPage } from '../../pages/Projects'
import { QualityGatesPage } from '../../pages/QualityGates'
import { testUtils } from '../../test/setup'

// Wrapper para componentes que precisam de contexto
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

describe('MILAPP MedSênior - Testes de Integração', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Integration', () => {
    it('should render dashboard with all MedSênior components', async () => {
      renderWithProviders(<Dashboard />)

      // Verificar elementos principais
      await waitFor(() => {
        expect(screen.getByText('MILAPP MedSênior')).toBeInTheDocument()
        expect(screen.getByText('Centro de Excelência')).toBeInTheDocument()
      })

      // Verificar KPIs
      expect(screen.getByTestId('active-automations')).toBeInTheDocument()
      expect(screen.getByTestId('hours-saved')).toBeInTheDocument()
      expect(screen.getByTestId('roi-metric')).toBeInTheDocument()
      expect(screen.getByTestId('projects-count')).toBeInTheDocument()

      // Verificar gráficos
      expect(screen.getByTestId('roi-chart')).toBeInTheDocument()
      expect(screen.getByTestId('projects-chart')).toBeInTheDocument()

      // Verificar navegação
      expect(screen.getByTestId('discovery-menu')).toBeInTheDocument()
      expect(screen.getByTestId('projects-menu')).toBeInTheDocument()
      expect(screen.getByTestId('quality-gates-menu')).toBeInTheDocument()
    })

    it('should handle period filter changes', async () => {
      renderWithProviders(<Dashboard />)

      const periodFilter = screen.getByTestId('period-filter')
      expect(periodFilter).toBeInTheDocument()

      // Mudar período
      fireEvent.change(periodFilter, { target: { value: '30days' } })

      await waitFor(() => {
        expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument()
      })

      // Mudar para 90 dias
      fireEvent.change(periodFilter, { target: { value: '90days' } })

      await waitFor(() => {
        expect(screen.getByText('Últimos 90 dias')).toBeInTheDocument()
      })
    })

    it('should handle quick actions', async () => {
      renderWithProviders(<Dashboard />)

      const quickActions = screen.getByTestId('quick-actions')
      expect(quickActions).toBeInTheDocument()

      // Testar ação rápida
      const newProjectAction = screen.getByTestId('quick-new-project')
      expect(newProjectAction).toBeInTheDocument()

      fireEvent.click(newProjectAction)

      // Verificar redirecionamento (mock)
      await waitFor(() => {
        expect(screen.getByText('Criar Novo Projeto')).toBeInTheDocument()
      })
    })
  })

  describe('Discovery IA Integration', () => {
    it('should handle complete AI analysis flow', async () => {
      renderWithProviders(<DiscoveryPage />)

      // Verificar interface
      expect(screen.getByText('Discovery IA')).toBeInTheDocument()
      expect(screen.getByText('Bem descobrir processos')).toBeInTheDocument()

      // Testar input de processo
      const processInput = screen.getByPlaceholder('Descreva seu processo para análise...')
      expect(processInput).toBeInTheDocument()

      fireEvent.change(processInput, {
        target: {
          value: 'Processo manual de validação de documentos médicos que demora 2 horas por dia'
        }
      })

      // Enviar para análise
      const sendButton = screen.getByTestId('send-message')
      expect(sendButton).toBeInTheDocument()
      fireEvent.click(sendButton)

      // Aguardar resposta da IA
      await waitFor(() => {
        expect(screen.getByTestId('ai-response')).toBeInTheDocument()
      })

      // Verificar conteúdo da resposta
      const aiResponse = screen.getByTestId('ai-response')
      expect(aiResponse).toHaveTextContent('automação')
      expect(aiResponse).toHaveTextContent('ROI')
      expect(aiResponse).toHaveTextContent('MedSênior')

      // Testar geração de PDD
      const generatePddButton = screen.getByTestId('generate-pdd')
      expect(generatePddButton).toBeInTheDocument()
      fireEvent.click(generatePddButton)

      // Aguardar PDD
      await waitFor(() => {
        expect(screen.getByTestId('pdd-document')).toBeInTheDocument()
      })

      // Verificar PDD
      const pddDocument = screen.getByTestId('pdd-document')
      expect(pddDocument).toHaveTextContent('Documento de Processo')
      expect(pddDocument).toHaveTextContent('MedSênior')
    })

    it('should handle file upload and analysis', async () => {
      renderWithProviders(<DiscoveryPage />)

      // Testar upload de arquivo
      const fileInput = screen.getByTestId('file-upload')
      expect(fileInput).toBeInTheDocument()

      const file = new File(['mock process content'], 'process.txt', { type: 'text/plain' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Verificar upload
      await waitFor(() => {
        expect(screen.getByText('process.txt')).toBeInTheDocument()
      })

      // Analisar arquivo
      const analyzeFileButton = screen.getByTestId('analyze-file')
      fireEvent.click(analyzeFileButton)

      // Aguardar análise
      await waitFor(() => {
        expect(screen.getByTestId('file-analysis')).toBeInTheDocument()
      })
    })
  })

  describe('Projects Integration', () => {
    it('should handle complete project lifecycle', async () => {
      renderWithProviders(<ProjectsPage />)

      // Verificar interface
      expect(screen.getByText('Projetos')).toBeInTheDocument()
      expect(screen.getByText('Bem gerenciar projetos')).toBeInTheDocument()

      // Criar projeto
      const createButton = screen.getByTestId('create-project')
      expect(createButton).toBeInTheDocument()
      fireEvent.click(createButton)

      // Preencher formulário
      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Nome do Projeto *'), {
        target: { value: 'Projeto Teste Integração' }
      })

      fireEvent.change(screen.getByLabelText('Descrição'), {
        target: { value: 'Projeto criado durante teste de integração' }
      })

      fireEvent.change(screen.getByLabelText('Prioridade'), {
        target: { value: 'alta' }
      })

      fireEvent.change(screen.getByLabelText('Complexidade'), {
        target: { value: '7' }
      })

      fireEvent.change(screen.getByLabelText('ROI Estimado (%)'), {
        target: { value: '45' }
      })

      // Salvar projeto
      const saveButton = screen.getByTestId('save-project')
      fireEvent.click(saveButton)

      // Verificar criação
      await waitFor(() => {
        expect(screen.getByText('Projeto Teste Integração')).toBeInTheDocument()
        expect(screen.getByText('Projeto criado com sucesso')).toBeInTheDocument()
      })

      // Editar projeto
      const editButton = screen.getByTestId('edit-project')
      fireEvent.click(editButton)

      fireEvent.change(screen.getByLabelText('Descrição'), {
        target: { value: 'Descrição atualizada via integração' }
      })

      fireEvent.click(saveButton)

      // Verificar atualização
      await waitFor(() => {
        expect(screen.getByText('Descrição atualizada via integração')).toBeInTheDocument()
        expect(screen.getByText('Projeto atualizado com sucesso')).toBeInTheDocument()
      })
    })

    it('should handle project filtering and search', async () => {
      renderWithProviders(<ProjectsPage />)

      // Testar filtros
      const statusFilter = screen.getByTestId('status-filter')
      expect(statusFilter).toBeInTheDocument()

      fireEvent.change(statusFilter, { target: { value: 'desenvolvimento' } })

      await waitFor(() => {
        expect(screen.getByText('Filtrado por: desenvolvimento')).toBeInTheDocument()
      })

      // Testar busca
      const searchInput = screen.getByTestId('project-search')
      expect(searchInput).toBeInTheDocument()

      fireEvent.change(searchInput, { target: { value: 'Automação' } })

      await waitFor(() => {
        expect(screen.getByText('Resultados para: Automação')).toBeInTheDocument()
      })
    })
  })

  describe('Quality Gates Integration', () => {
    it('should handle complete quality gate flow', async () => {
      renderWithProviders(<QualityGatesPage />)

      // Verificar interface
      expect(screen.getByText('Quality Gates')).toBeInTheDocument()
      expect(screen.getByText('G1 - Ideação')).toBeInTheDocument()
      expect(screen.getByText('G2 - Planejamento')).toBeInTheDocument()
      expect(screen.getByText('G3 - Desenvolvimento')).toBeInTheDocument()
      expect(screen.getByText('G4 - Produção')).toBeInTheDocument()

      // Criar projeto
      const newProjectButton = screen.getByTestId('new-project')
      fireEvent.click(newProjectButton)

      // Preencher G1
      await waitFor(() => {
        expect(screen.getByTestId('project-form')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Nome do Projeto *'), {
        target: { value: 'Projeto Quality Gate Teste' }
      })

      fireEvent.change(screen.getByLabelText('Descrição'), {
        target: { value: 'Projeto para teste de quality gates' }
      })

      fireEvent.change(screen.getByLabelText('Complexidade'), {
        target: { value: 'medium' }
      })

      // Submeter G1
      const submitG1Button = screen.getByTestId('submit-g1')
      fireEvent.click(submitG1Button)

      // Verificar G1
      await waitFor(() => {
        expect(screen.getByText('Projeto Quality Gate Teste')).toBeInTheDocument()
        expect(screen.getByText('G1 - Ideação')).toBeInTheDocument()
      })

      // Aprovar para G2
      const approveG2Button = screen.getByTestId('approve-g2')
      fireEvent.click(approveG2Button)

      // Verificar G2
      await waitFor(() => {
        expect(screen.getByText('G2 - Planejamento')).toBeInTheDocument()
        expect(screen.getByText('Aprovado')).toBeInTheDocument()
      })

      // Preencher G2
      fireEvent.change(screen.getByLabelText('Abordagem Técnica'), {
        target: { value: 'Abordagem técnica detalhada' }
      })

      fireEvent.change(screen.getByLabelText('Avaliação de Riscos'), {
        target: { value: 'Riscos baixos identificados' }
      })

      const submitG2Button = screen.getByTestId('submit-g2')
      fireEvent.click(submitG2Button)

      // Verificar G3
      await waitFor(() => {
        expect(screen.getByText('G3 - Desenvolvimento')).toBeInTheDocument()
      })
    })

    it('should handle quality gate rejections', async () => {
      renderWithProviders(<QualityGatesPage />)

      // Criar projeto
      const newProjectButton = screen.getByTestId('new-project')
      fireEvent.click(newProjectButton)

      // Preencher dados insuficientes
      fireEvent.change(screen.getByLabelText('Nome do Projeto *'), {
        target: { value: 'Projeto Incompleto' }
      })

      // Tentar submeter sem dados completos
      const submitG1Button = screen.getByTestId('submit-g1')
      fireEvent.click(submitG1Button)

      // Verificar validação
      await waitFor(() => {
        expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument()
        expect(screen.getByText('Complexidade é obrigatória')).toBeInTheDocument()
      })

      // Rejeitar projeto
      const rejectButton = screen.getByTestId('reject-project')
      fireEvent.click(rejectButton)

      fireEvent.change(screen.getByLabelText('Motivo da Rejeição'), {
        target: { value: 'Dados insuficientes para análise' }
      })

      const confirmRejectButton = screen.getByTestId('confirm-reject')
      fireEvent.click(confirmRejectButton)

      // Verificar rejeição
      await waitFor(() => {
        expect(screen.getByText('Projeto rejeitado')).toBeInTheDocument()
        expect(screen.getByText('Dados insuficientes para análise')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Integration', () => {
    it('should handle Azure AD authentication flow', async () => {
      renderWithProviders(<Dashboard />)

      // Verificar usuário autenticado
      await waitFor(() => {
        expect(screen.getByText('Teste MedSênior')).toBeInTheDocument()
      })

      // Verificar permissões
      const userProfile = screen.getByTestId('user-profile')
      expect(userProfile).toBeInTheDocument()

      // Testar logout
      const logoutButton = screen.getByTestId('logout-button')
      fireEvent.click(logoutButton)

      // Verificar redirecionamento para login
      await waitFor(() => {
        expect(screen.getByText('MILAPP MedSênior')).toBeInTheDocument()
        expect(screen.getByText('Entrar com Microsoft')).toBeInTheDocument()
      })
    })

    it('should handle permission-based access control', async () => {
      renderWithProviders(<Dashboard />)

      // Verificar acesso baseado em permissões
      const discoveryMenu = screen.getByTestId('discovery-menu')
      expect(discoveryMenu).toBeInTheDocument()

      // Testar acesso restrito
      const adminMenu = screen.queryByTestId('admin-menu')
      expect(adminMenu).not.toBeInTheDocument() // Usuário não tem permissão admin

      // Testar funcionalidades permitidas
      fireEvent.click(discoveryMenu)

      await waitFor(() => {
        expect(screen.getByText('Discovery IA')).toBeInTheDocument()
      })
    })
  })

  describe('Notifications Integration', () => {
    it('should handle notification system', async () => {
      renderWithProviders(<Dashboard />)

      // Verificar configurações de notificação
      const notificationSettings = screen.getByTestId('notification-settings')
      expect(notificationSettings).toBeInTheDocument()

      // Testar notificação de quality gate
      const qualityGateNotification = screen.getByTestId('quality-gate-notification')
      if (qualityGateNotification) {
        fireEvent.click(qualityGateNotification)

        await waitFor(() => {
          expect(screen.getByText('Quality Gate Aprovado')).toBeInTheDocument()
        })
      }

      // Testar notificação de deployment
      const deploymentNotification = screen.getByTestId('deployment-notification')
      if (deploymentNotification) {
        fireEvent.click(deploymentNotification)

        await waitFor(() => {
          expect(screen.getByText('Automação em Produção')).toBeInTheDocument()
        })
      }
    })
  })

  describe('PWA Integration', () => {
    it('should handle PWA installation prompt', async () => {
      renderWithProviders(<Dashboard />)

      // Verificar prompt de instalação
      const installPrompt = screen.queryByTestId('install-prompt')
      
      if (installPrompt) {
        expect(installPrompt).toHaveTextContent('Instalar MILAPP')
        
        const installButton = screen.getByTestId('install-button')
        fireEvent.click(installButton)

        await waitFor(() => {
          expect(screen.getByText('MILAPP instalado com sucesso')).toBeInTheDocument()
        })
      }
    })

    it('should handle offline functionality', async () => {
      renderWithProviders(<Dashboard />)

      // Simular modo offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      // Disparar evento offline
      fireEvent(window, new Event('offline'))

      await waitFor(() => {
        expect(screen.getByText('Modo Offline')).toBeInTheDocument()
      })

      // Restaurar conexão
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(screen.queryByText('Modo Offline')).not.toBeInTheDocument()
      })
    })
  })
}) 