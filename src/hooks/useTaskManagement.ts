import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  project_id: string; // ✅ VINCULADO AO PROJETO
  title: string;
  description: string | null;
  status: "backlog" | "to_do" | "in_progress" | "review" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  type: "feature" | "bug" | "task" | "story" | "epic";
  assignee_id: string | null;
  reporter_id: string;
  estimated_hours: number | null;
  actual_hours: number | null;
  story_points: number | null;
  sprint_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  attachments: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  project_id: string; // ✅ VINCULADO AO PROJETO
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: "planning" | "active" | "completed" | "cancelled";
  goal: string | null;
  created_at: string;
  updated_at: string;
}

export const useTaskManagement = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar tasks do projeto específico
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error: supabaseError } = await supabase
        .from("tasks")
        .select(`
          *,
          comments (*)
        `)
        .eq("project_id", projectId) // ✅ FILTRAR POR PROJETO
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("Erro Supabase:", supabaseError);
        throw new Error(supabaseError.message);
      }

      setTasks(data || []);
      console.log(`Tasks carregadas para projeto ${projectId}:`, data?.length || 0);

    } catch (error) {
      console.error("Erro ao buscar tasks:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");

      toast({
        title: "Erro",
        description: "Não foi possível carregar as tasks do projeto",
        variant: "destructive",
      });

      // Dados mock para desenvolvimento
      setTasks([
        {
          id: "1",
          project_id: projectId,
          title: "Implementar autenticação",
          description: "Criar sistema de login e registro",
          status: "in_progress",
          priority: "high",
          type: "feature",
          assignee_id: "user-1",
          reporter_id: "user-2",
          estimated_hours: 8,
          actual_hours: 4,
          story_points: 5,
          sprint_id: "sprint-1",
          due_date: "2024-02-15",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T14:30:00Z",
          tags: ["auth", "security"],
          attachments: [],
          comments: []
        },
        {
          id: "2",
          project_id: projectId,
          title: "Corrigir bug no formulário",
          description: "Formulário não valida campos obrigatórios",
          status: "to_do",
          priority: "critical",
          type: "bug",
          assignee_id: null,
          reporter_id: "user-3",
          estimated_hours: 2,
          actual_hours: null,
          story_points: 2,
          sprint_id: null,
          due_date: "2024-01-25",
          created_at: "2024-01-18T09:00:00Z",
          updated_at: "2024-01-18T09:00:00Z",
          tags: ["bug", "form"],
          attachments: [],
          comments: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar sprints do projeto específico
  const fetchSprints = async () => {
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error: supabaseError } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId) // ✅ FILTRAR POR PROJETO
        .order("start_date", { ascending: false });

      if (supabaseError) {
        console.error("Erro Supabase:", supabaseError);
        throw new Error(supabaseError.message);
      }

      setSprints(data || []);

    } catch (error) {
      console.error("Erro ao buscar sprints:", error);
      
      // Dados mock para desenvolvimento
      setSprints([
        {
          id: "sprint-1",
          project_id: projectId,
          name: "Sprint 1 - Fundação",
          description: "Sprint inicial para estabelecer base do projeto",
          start_date: "2024-01-15",
          end_date: "2024-01-29",
          status: "active",
          goal: "Implementar autenticação e estrutura básica",
          created_at: "2024-01-10T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z"
        }
      ]);
    }
  };

  // Criar task vinculada ao projeto
  const createTask = async (taskData: Omit<Task, "id" | "created_at" | "updated_at">) => {
    try {
      setError(null);

      if (!taskData.title.trim()) {
        throw new Error("Título da task é obrigatório");
      }

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error: supabaseError } = await supabase
        .from("tasks")
        .insert([{
          ...taskData,
          project_id: projectId, // ✅ GARANTIR VINCULAÇÃO AO PROJETO
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (supabaseError) {
        console.error("Erro Supabase ao criar task:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Task criada com sucesso!",
      });

      await fetchTasks();
      return data;

    } catch (error) {
      console.error("Erro ao criar task:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      toast({
        title: "Erro",
        description: `Não foi possível criar a task: ${errorMessage}`,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Atualizar task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("tasks")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId)
        .eq("project_id", projectId); // ✅ GARANTIR QUE É DO PROJETO CORRETO

      if (supabaseError) {
        console.error("Erro Supabase ao atualizar task:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Task atualizada com sucesso!",
      });

      await fetchTasks();

    } catch (error) {
      console.error("Erro ao atualizar task:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      toast({
        title: "Erro",
        description: `Não foi possível atualizar a task: ${errorMessage}`,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Excluir task
  const deleteTask = async (taskId: string) => {
    try {
      setError(null);

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("project_id", projectId); // ✅ GARANTIR QUE É DO PROJETO CORRETO

      if (supabaseError) {
        console.error("Erro Supabase ao deletar task:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Task excluída com sucesso!",
      });

      await fetchTasks();

    } catch (error) {
      console.error("Erro ao deletar task:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      toast({
        title: "Erro",
        description: `Não foi possível excluir a task: ${errorMessage}`,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Criar sprint vinculado ao projeto
  const createSprint = async (sprintData: Omit<Sprint, "id" | "created_at" | "updated_at">) => {
    try {
      setError(null);

      if (!sprintData.name.trim()) {
        throw new Error("Nome do sprint é obrigatório");
      }

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error: supabaseError } = await supabase
        .from("sprints")
        .insert([{
          ...sprintData,
          project_id: projectId, // ✅ GARANTIR VINCULAÇÃO AO PROJETO
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (supabaseError) {
        console.error("Erro Supabase ao criar sprint:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Sprint criado com sucesso!",
      });

      await fetchSprints();
      return data;

    } catch (error) {
      console.error("Erro ao criar sprint:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      toast({
        title: "Erro",
        description: `Não foi possível criar o sprint: ${errorMessage}`,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Atualizar sprint
  const updateSprint = async (sprintId: string, updates: Partial<Sprint>) => {
    try {
      setError(null);

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("sprints")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", sprintId)
        .eq("project_id", projectId); // ✅ GARANTIR QUE É DO PROJETO CORRETO

      if (supabaseError) {
        console.error("Erro Supabase ao atualizar sprint:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Sprint atualizado com sucesso!",
      });

      await fetchSprints();

    } catch (error) {
      console.error("Erro ao atualizar sprint:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      toast({
        title: "Erro",
        description: `Não foi possível atualizar o sprint: ${errorMessage}`,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Excluir sprint
  const deleteSprint = async (sprintId: string) => {
    try {
      setError(null);

      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("sprints")
        .delete()
        .eq("id", sprintId)
        .eq("project_id", projectId); // ✅ GARANTIR QUE É DO PROJETO CORRETO

      if (supabaseError) {
        console.error("Erro Supabase ao deletar sprint:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Sprint excluído com sucesso!",
      });

      await fetchSprints();

    } catch (error) {
      console.error("Erro ao deletar sprint:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      toast({
        title: "Erro",
        description: `Não foi possível excluir o sprint: ${errorMessage}`,
        variant: "destructive",
      });

      throw error;
    }
  };

  // Buscar tasks por status
  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter(task => task.status === status);
  };

  // Buscar tasks por sprint
  const getTasksBySprint = (sprintId: string) => {
    return tasks.filter(task => task.sprint_id === sprintId);
  };

  // Buscar tasks por assignee
  const getTasksByAssignee = (assigneeId: string) => {
    return tasks.filter(task => task.assignee_id === assigneeId);
  };

  // Buscar tasks por prioridade
  const getTasksByPriority = (priority: Task["priority"]) => {
    return tasks.filter(task => task.priority === priority);
  };

  // Buscar tasks por tipo
  const getTasksByType = (type: Task["type"]) => {
    return tasks.filter(task => task.type === type);
  };

  // Buscar sprint ativo
  const getActiveSprint = () => {
    return sprints.find(sprint => sprint.status === "active");
  };

  // Buscar sprints por status
  const getSprintsByStatus = (status: Sprint["status"]) => {
    return sprints.filter(sprint => sprint.status === status);
  };

  // Mover task entre status (drag and drop)
  const moveTask = async (taskId: string, newStatus: Task["status"]) => {
    await updateTask(taskId, { status: newStatus });
  };

  // Atribuir task a usuário
  const assignTask = async (taskId: string, assigneeId: string) => {
    await updateTask(taskId, { assignee_id: assigneeId });
  };

  // Adicionar task ao sprint
  const addTaskToSprint = async (taskId: string, sprintId: string) => {
    await updateTask(taskId, { sprint_id: sprintId });
  };

  // Remover task do sprint
  const removeTaskFromSprint = async (taskId: string) => {
    await updateTask(taskId, { sprint_id: null });
  };

  // Registrar horas trabalhadas
  const logHours = async (taskId: string, hours: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newActualHours = (task.actual_hours || 0) + hours;
      await updateTask(taskId, { actual_hours: newActualHours });
    }
  };

  // Adicionar comentário à task
  const addComment = async (taskId: string, content: string, userId: string) => {
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("comments")
        .insert([{
          task_id: taskId,
          user_id: userId,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });

      await fetchTasks();

    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário",
        variant: "destructive",
      });
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchSprints();
    }
  }, [projectId]);

  return {
    // Tasks
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getTasksBySprint,
    getTasksByAssignee,
    getTasksByPriority,
    getTasksByType,
    moveTask,
    assignTask,
    addTaskToSprint,
    removeTaskFromSprint,
    logHours,
    addComment,

    // Sprints
    sprints,
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
    getActiveSprint,
    getSprintsByStatus,
  };
}; 