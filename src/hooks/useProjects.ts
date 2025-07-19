import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Comment } from "@/components/CommentSystem";
import { ProjectLifecycle, ProjectTask, ProjectSprint, ProjectRisk, ProjectStakeholder, ProjectMilestone, ProjectDeployment, ProjectDocument } from "@/types/project-lifecycle";

// Manter interface Project para compatibilidade, mas usar ProjectLifecycle internamente
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "ideacao" | "planejamento" | "desenvolvimento" | "homologacao" | "producao" | "suspenso" | "concluido";
  priority: number | null;
  methodology: string | null;
  complexity_score: number | null;
  estimated_roi: number | null;
  actual_roi: number | null;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  created_by: string;
  assigned_architect: string | null;
  product_owner: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Campos integrados expandidos
  comments?: Comment[];
  tasks?: ProjectTask[];
  sprints?: ProjectSprint[];
  risks?: ProjectRisk[];
  stakeholders?: ProjectStakeholder[];
  milestones?: ProjectMilestone[];
  deployments?: ProjectDeployment[];
  documents?: ProjectDocument[];
  metrics?: {
    total_tasks: number;
    completed_tasks: number;
    total_sprints: number;
    completed_sprints: number;
    deployment_count: number;
    last_deployment?: string;
    velocity_average: number;
    burndown_data: Array<{ date: string; remaining_points: number }>;
    risk_count: { low: number; medium: number; high: number; critical: number };
    stakeholder_engagement: number;
  };
  // Configurações do projeto
  settings?: {
    sprint_duration_weeks: number;
    story_point_scale: "fibonacci" | "linear" | "custom";
    definition_of_done: string[];
    definition_of_ready: string[];
    working_hours_per_day: number;
    team_size: number;
  };
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error: supabaseError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("Erro Supabase:", supabaseError);
        throw new Error(supabaseError.message);
      }

      // Enriquecer projetos com dados integrados
      const enrichedProjects = await Promise.all(
        (data || []).map(async (project) => {
          const [comments, metrics] = await Promise.all([
            fetchProjectComments(project.id),
            fetchProjectMetrics(project.id)
          ]);

          return {
            ...project,
            comments,
            metrics
          };
        })
      );

      setProjects(enrichedProjects);
      
      // Log para debug
      console.log("Projetos carregados:", enrichedProjects.length);
      
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos. Verifique a conexão.",
        variant: "destructive",
      });
      
      // Dados mock para desenvolvimento
      setProjects([
        {
          id: "1",
          name: "Automação de Faturamento",
          description: "Automação do processo de faturamento mensal",
          status: "desenvolvimento",
          priority: 4,
          methodology: "scrum",
          complexity_score: 7,
          estimated_roi: 50000,
          actual_roi: null,
          start_date: "2024-01-15",
          target_date: "2024-03-15",
          completed_date: null,
          created_by: "user-1",
          assigned_architect: "architect-1",
          product_owner: "po-1",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T14:30:00Z",
          comments: [
            {
              id: "1",
              content: "Projeto iniciado com sucesso!",
              author: "João Silva",
              created_at: new Date(Date.now() - 86400000).toISOString(),
              type: 'update',
              replies: []
            }
          ],
          metrics: {
            total_tasks: 12,
            completed_tasks: 8,
            total_sprints: 4,
            completed_sprints: 2,
            deployment_count: 3,
            last_deployment: "2024-01-20T14:30:00Z"
          }
        },
        {
          id: "2",
          name: "Processamento de Notas Fiscais",
          description: "Automação da leitura e processamento de NF-e",
          status: "ideacao",
          priority: 3,
          methodology: "kanban",
          complexity_score: 5,
          estimated_roi: 30000,
          actual_roi: null,
          start_date: null,
          target_date: "2024-04-30",
          completed_date: null,
          created_by: "user-2",
          assigned_architect: null,
          product_owner: "po-2",
          created_at: "2024-01-10T09:00:00Z",
          updated_at: "2024-01-10T09:00:00Z",
          comments: [],
          metrics: {
            total_tasks: 0,
            completed_tasks: 0,
            total_sprints: 0,
            completed_sprints: 0,
            deployment_count: 0
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar comentários de um projeto
  const fetchProjectComments = async (projectId: string): Promise<Comment[]> => {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("project_comments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar comentários:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
      return [];
    }
  };

  // Buscar métricas de um projeto
  const fetchProjectMetrics = async (projectId: string) => {
    try {
      if (!supabase) {
        return {
          total_tasks: 0,
          completed_tasks: 0,
          total_sprints: 0,
          completed_sprints: 0,
          deployment_count: 0
        };
      }

      // Buscar métricas de tarefas
      const { data: tasks, error: tasksError } = await supabase
        .from("project_tasks")
        .select("status")
        .eq("project_id", projectId);

      // Buscar métricas de sprints
      const { data: sprints, error: sprintsError } = await supabase
        .from("project_sprints")
        .select("status")
        .eq("project_id", projectId);

      // Buscar métricas de deployments
      const { data: deployments, error: deploymentsError } = await supabase
        .from("project_deployments")
        .select("created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tasksError || sprintsError || deploymentsError) {
        console.error("Erro ao buscar métricas:", { tasksError, sprintsError, deploymentsError });
      }

      return {
        total_tasks: tasks?.length || 0,
        completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
        total_sprints: sprints?.length || 0,
        completed_sprints: sprints?.filter(s => s.status === 'completed').length || 0,
        deployment_count: deployments?.length || 0,
        last_deployment: deployments?.[0]?.created_at
      };
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      return {
        total_tasks: 0,
        completed_tasks: 0,
        total_sprints: 0,
        completed_sprints: 0,
        deployment_count: 0
      };
    }
  };

  // Adicionar comentário a um projeto
  const addProjectComment = async (projectId: string, commentData: {
    content: string;
    type: 'comment' | 'update' | 'blocker' | 'solution';
    parent_id?: string;
  }) => {
    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error } = await supabase
        .from("project_comments")
        .insert([{
          project_id: projectId,
          content: commentData.content,
          type: commentData.type,
          parent_id: commentData.parent_id,
          author: "Usuário Atual", // TODO: Integrar com autenticação
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Atualizar projetos localmente
      setProjects(prev => prev.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            comments: [...(project.comments || []), data]
          };
        }
        return project;
      }));

      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!",
      });

      return data;
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createProject = async (projectData: Omit<Project, "id" | "created_at" | "updated_at">) => {
    try {
      setError(null);
      
      // Validação dos dados
      if (!projectData.name.trim()) {
        throw new Error("Nome do projeto é obrigatório");
      }

      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { data, error: supabaseError } = await supabase
        .from("projects")
        .insert([{
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (supabaseError) {
        console.error("Erro Supabase ao criar:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso!",
      });

      await fetchProjects();
      return data;
      
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro",
        description: `Não foi possível criar o projeto: ${errorMessage}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      setError(null);
      
      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (supabaseError) {
        console.error("Erro Supabase ao atualizar:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso!",
      });

      await fetchProjects();
      
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o projeto: ${errorMessage}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setError(null);
      
      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        throw new Error("Cliente Supabase não configurado");
      }

      const { error: supabaseError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (supabaseError) {
        console.error("Erro Supabase ao deletar:", supabaseError);
        throw new Error(supabaseError.message);
      }

      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso!",
      });

      await fetchProjects();
      
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro",
        description: `Não foi possível excluir o projeto: ${errorMessage}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};