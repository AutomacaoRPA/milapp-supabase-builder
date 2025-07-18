import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/hooks/useProjects";
import { TrendingUp, DollarSign, Clock, Users, AlertTriangle, Target } from "lucide-react";

interface ProjectMetricsProps {
  projects: Project[];
}

const ProjectMetrics = ({ projects }: ProjectMetricsProps) => {
  // Cálculos de métricas
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => !["concluido", "sustentacao_evolucao"].includes(p.status)).length;
  const completedProjects = projects.filter(p => p.status === "concluido").length;
  
  const totalEstimatedROI = projects.reduce((sum, p) => sum + (p.estimated_roi || 0), 0);
  const avgROI = totalProjects > 0 ? totalEstimatedROI / totalProjects : 0;
  
  const highPriorityProjects = projects.filter(p => (p.priority || 0) >= 4).length;
  
  const overdueProjects = projects.filter(p => {
    if (!p.target_date || p.status === "concluido") return false;
    return new Date(p.target_date) < new Date();
  }).length;
  
  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
  const activeRate = totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0;

  // Distribuição por metodologia
  const methodologyDistribution = projects.reduce((acc, project) => {
    const method = project.methodology || "não definido";
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* ROI Total Estimado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ROI Total Estimado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalEstimatedROI)}
          </div>
          <p className="text-xs text-muted-foreground">
            Média: {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(avgROI)} por projeto
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Conclusão */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedProjects} de {totalProjects} projetos
          </p>
        </CardContent>
      </Card>

      {/* Projetos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <Progress value={activeRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {activeRate.toFixed(1)}% da carteira ativa
          </p>
        </CardContent>
      </Card>

      {/* Projetos de Alta Prioridade */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{highPriorityProjects}</div>
          <p className="text-xs text-muted-foreground">
            Requerem atenção especial
          </p>
        </CardContent>
      </Card>

      {/* Projetos em Atraso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projetos em Atraso</CardTitle>
          <Clock className="h-4 w-4 text-rpa" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rpa">{overdueProjects}</div>
          <p className="text-xs text-muted-foreground">
            Ultrapassaram data meta
          </p>
        </CardContent>
      </Card>

      {/* Distribuição por Metodologia */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metodologias</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(methodologyDistribution).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-sm capitalize">{method}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectMetrics;