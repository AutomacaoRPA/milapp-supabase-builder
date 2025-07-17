import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  GitBranch
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  availability: number; // porcentagem
  current_allocation: number; // horas por semana
  max_capacity: number; // horas por semana
  hourly_rate: number;
  projects: ProjectAllocation[];
  performance_metrics: PerformanceMetrics;
  training_needs: string[];
  career_goals: string[];
}

interface ProjectAllocation {
  project_id: string;
  project_name: string;
  role: string;
  allocation_percentage: number;
  start_date: string;
  end_date: string;
  hours_per_week: number;
  tasks: string[];
}

interface PerformanceMetrics {
  velocity: number;
  quality_score: number;
  on_time_delivery: number;
  customer_satisfaction: number;
  technical_debt_reduction: number;
  knowledge_sharing: number;
}

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'domain' | 'tool';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  demand: 'low' | 'medium' | 'high' | 'critical';
  team_members: string[];
}

interface ResourceCapacityPlanningProps {
  team_members: TeamMember[];
  skills: Skill[];
  projects: any[];
  onUpdateAllocation: (memberId: string, allocation: Partial<ProjectAllocation>) => void;
  onAddMember: (member: Partial<TeamMember>) => void;
  onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onRemoveMember: (memberId: string) => void;
}

const ResourceCapacityPlanning: React.FC<ResourceCapacityPlanningProps> = ({
  team_members,
  skills,
  projects,
  onUpdateAllocation,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'capacity' | 'skills' | 'performance' | 'planning'>('overview');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const calculateUtilization = (member: TeamMember) => {
    return (member.current_allocation / member.max_capacity) * 100;
  };

  const calculateTeamVelocity = () => {
    return team_members.reduce((sum, member) => sum + member.performance_metrics.velocity, 0);
  };

  const calculateAverageQuality = () => {
    const total = team_members.reduce((sum, member) => sum + member.performance_metrics.quality_score, 0);
    return total / team_members.length;
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600';
    if (utilization > 80) return 'text-orange-600';
    if (utilization > 60) return 'text-green-600';
    return 'text-gray-600';
  };

  const getSkillDemandColor = (demand: string) => {
    switch (demand) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Gestão de Recursos e Capacity Planning</CardTitle>
              <p className="text-muted-foreground">Planejamento híbrido de recursos para metodologias ágeis e PMP</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{team_members.length}</div>
              <div className="text-sm text-muted-foreground">Membros da Equipe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateTeamVelocity().toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Velocity Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateAverageQuality().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Qualidade Média</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {team_members.filter(m => calculateUtilization(m) > 100).length}
              </div>
              <div className="text-sm text-muted-foreground">Sobrecarregados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'capacity', label: 'Capacity Planning', icon: Calendar },
          { id: 'skills', label: 'Gestão de Skills', icon: Shield },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'planning', label: 'Planejamento', icon: Target },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeView === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Utilização da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team_members.map((member) => {
                  const utilization = calculateUtilization(member);
                  return (
                    <div key={member.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{member.name}</span>
                        <span className={getUtilizationColor(utilization)}>
                          {utilization.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={Math.min(utilization, 100)} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills em Demanda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skills
                  .filter(skill => skill.demand === 'critical' || skill.demand === 'high')
                  .map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{skill.name}</p>
                        <p className="text-xs text-muted-foreground">{skill.category}</p>
                      </div>
                      <Badge className={getSkillDemandColor(skill.demand)}>
                        {skill.demand}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Capacity Planning Tab */}
      {activeView === 'capacity' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Planning por Membro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team_members.map((member) => (
                  <div key={member.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {member.current_allocation}/{member.max_capacity}h
                        </div>
                        <div className={`text-sm ${getUtilizationColor(calculateUtilization(member))}`}>
                          {calculateUtilization(member).toFixed(1)}% utilizado
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Alocações Atuais:</h5>
                      {member.projects.map((allocation) => (
                        <div key={allocation.project_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{allocation.project_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {allocation.role} - {allocation.allocation_percentage}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{allocation.hours_per_week}h/semana</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(allocation.start_date).toLocaleDateString('pt-BR')} - 
                              {new Date(allocation.end_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skills Management Tab */}
      {activeView === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{skill.name}</h4>
                        <p className="text-xs text-muted-foreground">{skill.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{skill.level}</Badge>
                        <Badge className={getSkillDemandColor(skill.demand)}>
                          {skill.demand}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {skill.team_members.length} membros com esta skill
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gaps de Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skills
                  .filter(skill => skill.demand === 'critical' && skill.team_members.length < 2)
                  .map((skill) => (
                    <div key={skill.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <h4 className="font-medium text-sm text-red-800">{skill.name}</h4>
                      </div>
                      <p className="text-xs text-red-600">
                        Skill crítica com apenas {skill.team_members.length} membro(s)
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeView === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team_members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(member.performance_metrics.velocity)}`}>
                        {member.performance_metrics.velocity}
                      </div>
                      <div className="text-xs text-muted-foreground">Velocity</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(member.performance_metrics.quality_score)}`}>
                        {member.performance_metrics.quality_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">Qualidade</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Entrega no Prazo</span>
                      <span className={getPerformanceColor(member.performance_metrics.on_time_delivery)}>
                        {member.performance_metrics.on_time_delivery}%
                      </span>
                    </div>
                    <Progress value={member.performance_metrics.on_time_delivery} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Satisfação do Cliente</span>
                      <span className={getPerformanceColor(member.performance_metrics.customer_satisfaction)}>
                        {member.performance_metrics.customer_satisfaction}%
                      </span>
                    </div>
                    <Progress value={member.performance_metrics.customer_satisfaction} className="h-2" />
                  </div>

                  {member.training_needs.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Necessidades de Treinamento:</h5>
                      <div className="space-y-1">
                        {member.training_needs.map((need, index) => (
                          <div key={index} className="text-xs text-muted-foreground">• {need}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Planning Tab */}
      {activeView === 'planning' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planejamento de Recursos Futuros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Próximos 3 Meses</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Demanda de Recursos:</span>
                      <span className="font-medium">+25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skills Necessárias:</span>
                      <span className="font-medium">React, Python, DevOps</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orçamento Previsto:</span>
                      <span className="font-medium">R$ 150.000</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Recomendações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Contratar 2 desenvolvedores React</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Treinar equipe em DevOps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Revisar alocação de recursos</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Métricas de Sucesso</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Velocity Alvo:</span>
                      <span className="font-medium">30 SP/sprint</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Qualidade Alvo:</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilização Ideal:</span>
                      <span className="font-medium">80%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResourceCapacityPlanning; 