
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  type: "development" | "documentation" | "testing" | "review";
  status: "todo" | "in_progress" | "review" | "done";
  priority: number;
  estimated_hours: number;
  actual_hours: number;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjectTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("project_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Cast the data to ensure type compatibility
      setTasks((data || []) as ProjectTask[]);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<ProjectTask, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("project_tasks")
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso!",
      });

      await fetchTasks();
      return data;
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<ProjectTask>) => {
    try {
      const { error } = await supabase
        .from("project_tasks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso!",
      });

      await fetchTasks();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
  };
};
