import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, expect, it, describe, beforeEach } from 'vitest'
import { CreateProjectDialog } from '../../components/Projects/CreateProjectDialog'

// Mock do useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('CreateProjectDialog', () => {
  const mockOnCreateProject = jest.fn();
  const mockOnOpenChange = jest.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onCreateProject: mockOnCreateProject,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog when open is true', () => {
    render(<CreateProjectDialog {...defaultProps} />);
    
    expect(screen.getByText('Criar Novo Projeto RPA')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do Projeto *')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
  });

  it('should not render dialog when open is false', () => {
    render(<CreateProjectDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Criar Novo Projeto RPA')).not.toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Tentar submeter sem preencher nome
    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    // Deve mostrar erro de validação
    await waitFor(() => {
      expect(screen.getByText('Nome do projeto é obrigatório')).toBeInTheDocument();
    });

    expect(mockOnCreateProject).not.toHaveBeenCalled();
  });

  it('should create project with valid data', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Novo Projeto RPA');
    await user.type(screen.getByLabelText('Descrição'), 'Descrição do projeto');
    
    // Selecionar metodologia
    const methodologySelect = screen.getByLabelText('Metodologia');
    await user.click(methodologySelect);
    await user.click(screen.getByText('Scrum'));

    // Definir prioridade
    const priorityBadge = screen.getByText('Alta');
    await user.click(priorityBadge);

    // Definir complexidade
    const complexityInput = screen.getByLabelText('Complexidade (1-10)');
    await user.clear(complexityInput);
    await user.type(complexityInput, '7');

    // Definir ROI
    const roiInput = screen.getByLabelText('ROI Estimado (R$)');
    await user.type(roiInput, '50000');

    // Definir data meta
    const dateInput = screen.getByLabelText('Data Meta');
    await user.type(dateInput, '2024-12-31');

    // Submeter formulário
    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCreateProject).toHaveBeenCalledWith({
        name: 'Novo Projeto RPA',
        description: 'Descrição do projeto',
        status: 'ideacao',
        priority: 4,
        methodology: 'scrum',
        complexity_score: 7,
        estimated_roi: 50000,
        target_date: '2024-12-31',
        created_by: 'temp-user-id',
        start_date: null,
        actual_roi: null,
        completed_date: null,
        assigned_architect: null,
        product_owner: null,
      });
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should validate complexity score range', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Preencher nome obrigatório
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Projeto Teste');

    // Tentar definir complexidade inválida
    const complexityInput = screen.getByLabelText('Complexidade (1-10)');
    await user.clear(complexityInput);
    await user.type(complexityInput, '15'); // Valor inválido

    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Complexidade deve estar entre 1 e 10')).toBeInTheDocument();
    });
  });

  it('should validate ROI not negative', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Preencher nome obrigatório
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Projeto Teste');

    // Tentar definir ROI negativo
    const roiInput = screen.getByLabelText('ROI Estimado (R$)');
    await user.clear(roiInput);
    await user.type(roiInput, '-1000');

    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('ROI estimado não pode ser negativo')).toBeInTheDocument();
    });
  });

  it('should validate target date not in past', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Preencher nome obrigatório
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Projeto Teste');

    // Tentar definir data no passado
    const dateInput = screen.getByLabelText('Data Meta');
    await user.type(dateInput, '2020-01-01');

    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Data meta não pode ser no passado')).toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Projeto Teste');
    await user.type(screen.getByLabelText('Descrição'), 'Descrição teste');

    // Submeter
    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCreateProject).toHaveBeenCalled();
    });

    // Formulário deve ser resetado
    expect(screen.getByLabelText('Nome do Projeto *')).toHaveValue('');
    expect(screen.getByLabelText('Descrição')).toHaveValue('');
  });

  it('should handle cancel button', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable submit button when submitting', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Projeto *'), 'Projeto Teste');

    const submitButton = screen.getByRole('button', { name: /criar projeto/i });
    
    // Simular submissão lenta
    mockOnCreateProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    await user.click(submitButton);

    // Botão deve estar desabilitado durante submissão
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Criando...');
  });

  it('should show priority badges with correct colors', () => {
    render(<CreateProjectDialog {...defaultProps} />);

    const priorityBadges = screen.getAllByText(/Muito Baixa|Baixa|Média|Alta|Crítica/);
    expect(priorityBadges).toHaveLength(5);

    // Verificar se a prioridade padrão (Média) está selecionada
    const defaultPriority = screen.getByText('Média');
    expect(defaultPriority).toHaveClass('bg-primary');
  });

  it('should handle priority selection', async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog {...defaultProps} />);

    const criticalPriority = screen.getByText('Crítica');
    await user.click(criticalPriority);

    // Verificar se a prioridade foi alterada
    expect(criticalPriority).toHaveClass('bg-primary');
  });
}); 