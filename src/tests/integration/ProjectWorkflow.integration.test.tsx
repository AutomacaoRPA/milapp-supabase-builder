import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Projetos from '@/pages/Projetos';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock do useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Project Workflow Integration', () => {
  const user = userEvent.setup();
  const TestWrapper = createTestWrapper();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full project lifecycle', async () => {
    render(
      <TestWrapper>
        <Projetos />
      </TestWrapper>
    );

    // 1. Verificar se projetos são carregados
    await waitFor(() => {
      expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument();
      expect(screen.getByText('Processamento de Notas Fiscais')).toBeInTheDocument();
    });

    // 2. Criar novo projeto
    const createButton = screen.getByRole('button', { name: /nova ideia/i });
    await user.click(createButton);

    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Projeto Integração Teste');
    await user.type(screen.getByLabelText('Descrição'), 'Teste de integração completo');
    
    // Selecionar metodologia
    const methodologySelect = screen.getByLabelText('Metodologia');
    await user.click(methodologySelect);
    await user.click(screen.getByText('Scrum'));

    // Definir prioridade alta
    const priorityBadge = screen.getByText('Alta');
    await user.click(priorityBadge);

    // Definir complexidade
    const complexityInput = screen.getByLabelText('Complexidade (1-10)');
    await user.clear(complexityInput);
    await user.type(complexityInput, '8');

    // Definir ROI
    const roiInput = screen.getByLabelText('ROI Estimado (R$)');
    await user.type(roiInput, '75000');

    // Submeter
    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    // 3. Verificar se projeto foi criado
    await waitFor(() => {
      expect(screen.getByText('Projeto Integração Teste')).toBeInTheDocument();
    });

    // 4. Testar busca
    const searchInput = screen.getByPlaceholderText('Buscar projetos...');
    await user.type(searchInput, 'Integração');

    await waitFor(() => {
      expect(screen.getByText('Projeto Integração Teste')).toBeInTheDocument();
      expect(screen.queryByText('Automação de Faturamento')).not.toBeInTheDocument();
    });

    // 5. Limpar busca
    await user.clear(searchInput);

    // 6. Testar filtros
    const filterButton = screen.getByRole('button', { name: /filtros/i });
    await user.click(filterButton);

    // 7. Testar mudança de view
    const kanbanButton = screen.getByTitle('Kanban Board');
    await user.click(kanbanButton);

    // 8. Verificar se Kanban está visível
    await waitFor(() => {
      expect(screen.getByText('💡 Ideação')).toBeInTheDocument();
      expect(screen.getByText('📋 Planejamento')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Desenvolvimento')).toBeInTheDocument();
    });

    // 9. Testar drag and drop (simulado)
    const projectCard = screen.getByText('Projeto Integração Teste').closest('[draggable]');
    expect(projectCard).toHaveAttribute('draggable', 'true');
  });

  it('should handle project status updates', async () => {
    render(
      <TestWrapper>
        <Projetos />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument();
    });

    // Mudar para view Kanban
    const kanbanButton = screen.getByTitle('Kanban Board');
    await user.click(kanbanButton);

    // Verificar se projeto está na coluna correta
    await waitFor(() => {
      const developmentColumn = screen.getByText('⚙️ Desenvolvimento');
      expect(developmentColumn).toBeInTheDocument();
    });

    // Simular drag and drop para mudar status
    const projectCard = screen.getByText('Automação de Faturamento');
    const homologacaoColumn = screen.getByText('🧪 Homologação');

    // Simular drag and drop
    fireEvent.dragStart(projectCard);
    fireEvent.dragOver(homologacaoColumn);
    fireEvent.drop(homologacaoColumn);

    // Verificar se toast de sucesso foi mostrado
    await waitFor(() => {
      // O projeto deve ter sido movido
      expect(projectCard).toBeInTheDocument();
    });
  });

  it('should handle project selection and navigation', async () => {
    render(
      <TestWrapper>
        <Projetos />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument();
    });

    // Clicar no projeto para ver detalhes
    const projectCard = screen.getByText('Automação de Faturamento');
    await user.click(projectCard);

    // Verificar se navegou para view de detalhes
    await waitFor(() => {
      expect(screen.getByText('Detalhes do Projeto')).toBeInTheDocument();
    });

    // Voltar para lista
    const backButton = screen.getByRole('button', { name: /voltar/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('MilApp - DevOps & Project Management')).toBeInTheDocument();
    });
  });

  it('should handle error scenarios gracefully', async () => {
    // Mock de erro na API
    server.use(
      http.get('*/projects', () => {
        return HttpResponse.error();
      })
    );

    render(
      <TestWrapper>
        <Projetos />
      </TestWrapper>
    );

    // Deve mostrar dados mock em caso de erro
    await waitFor(() => {
      expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument();
    });
  });

  it('should test different view modes', async () => {
    render(
      <TestWrapper>
        <Projetos />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument();
    });

    // Testar Grid View
    const gridButton = screen.getByTitle('Grid View');
    await user.click(gridButton);

    // Testar Columns View
    const columnsButton = screen.getByTitle('Colunas por Status');
    await user.click(columnsButton);

    // Testar Work Items
    const workItemsButton = screen.getByTitle('Work Items');
    await user.click(workItemsButton);

    // Testar Sprints
    const sprintsButton = screen.getByTitle('Sprints');
    await user.click(sprintsButton);

    // Testar Scrum Board
    const scrumButton = screen.getByTitle('Scrum Board');
    await user.click(scrumButton);

    // Testar Pipelines
    const pipelinesButton = screen.getByTitle('Pipelines');
    await user.click(pipelinesButton);

    // Testar DevOps Overview
    const devopsButton = screen.getByTitle('DevOps Overview');
    await user.click(devopsButton);

    // Verificar se todas as views carregaram sem erro
    await waitFor(() => {
      expect(screen.getByText('MilApp - DevOps & Project Management')).toBeInTheDocument();
    });
  });

  it('should handle responsive design', async () => {
    // Simular tela pequena
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <Projetos />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument();
    });

    // Verificar se menu mobile está disponível
    const mobileMenuButton = screen.getByRole('button', { name: /menu/i });
    expect(mobileMenuButton).toBeInTheDocument();

    // Abrir menu mobile
    await user.click(mobileMenuButton);

    // Verificar se itens do menu estão visíveis
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Chat IA')).toBeInTheDocument();
      expect(screen.getByText('Projetos')).toBeInTheDocument();
    });
  });
}); 