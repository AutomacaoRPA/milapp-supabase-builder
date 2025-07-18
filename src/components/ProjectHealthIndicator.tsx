import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface ProjectHealthIndicatorProps {
  project: Project;
}

const ProjectHealthIndicator = ({ project }: ProjectHealthIndicatorProps) => {
  const calculateHealthScore = (project: Project): { score: number; status: string; color: string; icon: any } => {
    let score = 100;
    
    // Verifica se tem data meta definida
    if (!project.target_date) {
      score -= 20;
    } else {
      // Verifica se está atrasado
      const targetDate = new Date(project.target_date);
      const today = new Date();
      if (targetDate < today && project.status !== "concluido") {
        score -= 30;
      }
    }
    
    // Verifica se tem ROI estimado
    if (!project.estimated_roi) {
      score -= 15;
    }
    
    // Verifica se tem arquiteto e PO definidos
    if (!project.assigned_architect) score -= 10;
    if (!project.product_owner) score -= 10;
    
    // Verifica prioridade
    if (!project.priority || project.priority < 3) {
      score -= 10;
    }
    
    // Determina status baseado no score
    if (score >= 80) {
      return { score, status: "Excelente", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 };
    } else if (score >= 60) {
      return { score, status: "Bom", color: "bg-blue-100 text-blue-800", icon: TrendingUp };
    } else if (score >= 40) {
      return { score, status: "Atenção", color: "bg-yellow-100 text-yellow-800", icon: Clock };
    } else {
      return { score, status: "Crítico", color: "bg-red-100 text-red-800", icon: AlertTriangle };
    }
  };

  const health = calculateHealthScore(project);
  const Icon = health.icon;

  return (
    <Badge className={`${health.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {health.status} ({health.score}%)
    </Badge>
  );
};

export default ProjectHealthIndicator;