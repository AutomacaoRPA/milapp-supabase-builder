import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { environmentManager } from "@/lib/environment";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "ideacao" | "qualidade_processos" | "planejamento" | "hipotese_formulada" | "analise_viabilidade" | "prototipo_rapido" | "validacao_prototipo" | "mvp" | "teste_operacional" | "escala_entrega" | "acompanhamento_pos_entrega" | "sustentacao_evolucao" | "concluido";
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
  // Campos adicionais para funcionalidade completa
  category?: string | null;
  expected_impact?: string | null;
  responsible_name?: string | null;
  responsible_email?: string | null;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  methodology?: string | null;
  priority?: number | null;
  estimated_roi?: number | null;
  start_date?: string | null;
  target_date?: string | null;
  assigned_architect?: string | null;
  product_owner?: string | null;
  created_by: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Verificar se é ambiente demo ou produção
  const environment = environmentManager.getCurrentEnvironment();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      if (environmentManager.shouldUseMockData()) {
        // Carregar projetos demo (dados de exemplo)
        const demoProjects = await loadDemoProjects();
        setProjects(demoProjects);
      } else {
        // Carregar projetos reais do Supabase (produção)
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      }
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

  const loadDemoProjects = async (): Promise<Project[]> => {
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: "demo-1",
        name: "Automação de Notas Fiscais",
        description: "Automatização do processo de validação e aprovação de notas fiscais com OCR e validações inteligentes",
        status: "mvp",
        priority: 5,
        methodology: "scrum",
        complexity_score: 7,
        estimated_roi: 45000,
        actual_roi: null,
        start_date: "2024-01-15",
        target_date: "2024-03-15",
        completed_date: null,
        created_by: "demo-user",
        assigned_architect: "demo-user",
        product_owner: "demo-user",
        created_at: "2024-01-10T10:00:00Z",
        updated_at: "2024-01-18T15:30:00Z",
        category: "automacao",
        expected_impact: "Redução de 80% no tempo de processamento de notas fiscais",
        responsible_name: "João Silva",
        responsible_email: "joao.silva@medsenior.com"
      },
      {
        id: "demo-2", 
        name: "Conciliação Bancária Automatizada",
        description: "Sistema inteligente para conciliação automática de extratos bancários com sistema ERP",
        status: "teste_operacional",
        priority: 4,
        methodology: "kanban",
        complexity_score: 6,
        estimated_roi: 32000,
        actual_roi: 28500,
        start_date: "2024-01-05",
        target_date: "2024-02-28",
        completed_date: null,
        created_by: "demo-user",
        assigned_architect: "demo-user",
        product_owner: "demo-user",
        created_at: "2024-01-05T09:00:00Z",
        updated_at: "2024-01-18T14:20:00Z",
        category: "integracao",
        expected_impact: "Eliminação de 90% das conciliações manuais",
        responsible_name: "Maria Santos",
        responsible_email: "maria.santos@medsenior.com"
      },
      {
        id: "demo-3",
        name: "Portal de Atendimento ao Paciente",
        description: "Interface automatizada para agendamentos e consultas de pacientes 50+ com foco em acessibilidade",
        status: "planejamento",
        priority: 3,
        methodology: "agile",
        complexity_score: 8,
        estimated_roi: 55000,
        actual_roi: null,
        start_date: null,
        target_date: "2024-04-30",
        completed_date: null,
        created_by: "demo-user",
        assigned_architect: "demo-user",
        product_owner: "demo-user",
        created_at: "2024-01-12T11:00:00Z",
        updated_at: "2024-01-18T16:00:00Z",
        category: "inovacao",
        expected_impact: "Melhoria de 60% na experiência do paciente",
        responsible_name: "Carlos Lima",
        responsible_email: "carlos.lima@medsenior.com"
      },
      {
        id: "demo-4",
        name: "Relatórios Gerenciais Automatizados",
        description: "Geração automática de dashboards e relatórios executivos com dados em tempo real",
        status: "ideacao",
        priority: 2,
        methodology: "waterfall",
        complexity_score: 4,
        estimated_roi: 18000,
        actual_roi: null,
        start_date: null,
        target_date: "2024-05-15",
        completed_date: null,
        created_by: "demo-user",
        assigned_architect: null,
        product_owner: null,
        created_at: "2024-01-16T13:00:00Z",
        updated_at: "2024-01-18T17:30:00Z",
        category: "otimizacao",
        expected_impact: "Redução de 70% no tempo de geração de relatórios",
        responsible_name: "Ana Costa",
        responsible_email: "ana.costa@medsenior.com"
      },
      {
        id: "demo-5",
        name: "Sistema de Compliance LGPD",
        description: "Automação para garantir conformidade com LGPD no tratamento de dados de pacientes",
        status: "concluido",
        priority: 5,
        methodology: "scrum",
        complexity_score: 9,
        estimated_roi: 25000,
        actual_roi: 31000,
        start_date: "2023-11-01",
        target_date: "2024-01-15",
        completed_date: "2024-01-12",
        created_by: "demo-user",
        assigned_architect: "demo-user",
        product_owner: "demo-user",
        created_at: "2023-11-01T08:00:00Z",
        updated_at: "2024-01-12T18:00:00Z",
        category: "compliance",
        expected_impact: "Conformidade 100% com LGPD",
        responsible_name: "Rafael Oliveira",
        responsible_email: "rafael.oliveira@medsenior.com"
      }
    ];
  };

  const createProject = async (projectData: ProjectCreate) => {
    try {
      if (environmentManager.shouldUseMockData()) {
        // Em modo demo, simular criação mas não persistir
        const newProject: Project = {
          id: `demo-${Date.now()}`,
          ...projectData,
          status: "ideacao",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: null,
          expected_impact: null,
          responsible_name: null,
          responsible_email: null,
        };

        // Atualizar estado local com novo projeto demo
        setProjects(prev => [newProject, ...prev]);

        toast({
          title: "Projeto Demo Criado",
          description: "Projeto criado no ambiente de demonstração!",
        });

        return newProject;
      } else {
        // Modo produção - persistir no Supabase
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
      }
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
      // Primeiro atualiza o estado local para feedback imediato
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === id ? { ...project, ...updates } : project
        )
      );

      if (environmentManager.shouldUseMockData()) {
        // Em modo demo, apenas atualizar estado local
        toast({
          title: "Projeto Demo Atualizado",
          description: "Alterações salvas no ambiente de demonstração!",
        });
        return { id, ...updates };
      } else {
        // Modo produção - persistir no Supabase
        const { data, error } = await supabase
          .from("projects")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          // Reverte o estado local em caso de erro
          setProjects(prevProjects => 
            prevProjects.map(project => 
              project.id === id ? { ...project, ...updates } : project
            )
          );
          throw error;
        }

        toast({
          title: "Sucesso",
          description: "Projeto atualizado com sucesso!",
        });

        return data;
      }
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o projeto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProjects(prevProjects => 
        prevProjects.filter(project => project.id !== id)
      );

      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto",
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
    deleteProject,
  };
};