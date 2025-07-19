import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

      setProjects(data || []);
      
      // Log para debug
      console.log("Projetos carregados:", data?.length || 0);
      
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
          updated_at: "2024-01-20T14:30:00Z"
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
          updated_at: "2024-01-10T09:00:00Z"
        }
      ]);
    } finally {
      setLoading(false);
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