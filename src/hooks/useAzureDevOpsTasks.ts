import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkItem, WorkItemSubtask, KanbanColumn, WorkItemType, WorkItemPriority, WorkItemStatus } from "@/types/project-lifecycle";

// Interface para compatibilidade com código existente
export interface AzureDevOpsTask extends WorkItem {}

export interface ProjectWithWorkItems {
  id: string;
  name: string;
  description?: string;
  work_items: WorkItem[];
  azure_devops_config: {
    board_settings: {
      show_subtasks_inline: boolean;
      enable_task_estimation: boolean;
      enable_time_tracking: boolean;
      enable_acceptance_criteria: boolean;
      enable_dependencies: boolean;
      max_subtasks_per_card: number;
      default_task_type: WorkItemType;
      default_priority: WorkItemPriority;
    };
    column_config: {
      [key: string]: {
        title: string;
        color: string;
        wip_limit?: number;
        allow_subtasks: boolean;
      };
    };
  };
  kanban_board: {
    columns: KanbanColumn[];
  };
  sprint_backlog: WorkItem[];
  product_backlog: WorkItem[];
}

export const useAzureDevOpsTasks = (projectId?: string) => {
  const [project, setProject] = useState<ProjectWithWorkItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const { toast } = useToast();

  // Buscar projeto com work items
  const fetchProjectWithWorkItems = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          work_items,
          azure_devops_config,
          kanban_board,
          sprint_backlog,
          product_backlog
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;

      const projectData = data as ProjectWithWorkItems;
      setProject(projectData);

      // Organizar work items por colunas
      const organizedColumns = organizeWorkItemsByColumns(projectData);
      setColumns(organizedColumns);

    } catch (error) {
      console.error("Erro ao buscar projeto com work items:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os work items do projeto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Organizar work items por colunas do Kanban
  const organizeWorkItemsByColumns = useCallback((projectData: ProjectWithWorkItems): KanbanColumn[] => {
    const config = projectData.azure_devops_config?.column_config || {};
    
    const defaultColumns: KanbanColumn[] = [
      {
        id: 'backlog',
        title: 'Backlog',
        status: 'backlog',
        color: '#6c757d',
        allow_subtasks: true,
        work_items: []
      },
      {
        id: 'todo',
        title: 'To Do',
        status: 'todo',
        color: '#007bff',
        allow_subtasks: true,
        work_items: []
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        status: 'in_progress',
        color: '#ffc107',
        wip_limit: 5,
        allow_subtasks: true,
        work_items: []
      },
      {
        id: 'review',
        title: 'Review',
        status: 'review',
        color: '#17a2b8',
        wip_limit: 3,
        allow_subtasks: true,
        work_items: []
      },
      {
        id: 'testing',
        title: 'Testing',
        status: 'testing',
        color: '#fd7e14',
        wip_limit: 3,
        allow_subtasks: true,
        work_items: []
      },
      {
        id: 'done',
        title: 'Done',
        status: 'done',
        color: '#28a745',
        allow_subtasks: true,
        work_items: []
      }
    ];

    // Usar configuração personalizada se disponível
    const boardConfig = projectData.kanban_board?.columns || defaultColumns;

    // Organizar work items por status
    const workItems = projectData.work_items || [];
    const organizedColumns = boardConfig.map(column => ({
      ...column,
      work_items: workItems.filter(workItem => workItem.status === column.status)
    }));

    return organizedColumns;
  }, []);

  // Adicionar novo work item
  const addWorkItem = useCallback(async (workItemData: Omit<WorkItem, 'id' | 'created_at' | 'updated_at' | 'subtasks'>) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase.rpc('add_work_item_to_project', {
        p_project_id: projectId,
        p_work_item_data: workItemData
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Work item criado com sucesso!",
      });

      await fetchProjectWithWorkItems();
      return data;
    } catch (error) {
      console.error("Erro ao criar work item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o work item",
        variant: "destructive",
      });
      return null;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // Atualizar work item
  const updateWorkItem = useCallback(async (workItemId: string, updates: Partial<WorkItem>) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase.rpc('update_work_item_in_project', {
        p_project_id: projectId,
        p_work_item_id: workItemId,
        p_work_item_data: updates
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Work item atualizado com sucesso!",
      });

      await fetchProjectWithWorkItems();
      return data;
    } catch (error) {
      console.error("Erro ao atualizar work item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o work item",
        variant: "destructive",
      });
      return null;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // Remover work item
  const removeWorkItem = useCallback(async (workItemId: string) => {
    if (!projectId) return false;

    try {
      const { error } = await supabase.rpc('remove_work_item_from_project', {
        p_project_id: projectId,
        p_work_item_id: workItemId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Work item removido com sucesso!",
      });

      await fetchProjectWithWorkItems();
      return true;
    } catch (error) {
      console.error("Erro ao remover work item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o work item",
        variant: "destructive",
      });
      return false;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // Mover work item entre colunas
  const moveWorkItem = useCallback(async (workItemId: string, newStatus: WorkItemStatus) => {
    if (!projectId) return false;

    try {
      const { error } = await supabase.rpc('move_work_item_column', {
        p_project_id: projectId,
        p_work_item_id: workItemId,
        p_new_status: newStatus
      });

      if (error) throw error;

      await fetchProjectWithWorkItems();
      return true;
    } catch (error) {
      console.error("Erro ao mover work item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o work item",
        variant: "destructive",
      });
      return false;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // =====================================================
  // FUNÇÕES PARA GESTÃO DE SUBTAREFAS INLINE
  // =====================================================

  // Adicionar subtarefa a um work item
  const addSubtask = useCallback(async (workItemId: string, subtaskData: Omit<WorkItemSubtask, 'id' | 'created_at' | 'updated_at'>) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase.rpc('add_subtask_to_work_item', {
        p_project_id: projectId,
        p_work_item_id: workItemId,
        p_subtask_data: subtaskData
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Subtarefa adicionada com sucesso!",
      });

      await fetchProjectWithWorkItems();
      return data;
    } catch (error) {
      console.error("Erro ao adicionar subtarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a subtarefa",
        variant: "destructive",
      });
      return null;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // Atualizar subtarefa
  const updateSubtask = useCallback(async (workItemId: string, subtaskId: string, updates: Partial<WorkItemSubtask>) => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase.rpc('update_subtask_in_work_item', {
        p_project_id: projectId,
        p_work_item_id: workItemId,
        p_subtask_id: subtaskId,
        p_subtask_data: updates
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Subtarefa atualizada com sucesso!",
      });

      await fetchProjectWithWorkItems();
      return data;
    } catch (error) {
      console.error("Erro ao atualizar subtarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a subtarefa",
        variant: "destructive",
      });
      return null;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // Remover subtarefa
  const removeSubtask = useCallback(async (workItemId: string, subtaskId: string) => {
    if (!projectId) return false;

    try {
      const { error } = await supabase.rpc('remove_subtask_from_work_item', {
        p_project_id: projectId,
        p_work_item_id: workItemId,
        p_subtask_id: subtaskId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Subtarefa removida com sucesso!",
      });

      await fetchProjectWithWorkItems();
      return true;
    } catch (error) {
      console.error("Erro ao remover subtarefa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a subtarefa",
        variant: "destructive",
      });
      return false;
    }
  }, [projectId, fetchProjectWithWorkItems, toast]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchProjectWithWorkItems();
  }, [fetchProjectWithWorkItems]);

  // Funções de compatibilidade com código existente
  const addTask = addWorkItem;
  const updateTask = updateWorkItem;
  const removeTask = removeWorkItem;
  const moveTask = moveWorkItem;

  return {
    // Estado
    project,
    loading,
    columns,
    
    // Funções para work items
    addWorkItem,
    updateWorkItem,
    removeWorkItem,
    moveWorkItem,
    
    // Funções para subtarefas
    addSubtask,
    updateSubtask,
    removeSubtask,
    
    // Funções de compatibilidade (legado)
    addTask,
    updateTask,
    removeTask,
    moveTask,
    
    // Função de recarregamento
    refresh: fetchProjectWithWorkItems
  };
}; 