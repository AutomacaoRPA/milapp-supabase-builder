import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, expect, it, describe, beforeEach } from 'vitest'
import { EnhancedProjectCard } from '../../components/Projects/EnhancedProjectCard'

// Mock do Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

const mockProject = {
  id: '1',
  name: 'Automação de Faturamento',
  description: 'Automação do processo de faturamento da MedSênior',
  status: 'desenvolvimento' as const,
  priority: 'alta' as const,
  complexity: 8,
  estimated_roi: 45,
  actual_roi: 52,
  start_date: '2024-01-15',
  target_date: '2024-03-15',
  owner: 'João Silva',
  team_size: 4,
  budget: 50000,
  quality_gates_passed: 2,
  total_quality_gates: 4,
  tasks: [
    {
      id: 'task-1',
      title: 'Análise de requisitos',
      description: 'Documentar requisitos do sistema',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      assignee: 'Maria Santos',
      estimatedHours: 8,
      actualHours: 6,
      completedAt: new Date('2024-01-20')
    },
    {
      id: 'task-2',
      title: 'Desenvolvimento do core',
      description: 'Implementar funcionalidades principais',
      status: 'IN_PROGRESS' as const,
      priority: 'CRITICAL' as const,
      assignee: 'Pedro Costa',
      estimatedHours: 40,
      actualHours: 25
    }
  ],
  tags: ['RPA', 'Faturamento', 'MedSênior'],
  attachments: [],
  comments: [],
  metrics: {
    progress: 60,
    velocity: 15,
    burndown: 25,
    riskScore: 0.3
  }
}

const mockHandlers = {
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onTaskUpdate: vi.fn(),
  onTaskAdd: vi.fn(),
  onTaskDelete: vi.fn()
}

describe('EnhancedProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render project information correctly', () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Automação de Faturamento')).toBeInTheDocument()
    expect(screen.getByText('Automação do processo de faturamento da MedSênior')).toBeInTheDocument()
    expect(screen.getByText('ROI: 52%')).toBeInTheDocument()
    expect(screen.getByText('Equipe: 4')).toBeInTheDocument()
    expect(screen.getByText('Complexidade: 8/10')).toBeInTheDocument()
  })

  it('should display correct status and priority chips', () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('DESENVOLVIMENTO')).toBeInTheDocument()
    expect(screen.getByText('ALTA')).toBeInTheDocument()
  })

  it('should show progress bar with correct percentage', () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Progresso das Tarefas')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('50.0% concluído')).toBeInTheDocument()
  })

  it('should display project tags', () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('RPA')).toBeInTheDocument()
    expect(screen.getByText('Faturamento')).toBeInTheDocument()
    expect(screen.getByText('MedSênior')).toBeInTheDocument()
  })

  it('should expand to show tasks when clicked', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('Tarefas (2)')).toBeInTheDocument()
      expect(screen.getByText('Análise de requisitos')).toBeInTheDocument()
      expect(screen.getByText('Desenvolvimento do core')).toBeInTheDocument()
    })
  })

  it('should show task details when expanded', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('Documentar requisitos do sistema')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.getByText('8h')).toBeInTheDocument()
      expect(screen.getByText('Pedro Costa')).toBeInTheDocument()
      expect(screen.getByText('40h')).toBeInTheDocument()
    })
  })

  it('should toggle task status when checkbox is clicked', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      const firstCheckbox = checkboxes[0]
      
      expect(firstCheckbox).toBeChecked() // Task is DONE
      
      fireEvent.click(firstCheckbox)
      
      expect(mockHandlers.onTaskUpdate).toHaveBeenCalledWith(
        '1',
        'task-1',
        expect.objectContaining({
          status: 'TODO'
        })
      )
    })
  })

  it('should open add task dialog when button is clicked', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      const addButton = screen.getByText('Adicionar Tarefa')
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Adicionar Nova Tarefa')).toBeInTheDocument()
      expect(screen.getByLabelText('Título da Tarefa')).toBeInTheDocument()
    })
  })

  it('should add new task when form is submitted', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      const addButton = screen.getByText('Adicionar Tarefa')
      fireEvent.click(addButton)
    })

    await waitFor(() => {
      const titleInput = screen.getByLabelText('Título da Tarefa')
      const descriptionInput = screen.getByLabelText('Descrição')
      const addTaskButton = screen.getByText('Adicionar')

      fireEvent.change(titleInput, { target: { value: 'Nova Tarefa' } })
      fireEvent.change(descriptionInput, { target: { value: 'Descrição da nova tarefa' } })
      fireEvent.click(addTaskButton)
    })

    expect(mockHandlers.onTaskAdd).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        title: 'Nova Tarefa',
        description: 'Descrição da nova tarefa',
        status: 'TODO',
        priority: 'MEDIUM'
      })
    )
  })

  it('should edit task when edit button is clicked', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      const editButtons = screen.getAllByTitle('Editar tarefa')
      fireEvent.click(editButtons[0])
    })

    await waitFor(() => {
      expect(screen.getByText('Editar Tarefa')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Análise de requisitos')).toBeInTheDocument()
    })
  })

  it('should delete task when delete button is clicked', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Excluir tarefa')
      fireEvent.click(deleteButtons[0])
    })

    expect(mockHandlers.onTaskDelete).toHaveBeenCalledWith('1', 'task-1')
  })

  it('should delete project when delete button is clicked', () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const deleteButton = screen.getByTitle('Excluir projeto')
    fireEvent.click(deleteButton)

    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1')
  })

  it('should show correct task status indicators', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getByText('DONE')).toBeInTheDocument()
      expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument()
    })
  })

  it('should show task priority icons', async () => {
    render(
      <EnhancedProjectCard
        project={mockProject}
        {...mockHandlers}
      />
    )

    const expandButton = screen.getByText('Ver Tarefas')
    fireEvent.click(expandButton)

    await waitFor(() => {
      // Verificar se os ícones de prioridade estão presentes
      const priorityIcons = screen.getAllByTestId('FlagIcon')
      expect(priorityIcons.length).toBeGreaterThan(0)
    })
  })

  it('should handle empty task list', () => {
    const projectWithoutTasks = {
      ...mockProject,
      tasks: []
    }

    render(
      <EnhancedProjectCard
        project={projectWithoutTasks}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('0/0')).toBeInTheDocument()
    expect(screen.getByText('0.0% concluído')).toBeInTheDocument()
  })

  it('should handle project without tags', () => {
    const projectWithoutTags = {
      ...mockProject,
      tags: []
    }

    render(
      <EnhancedProjectCard
        project={projectWithoutTags}
        {...mockHandlers}
      />
    )

    // Não deve mostrar nenhuma tag
    expect(screen.queryByText('RPA')).not.toBeInTheDocument()
  })

  it('should show correct ROI display', () => {
    const projectWithoutActualROI = {
      ...mockProject,
      actual_roi: undefined
    }

    render(
      <EnhancedProjectCard
        project={projectWithoutActualROI}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('ROI: 45%')).toBeInTheDocument()
  })
}) 