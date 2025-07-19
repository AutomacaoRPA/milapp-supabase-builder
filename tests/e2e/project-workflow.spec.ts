import { test, expect } from '@playwright/test';

test.describe('MILAPP - Fluxo Completo de Projetos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full project lifecycle', async ({ page }) => {
    // 1. Verificar se a página carrega corretamente
    await expect(page.getByRole('heading', { name: 'MILAPP Dashboard' })).toBeVisible();
    
    // 2. Navegar para página de projetos
    await page.getByRole('link', { name: 'Projetos' }).click();
    await expect(page.getByRole('heading', { name: 'MilApp - DevOps & Project Management' })).toBeVisible();

    // 3. Verificar se projetos existentes são exibidos
    await expect(page.getByText('Automação de Faturamento')).toBeVisible();
    await expect(page.getByText('Processamento de Notas Fiscais')).toBeVisible();

    // 4. Criar novo projeto
    await page.getByRole('button', { name: 'Nova Ideia' }).click();
    
    // Preencher formulário
    await page.getByLabel('Nome do Projeto *').fill('Projeto E2E Teste');
    await page.getByLabel('Descrição').fill('Teste end-to-end completo do MILAPP');
    
    // Selecionar metodologia
    await page.getByLabel('Metodologia').click();
    await page.getByText('Scrum').click();
    
    // Definir prioridade
    await page.getByText('Alta').click();
    
    // Definir complexidade
    await page.getByLabel('Complexidade (1-10)').fill('8');
    
    // Definir ROI
    await page.getByLabel('ROI Estimado (R$)').fill('100000');
    
    // Definir data meta
    await page.getByLabel('Data Meta').fill('2024-12-31');
    
    // Submeter formulário
    await page.getByRole('button', { name: 'Criar Projeto' }).click();

    // 5. Verificar se projeto foi criado
    await expect(page.getByText('Projeto E2E Teste')).toBeVisible();

    // 6. Testar busca
    await page.getByPlaceholder('Buscar projetos...').fill('E2E');
    await expect(page.getByText('Projeto E2E Teste')).toBeVisible();
    await expect(page.getByText('Automação de Faturamento')).not.toBeVisible();

    // 7. Limpar busca
    await page.getByPlaceholder('Buscar projetos...').clear();
    await expect(page.getByText('Automação de Faturamento')).toBeVisible();

    // 8. Testar mudança de view para Kanban
    await page.getByTitle('Kanban Board').click();
    await expect(page.getByText('💡 Ideação')).toBeVisible();
    await expect(page.getByText('📋 Planejamento')).toBeVisible();
    await expect(page.getByText('⚙️ Desenvolvimento')).toBeVisible();

    // 9. Testar drag and drop (simulado)
    const projectCard = page.getByText('Projeto E2E Teste').locator('..').first();
    const targetColumn = page.getByText('📋 Planejamento').locator('..').first();
    
    await projectCard.dragTo(targetColumn);
    
    // Verificar se toast de sucesso foi mostrado
    await expect(page.getByText('Status Atualizado')).toBeVisible();
  });

  test('should handle project navigation and details', async ({ page }) => {
    // Navegar para projetos
    await page.getByRole('link', { name: 'Projetos' }).click();
    
    // Clicar no projeto para ver detalhes
    await page.getByText('Automação de Faturamento').click();
    
    // Verificar se navegou para view de detalhes
    await expect(page.getByText('Detalhes do Projeto')).toBeVisible();
    
    // Voltar para lista
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page.getByRole('heading', { name: 'MilApp - DevOps & Project Management' })).toBeVisible();
  });

  test('should test all view modes', async ({ page }) => {
    await page.getByRole('link', { name: 'Projetos' }).click();
    
    // Testar Grid View
    await page.getByTitle('Grid View').click();
    await expect(page.getByText('Automação de Faturamento')).toBeVisible();
    
    // Testar Columns View
    await page.getByTitle('Colunas por Status').click();
    await expect(page.getByText('Automação de Faturamento')).toBeVisible();
    
    // Testar Kanban View
    await page.getByTitle('Kanban Board').click();
    await expect(page.getByText('💡 Ideação')).toBeVisible();
    
    // Testar Work Items
    await page.getByTitle('Work Items').click();
    await expect(page.getByText('Work Items')).toBeVisible();
    
    // Testar Sprints
    await page.getByTitle('Sprints').click();
    await expect(page.getByText('Sprints')).toBeVisible();
    
    // Testar Scrum Board
    await page.getByTitle('Scrum Board').click();
    await expect(page.getByText('Scrum Board')).toBeVisible();
    
    // Testar Pipelines
    await page.getByTitle('Pipelines').click();
    await expect(page.getByText('Pipelines')).toBeVisible();
    
    // Testar DevOps Overview
    await page.getByTitle('DevOps Overview').click();
    await expect(page.getByText('DevOps Overview')).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.getByRole('link', { name: 'Projetos' }).click();
    await page.getByRole('button', { name: 'Nova Ideia' }).click();
    
    // Tentar submeter sem preencher nome
    await page.getByRole('button', { name: 'Criar Projeto' }).click();
    await expect(page.getByText('Nome do projeto é obrigatório')).toBeVisible();
    
    // Preencher nome e tentar submeter
    await page.getByLabel('Nome do Projeto *').fill('Teste');
    await page.getByRole('button', { name: 'Criar Projeto' }).click();
    
    // Deve criar o projeto
    await expect(page.getByText('Teste')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Simular tela mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.getByRole('link', { name: 'Projetos' }).click();
    
    // Verificar se menu mobile está disponível
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
    
    // Abrir menu mobile
    await page.getByRole('button', { name: /menu/i }).click();
    
    // Verificar se itens do menu estão visíveis
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Chat IA')).toBeVisible();
    await expect(page.getByText('Projetos')).toBeVisible();
  });

  test('should test navigation between pages', async ({ page }) => {
    // Testar navegação para Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'MILAPP Dashboard' })).toBeVisible();
    
    // Testar navegação para Chat IA
    await page.getByRole('link', { name: 'Chat IA' }).click();
    await expect(page.getByText('Chat IA')).toBeVisible();
    
    // Testar navegação para Quality Gates
    await page.getByRole('link', { name: 'Quality Gates' }).click();
    await expect(page.getByText('Quality Gates')).toBeVisible();
    
    // Testar navegação para Deployments
    await page.getByRole('link', { name: 'Deployments' }).click();
    await expect(page.getByText('Deployments')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    await page.getByRole('link', { name: 'Projetos' }).click();
    
    // Buscar por projeto específico
    await page.getByPlaceholder('Buscar projetos...').fill('Faturamento');
    
    // Verificar se apenas o projeto correto é exibido
    await expect(page.getByText('Automação de Faturamento')).toBeVisible();
    await expect(page.getByText('Processamento de Notas Fiscais')).not.toBeVisible();
    
    // Limpar busca
    await page.getByPlaceholder('Buscar projetos...').clear();
    
    // Verificar se todos os projetos voltam a ser exibidos
    await expect(page.getByText('Automação de Faturamento')).toBeVisible();
    await expect(page.getByText('Processamento de Notas Fiscais')).toBeVisible();
  });

  test('should handle filters', async ({ page }) => {
    await page.getByRole('link', { name: 'Projetos' }).click();
    
    // Abrir filtros
    await page.getByRole('button', { name: 'Filtros' }).click();
    
    // Verificar se painel de filtros está visível
    await expect(page.getByText('Filtros')).toBeVisible();
    
    // Fechar filtros
    await page.getByRole('button', { name: 'Filtros' }).click();
  });

  test('should handle project actions', async ({ page }) => {
    await page.getByRole('link', { name: 'Projetos' }).click();
    
    // Mudar para view Kanban
    await page.getByTitle('Kanban Board').click();
    
    // Hover sobre projeto para mostrar ações
    const projectCard = page.getByText('Automação de Faturamento').locator('..').first();
    await projectCard.hover();
    
    // Verificar se botões de ação aparecem
    await expect(page.getByTitle('Ver detalhes')).toBeVisible();
    await expect(page.getByTitle('Editar')).toBeVisible();
    await expect(page.getByTitle('Excluir')).toBeVisible();
  });
}); 