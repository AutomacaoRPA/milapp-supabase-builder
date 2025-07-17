import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  created_at: string;
  roi_target?: number;
  estimated_effort?: number;
  methodology?: string;
  team_size?: number;
  completion_percentage?: number;
}

export interface CreateProjectData {
  name: string;
  description: string;
  type: string;
  priority: string;
  roi_target?: number;
  estimated_effort?: number;
  methodology?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'user_story' | 'bug' | 'task' | 'epic';
  assignee_id?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  story_points?: number;
  due_date?: string;
  tags: string[];
  comments_count: number;
  attachments_count: number;
  project_id: string;
  sprint_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'user_story' | 'bug' | 'task' | 'epic';
  assignee_id?: string;
  story_points?: number;
  due_date?: string;
  tags?: string[];
  project_id: string;
  sprint_id?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  capacity: number;
  velocity?: number;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSprintData {
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  project_id: string;
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  // Buscar todos os projetos
  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/');
      return response.data.projects || response.data;
    },
  });

  // Buscar projeto específico
  const useProject = (id: string) => {
    return useQuery<Project>({
      queryKey: ['projects', id],
      queryFn: async () => {
        const response = await api.get(`/projects/${id}/`);
        return response.data;
      },
      enabled: !!id,
    });
  };

  // Criar projeto
  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await api.post('/projects/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Atualizar projeto
  const updateProject = useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      const { id, ...updateData } = data;
      const response = await api.put(`/projects/${id}/`, updateData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
    },
  });

  // Excluir projeto
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    useProject,
    createProject,
    updateProject,
    deleteProject,
  };
};

// Hook para Tasks
export const useTasks = (projectId: string) => {
  const queryClient = useQueryClient();

  // Buscar tasks do projeto
  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/tasks/`);
      return response.data.tasks || response.data;
    },
    enabled: !!projectId,
  });

  // Buscar task específica
  const useTask = (taskId: string) => {
    return useQuery<Task>({
      queryKey: ['tasks', projectId, taskId],
      queryFn: async () => {
        const response = await api.get(`/projects/${projectId}/tasks/${taskId}/`);
        return response.data;
      },
      enabled: !!taskId && !!projectId,
    });
  };

  // Criar task
  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const response = await api.post(`/projects/${projectId}/tasks/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  // Atualizar task
  const updateTask = useMutation({
    mutationFn: async (data: UpdateTaskData) => {
      const { id, ...updateData } = data;
      const response = await api.put(`/projects/${projectId}/tasks/${id}/`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  // Excluir task
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}/`);
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    refetch,
    useTask,
    createTask,
    updateTask,
    deleteTask,
  };
};

// Hook para Sprints
export const useSprints = (projectId: string) => {
  const queryClient = useQueryClient();

  // Buscar sprints do projeto
  const {
    data: sprints,
    isLoading,
    error,
    refetch,
  } = useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/sprints/`);
      return response.data.sprints || response.data;
    },
    enabled: !!projectId,
  });

  // Buscar sprint específico
  const useSprint = (sprintId: string) => {
    return useQuery<Sprint>({
      queryKey: ['sprints', projectId, sprintId],
      queryFn: async () => {
        const response = await api.get(`/projects/${projectId}/sprints/${sprintId}/`);
        return response.data;
      },
      enabled: !!sprintId && !!projectId,
    });
  };

  // Criar sprint
  const createSprint = useMutation({
    mutationFn: async (data: CreateSprintData) => {
      const response = await api.post(`/projects/${projectId}/sprints/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  // Atualizar sprint
  const updateSprint = useMutation({
    mutationFn: async (data: { id: string; [key: string]: any }) => {
      const { id, ...updateData } = data;
      const response = await api.put(`/projects/${projectId}/sprints/${id}/`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  // Excluir sprint
  const deleteSprint = useMutation({
    mutationFn: async (sprintId: string) => {
      await api.delete(`/projects/${projectId}/sprints/${sprintId}/`);
      return sprintId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  return {
    sprints,
    isLoading,
    error,
    refetch,
    useSprint,
    createSprint,
    updateSprint,
    deleteSprint,
  };
}; 