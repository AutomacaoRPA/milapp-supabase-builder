
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_type: "pdd" | "sdd" | "bpmn" | "code" | "test" | "other";
  file_size: number | null;
  uploaded_by: string;
  version: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjectFiles = (projectId?: string) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("project_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Erro ao buscar arquivos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFile = async (fileData: Omit<ProjectFile, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("project_files")
        .insert([fileData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Arquivo registrado com sucesso!",
      });

      await fetchFiles();
      return data;
    } catch (error) {
      console.error("Erro ao registrar arquivo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o arquivo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  return {
    files,
    loading,
    fetchFiles,
    createFile,
  };
};
