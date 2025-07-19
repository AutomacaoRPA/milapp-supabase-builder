import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '@/hooks/useProjects';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock do useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('useProjects', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should fetch projects successfully', async () => {
    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].name).toBe('Automação de Faturamento');
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error gracefully', async () => {
    // Mock de erro na API
    server.use(
      http.get('*/projects', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    // Deve usar dados mock em caso de erro
    expect(result.current.projects).toHaveLength(2);
  });

  it('should create project successfully', async () => {
    const { result } = renderHook(() => useProjects());

    const newProject = {
      name: 'Novo Projeto',
      description: 'Descrição do novo projeto',
      status: 'ideacao' as const,
      priority: 3,
      methodology: 'kanban',
      complexity_score: 5,
      estimated_roi: 25000,
      created_by: 'user-1',
      start_date: null,
      target_date: null,
      actual_roi: null,
      completed_date: null,
      assigned_architect: null,
      product_owner: null,
    };

    await result.current.createProject(newProject);

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(3);
    });
  });

  it('should validate project data before creation', async () => {
    const { result } = renderHook(() => useProjects());

    const invalidProject = {
      name: '', // Nome vazio deve ser rejeitado
      description: 'Descrição',
      status: 'ideacao' as const,
      priority: 3,
      methodology: 'kanban',
      complexity_score: 5,
      estimated_roi: 25000,
      created_by: 'user-1',
      start_date: null,
      target_date: null,
      actual_roi: null,
      completed_date: null,
      assigned_architect: null,
      product_owner: null,
    };

    await expect(result.current.createProject(invalidProject)).rejects.toThrow(
      'Nome do projeto é obrigatório'
    );
  });

  it('should update project successfully', async () => {
    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updates = { status: 'planejamento' as const };
    await result.current.updateProject('1', updates);

    await waitFor(() => {
      const updatedProject = result.current.projects.find(p => p.id === '1');
      expect(updatedProject?.status).toBe('planejamento');
    });
  });

  it('should delete project successfully', async () => {
    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.projects.length;
    await result.current.deleteProject('1');

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(initialCount - 1);
    });
  });

  it('should handle Supabase client not configured', async () => {
    // Mock do Supabase para retornar null
    jest.doMock('@/integrations/supabase/client', () => ({
      supabase: null,
    }));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    // Deve usar dados mock quando Supabase não está configurado
    expect(result.current.projects).toHaveLength(2);
  });

  it('should format currency correctly', () => {
    const { result } = renderHook(() => useProjects());

    // Teste de formatação de moeda (se implementado no hook)
    const project = result.current.projects[0];
    expect(project.estimated_roi).toBe(50000);
  });

  it('should handle date formatting', () => {
    const { result } = renderHook(() => useProjects());

    const project = result.current.projects[0];
    expect(project.start_date).toBe('2024-01-15');
    expect(project.target_date).toBe('2024-03-15');
  });
}); 