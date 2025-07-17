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
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso!",
      });

      await fetchProjects();
      return data;
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o projeto",
        variant: "destructive",
      });
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso!",
      });

      await fetchProjects();
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
  };
};