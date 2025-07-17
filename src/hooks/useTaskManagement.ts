import { useState, useCallback } from 'react';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'testing' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string;
  story_points: number;
  estimated_hours: number;
  actual_hours: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  comments: Comment[];
  time_logs: TimeLog[];
  column_transitions: ColumnTransition[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  author_avatar?: string;
  created_at: string;
  type: 'comment' | 'update' | 'blocker' | 'solution';
  parent_id?: string;
  replies?: Comment[];
}

export interface TimeLog {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  duration: number; // em minutos
  description: string;
  activity_type: 'development' | 'testing' | 'review' | 'meeting' | 'research' | 'documentation' | 'debugging';
}

export interface ColumnTransition {
  id: string;
  task_id: string;
  from_column: string;
  to_column: string;
  transition_date: string;
  user_id: string;
  notes?: string;
}

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assigned_to?: string[];
  story_points?: number[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface TaskMetrics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  average_cycle_time: number;
  average_lead_time: number;
  velocity: number;
  burndown_data: BurndownPoint[];
}

export interface BurndownPoint {
  date: string;
  remaining_points: number;
  ideal_points: number;
}

export const useTaskManagement = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  // Carregar tasks do projeto
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Aqui você faria a chamada para a API
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError('Erro ao carregar tasks');
      console.error('Erro ao carregar tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Criar nova task
  const createTask = useCallback(async (taskData: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError('Erro ao criar task');
      console.error('Erro ao criar task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Atualizar task
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      ));
      return updatedTask;
    } catch (err) {
      setError('Erro ao atualizar task');
      console.error('Erro ao atualizar task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Mover task entre colunas
  const moveTask = useCallback(async (taskId: string, newStatus: Task['status'], notes?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const transition: ColumnTransition = {
      id: Date.now().toString(),
      task_id: taskId,
      from_column: task.status,
      to_column: newStatus,
      transition_date: new Date().toISOString(),
      user_id: 'current-user-id', // Você obteria isso do contexto de autenticação
      notes,
    };

    try {
      await updateTask(taskId, { 
        status: newStatus,
        column_transitions: [...(task.column_transitions || []), transition]
      });
    } catch (err) {
      console.error('Erro ao mover task:', err);
      throw err;
    }
  }, [tasks, updateTask]);

  // Log de tempo
  const logTime = useCallback(async (taskId: string, timeLog: Partial<TimeLog>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTimeLog: TimeLog = {
      id: Date.now().toString(),
      user_id: 'current-user-id', // Você obteria isso do contexto de autenticação
      task_id,
      start_time: timeLog.start_time || new Date().toISOString(),
      end_time: timeLog.end_time || new Date().toISOString(),
      duration: timeLog.duration || 0,
      description: timeLog.description || '',
      activity_type: timeLog.activity_type || 'development',
    };

    try {
      await updateTask(taskId, {
        time_logs: [...(task.time_logs || []), newTimeLog],
        actual_hours: task.actual_hours + (newTimeLog.duration / 60)
      });
    } catch (err) {
      console.error('Erro ao registrar tempo:', err);
      throw err;
    }
  }, [tasks, updateTask]);

  // Adicionar comentário
  const addComment = useCallback(async (taskId: string, comment: Partial<Comment>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      content: comment.content || '',
      author: comment.author || 'current-user',
      created_at: new Date().toISOString(),
      type: comment.type || 'comment',
      parent_id: comment.parent_id,
    };

    try {
      await updateTask(taskId, {
        comments: [...(task.comments || []), newComment]
      });
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      throw err;
    }
  }, [tasks, updateTask]);

  // Adicionar anexo
  const addAttachment = useCallback(async (taskId: string, file: File) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file), // Em produção, você faria upload para o servidor
      uploaded_by: 'current-user',
      uploaded_at: new Date().toISOString(),
    };

    try {
      await updateTask(taskId, {
        attachments: [...(task.attachments || []), newAttachment]
      });
    } catch (err) {
      console.error('Erro ao adicionar anexo:', err);
      throw err;
    }
  }, [tasks, updateTask]);

  // Calcular métricas
  const calculateMetrics = useCallback((): TaskMetrics => {
    const total_tasks = tasks.length;
    const completed_tasks = tasks.filter(t => t.status === 'done').length;
    const in_progress_tasks = tasks.filter(t => t.status === 'in_progress').length;
    const blocked_tasks = tasks.filter(t => 
      t.comments?.some(c => c.type === 'blocker')
    ).length;

    // Calcular cycle time e lead time
    const cycleTimes = tasks
      .filter(t => t.status === 'done' && t.column_transitions)
      .map(task => {
        const startTransition = task.column_transitions?.find(t => t.to_column === 'in_progress');
        const endTransition = task.column_transitions?.find(t => t.to_column === 'done');
        
        if (startTransition && endTransition) {
          const start = new Date(startTransition.transition_date);
          const end = new Date(endTransition.transition_date);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // dias
        }
        return 0;
      });

    const average_cycle_time = cycleTimes.length > 0 
      ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length 
      : 0;

    // Calcular velocity (story points completados)
    const velocity = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, task) => sum + task.story_points, 0);

    // Gerar dados de burndown
    const burndown_data = generateBurndownData(tasks);

    return {
      total_tasks,
      completed_tasks,
      in_progress_tasks,
      blocked_tasks,
      average_cycle_time,
      average_lead_time: average_cycle_time, // Simplificado
      velocity,
      burndown_data,
    };
  }, [tasks]);

  // Filtrar tasks
  const filteredTasks = useCallback(() => {
    let filtered = [...tasks];

    if (filters.status?.length) {
      filtered = filtered.filter(task => filters.status!.includes(task.status));
    }

    if (filters.priority?.length) {
      filtered = filtered.filter(task => filters.priority!.includes(task.priority));
    }

    if (filters.assigned_to?.length) {
      filtered = filtered.filter(task => filters.assigned_to!.includes(task.assigned_to));
    }

    if (filters.story_points?.length) {
      const [min, max] = filters.story_points;
      filtered = filtered.filter(task => 
        task.story_points >= min && task.story_points <= max
      );
    }

    if (filters.date_range) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.created_at);
        const start = new Date(filters.date_range!.start);
        const end = new Date(filters.date_range!.end);
        return taskDate >= start && taskDate <= end;
      });
    }

    return filtered;
  }, [tasks, filters]);

  // Gerar dados de burndown
  const generateBurndownData = (tasks: Task[]): BurndownPoint[] => {
    // Implementação simplificada - em produção você teria dados reais de sprint
    const today = new Date();
    const sprintStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 dias atrás
    
    const totalPoints = tasks.reduce((sum, task) => sum + task.story_points, 0);
    const completedPoints = tasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + task.story_points, 0);

    const data: BurndownPoint[] = [];
    for (let i = 0; i <= 14; i++) {
      const date = new Date(sprintStart.getTime() + i * 24 * 60 * 60 * 1000);
      const idealPoints = totalPoints - (totalPoints / 14) * i;
      const remainingPoints = Math.max(0, totalPoints - completedPoints);
      
      data.push({
        date: date.toISOString().split('T')[0],
        remaining_points: remainingPoints,
        ideal_points: idealPoints,
      });
    }

    return data;
  };

  return {
    // Estado
    tasks,
    loading,
    error,
    filters,
    
    // Ações
    loadTasks,
    createTask,
    updateTask,
    moveTask,
    logTime,
    addComment,
    addAttachment,
    setFilters,
    
    // Computed
    filteredTasks: filteredTasks(),
    metrics: calculateMetrics(),
  };
}; 