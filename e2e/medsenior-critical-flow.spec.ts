import { test, expect } from '@playwright/test'

test.describe('MILAPP MedSênior - Fluxos Críticos', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Interceptar chamadas de API para mock
    await page.route('**/supabase.co/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], error: null })
      })
    })

    // Mock Azure AD
    await page.route('**/login.microsoftonline.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          id_token: 'mock-id-token'
        })
      })
    })
  })

  test('Discovery IA: Análise completa de processo', async ({ page }) => {
    await page.goto('/discovery')
    
    // Aguardar carregamento da página
    await page.waitForSelector('[data-testid="discovery-page"]')
    
    // Verificar elementos da interface MedSênior
    await expect(page.getByText('Discovery IA')).toBeVisible()
    await expect(page.getByText('Bem descobrir processos')).toBeVisible()
    
    // Testar chat IA
    const chatInput = page.getByPlaceholder('Descreva seu processo para análise...')
    await expect(chatInput).toBeVisible()
    
    await chatInput.fill(
      'Processo manual de validação de documentos médicos que demora 2 horas por dia e envolve verificação de 50 documentos'
    )
    
    const sendButton = page.getByTestId('send-message')
    await expect(sendButton).toBeVisible()
    await sendButton.click()
    
    // Aguardar resposta da IA
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 })
    
    // Verificar resposta da IA
    const aiResponse = page.getByTestId('ai-response')
    await expect(aiResponse).toContainText('automação')
    await expect(aiResponse).toContainText('ROI')
    await expect(aiResponse).toContainText('MedSênior')
    
    // Testar geração de PDD
    const generatePddButton = page.getByTestId('generate-pdd')
    await expect(generatePddButton).toBeVisible()
    await generatePddButton.click()
    
    // Aguardar geração do PDD
    await page.waitForSelector('[data-testid="pdd-document"]', { timeout: 15000 })
    
    const pddDocument = page.getByTestId('pdd-document')
    await expect(pddDocument).toBeVisible()
    await expect(pddDocument).toContainText('Documento de Processo')
    await expect(pddDocument).toContainText('MedSênior')
    
    // Testar exportação
    const exportButton = page.getByTestId('export-pdd')
    await expect(exportButton).toBeVisible()
    await exportButton.click()
    
    // Verificar download (mock)
    await expect(page.getByText('PDD exportado com sucesso')).toBeVisible()
  })

  test('Quality Gates: Fluxo completo G1 → G4', async ({ page }) => {
    await page.goto('/quality-gates')
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="quality-gates-page"]')
    
    // Verificar interface MedSênior
    await expect(page.getByText('Quality Gates')).toBeVisible()
    await expect(page.getByText('G1 - Ideação')).toBeVisible()
    await expect(page.getByText('G2 - Planejamento')).toBeVisible()
    await expect(page.getByText('G3 - Desenvolvimento')).toBeVisible()
    await expect(page.getByText('G4 - Produção')).toBeVisible()
    
    // Criar novo projeto
    const newProjectButton = page.getByTestId('new-project')
    await expect(newProjectButton).toBeVisible()
    await newProjectButton.click()
    
    // Preencher formulário G1
    await page.waitForSelector('[data-testid="project-form"]')
    
    await page.fill('[name="project-name"]', 'Automação Teste MedSênior')
    await page.fill('[name="project-description"]', 'Automação de teste para validação de quality gates')
    await page.selectOption('[name="complexity"]', 'medium')
    await page.fill('[name="estimated-roi"]', '45')
    await page.fill('[name="budget"]', '50000')
    await page.fill('[name="target-date"]', '2024-12-31')
    
    // Submeter G1
    const submitG1Button = page.getByTestId('submit-g1')
    await expect(submitG1Button).toBeVisible()
    await submitG1Button.click()
    
    // Verificar projeto em G1
    await page.waitForSelector('[data-testid="project-g1"]')
    await expect(page.getByText('Automação Teste MedSênior')).toBeVisible()
    await expect(page.getByText('G1 - Ideação')).toBeVisible()
    
    // Aprovar para G2
    const approveG2Button = page.getByTestId('approve-g2')
    await expect(approveG2Button).toBeVisible()
    await approveG2Button.click()
    
    // Verificar aprovação
    await page.waitForSelector('[data-testid="project-g2"]')
    await expect(page.getByText('G2 - Planejamento')).toBeVisible()
    await expect(page.getByText('Aprovado')).toBeVisible()
    
    // Preencher G2
    await page.fill('[name="technical-approach"]', 'Abordagem técnica detalhada')
    await page.fill('[name="risk-assessment"]', 'Avaliação de riscos baixa')
    await page.fill('[name="resource-plan"]', 'Plano de recursos definido')
    
    const submitG2Button = page.getByTestId('submit-g2')
    await submitG2Button.click()
    
    // Verificar G3
    await page.waitForSelector('[data-testid="project-g3"]')
    await expect(page.getByText('G3 - Desenvolvimento')).toBeVisible()
    
    // Simular desenvolvimento
    await page.fill('[name="development-progress"]', '80')
    await page.fill('[name="testing-status"]', 'Testes em andamento')
    
    const submitG3Button = page.getByTestId('submit-g3')
    await submitG3Button.click()
    
    // Verificar G4
    await page.waitForSelector('[data-testid="project-g4"]')
    await expect(page.getByText('G4 - Produção')).toBeVisible()
    
    // Finalizar projeto
    await page.fill('[name="production-readiness"]', 'Pronto para produção')
    await page.fill('[name="actual-roi"]', '52')
    
    const finalizeButton = page.getByTestId('finalize-project')
    await finalizeButton.click()
    
    // Verificar conclusão
    await expect(page.getByText('Projeto Concluído')).toBeVisible()
    await expect(page.getByText('ROI: 52%')).toBeVisible()
  })

  test('Dashboard: Métricas em tempo real', async ({ page }) => {
    await page.goto('/')
    
    // Aguardar carregamento do dashboard
    await page.waitForSelector('[data-testid="dashboard-loaded"]')
    
    // Verificar KPIs principais
    const activeAutomations = page.getByTestId('active-automations')
    await expect(activeAutomations).toBeVisible()
    await expect(activeAutomations).toContainText(/\d+/)
    
    const hoursSaved = page.getByTestId('hours-saved')
    await expect(hoursSaved).toBeVisible()
    await expect(hoursSaved).toContainText(/\d+h/)
    
    const roiMetric = page.getByTestId('roi-metric')
    await expect(roiMetric).toBeVisible()
    await expect(roiMetric).toContainText(/%/)
    
    const projectsCount = page.getByTestId('projects-count')
    await expect(projectsCount).toBeVisible()
    await expect(projectsCount).toContainText(/\d+/)
    
    // Verificar gráficos
    const roiChart = page.getByTestId('roi-chart')
    await expect(roiChart).toBeVisible()
    
    const projectsChart = page.getByTestId('projects-chart')
    await expect(projectsChart).toBeVisible()
    
    // Testar filtros de período
    const periodFilter = page.getByTestId('period-filter')
    await expect(periodFilter).toBeVisible()
    
    await periodFilter.selectOption('30days')
    await expect(page.getByText('Últimos 30 dias')).toBeVisible()
    
    await periodFilter.selectOption('90days')
    await expect(page.getByText('Últimos 90 dias')).toBeVisible()
    
    // Testar navegação rápida
    const quickActions = page.getByTestId('quick-actions')
    await expect(quickActions).toBeVisible()
    
    const newProjectAction = page.getByTestId('quick-new-project')
    await expect(newProjectAction).toBeVisible()
    await newProjectAction.click()
    
    // Verificar redirecionamento
    await expect(page.getByText('Criar Novo Projeto')).toBeVisible()
  })

  test('Autenticação Azure AD: Login completo', async ({ page }) => {
    await page.goto('/login')
    
    // Verificar página de login MedSênior
    await expect(page.getByText('MILAPP MedSênior')).toBeVisible()
    await expect(page.getByText('Centro de Excelência')).toBeVisible()
    
    // Testar botão de login Microsoft
    const microsoftLoginButton = page.getByTestId('azure-login')
    await expect(microsoftLoginButton).toBeVisible()
    await expect(microsoftLoginButton).toContainText('Entrar com Microsoft')
    
    // Simular login
    await microsoftLoginButton.click()
    
    // Aguardar redirecionamento após login
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verificar login bem-sucedido
    await expect(page.getByTestId('user-profile')).toBeVisible()
    await expect(page.getByText('Teste MedSênior')).toBeVisible()
    
    // Verificar permissões
    await expect(page.getByTestId('discovery-menu')).toBeVisible()
    await expect(page.getByTestId('projects-menu')).toBeVisible()
    await expect(page.getByTestId('quality-gates-menu')).toBeVisible()
  })

  test('Projetos: CRUD completo', async ({ page }) => {
    await page.goto('/projects')
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="projects-page"]')
    
    // Verificar interface
    await expect(page.getByText('Projetos')).toBeVisible()
    await expect(page.getByText('Bem gerenciar projetos')).toBeVisible()
    
    // Criar novo projeto
    const createButton = page.getByTestId('create-project')
    await expect(createButton).toBeVisible()
    await createButton.click()
    
    // Preencher formulário
    await page.waitForSelector('[data-testid="project-form"]')
    
    await page.fill('[name="name"]', 'Projeto Teste E2E')
    await page.fill('[name="description"]', 'Projeto criado durante teste E2E')
    await page.selectOption('[name="priority"]', 'alta')
    await page.fill('[name="complexity"]', '7')
    await page.fill('[name="estimated-roi"]', '40')
    await page.fill('[name="budget"]', '45000')
    await page.fill('[name="start-date"]', '2024-01-01')
    await page.fill('[name="target-date"]', '2024-06-30')
    
    // Salvar projeto
    const saveButton = page.getByTestId('save-project')
    await saveButton.click()
    
    // Verificar criação
    await page.waitForSelector('[data-testid="project-created"]')
    await expect(page.getByText('Projeto Teste E2E')).toBeVisible()
    await expect(page.getByText('Projeto criado com sucesso')).toBeVisible()
    
    // Editar projeto
    const editButton = page.getByTestId('edit-project')
    await editButton.click()
    
    await page.fill('[name="description"]', 'Descrição atualizada via E2E')
    await saveButton.click()
    
    // Verificar atualização
    await expect(page.getByText('Descrição atualizada via E2E')).toBeVisible()
    await expect(page.getByText('Projeto atualizado com sucesso')).toBeVisible()
    
    // Deletar projeto
    const deleteButton = page.getByTestId('delete-project')
    await deleteButton.click()
    
    // Confirmar exclusão
    const confirmDeleteButton = page.getByTestId('confirm-delete')
    await confirmDeleteButton.click()
    
    // Verificar exclusão
    await expect(page.getByText('Projeto excluído com sucesso')).toBeVisible()
    await expect(page.getByText('Projeto Teste E2E')).not.toBeVisible()
  })

  test('Notificações: Sistema completo', async ({ page }) => {
    await page.goto('/settings/notifications')
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="notification-settings"]')
    
    // Verificar configurações
    await expect(page.getByText('Configurações de Notificações')).toBeVisible()
    await expect(page.getByText('Status da Permissão')).toBeVisible()
    
    // Testar solicitação de permissão
    const requestPermissionButton = page.getByTestId('request-permission')
    if (await requestPermissionButton.isVisible()) {
      await requestPermissionButton.click()
      
      // Verificar permissão concedida
      await expect(page.getByText('Permitido')).toBeVisible()
    }
    
    // Configurar preferências
    const qualityGatesToggle = page.getByTestId('toggle-quality-gates')
    await expect(qualityGatesToggle).toBeVisible()
    await qualityGatesToggle.check()
    
    const deploymentsToggle = page.getByTestId('toggle-deployments')
    await deploymentsToggle.check()
    
    const roiToggle = page.getByTestId('toggle-roi-updates')
    await roiToggle.check()
    
    // Salvar configurações
    const saveButton = page.getByTestId('save-preferences')
    await saveButton.click()
    
    // Verificar salvamento
    await expect(page.getByText('Preferências salvas com sucesso')).toBeVisible()
    
    // Testar notificação
    const testNotificationButton = page.getByTestId('test-notification')
    await testNotificationButton.click()
    
    // Verificar notificação (mock)
    await expect(page.getByText('Notificação de teste enviada')).toBeVisible()
  })

  test('PWA: Instalação e funcionalidade offline', async ({ page }) => {
    await page.goto('/')
    
    // Verificar prompt de instalação
    const installPrompt = page.getByTestId('install-prompt')
    if (await installPrompt.isVisible()) {
      await expect(installPrompt).toContainText('Instalar MILAPP')
      
      // Testar instalação
      const installButton = page.getByTestId('install-button')
      await installButton.click()
      
      // Verificar instalação
      await expect(page.getByText('MILAPP instalado com sucesso')).toBeVisible()
    }
    
    // Testar funcionalidade offline
    await page.route('**/*', route => route.abort())
    
    // Tentar navegar
    await page.goto('/projects')
    
    // Verificar página offline
    await expect(page.getByText('Modo Offline')).toBeVisible()
    await expect(page.getByText('MILAPP MedSênior')).toBeVisible()
    
    // Restaurar conexão
    await page.unroute('**/*')
  })
}) 