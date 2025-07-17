
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitCommit, 
  Users, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface DevOpsMetrics {
  deploymentFrequency: number;
  leadTime: number;
  mttr: number; // Mean Time To Recovery
  changeFailureRate: number;
  activeWorkItems: number;
  completedWorkItems: number;
  codeCommits: number;
  testCoverage: number;
}

interface DevOpsOverviewProps {
  project: Project;
}

const DevOpsOverview = ({ project }: DevOpsOverviewProps) => {
  const [metrics] = useState<DevOpsMetrics>({
    deploymentFrequency: 12,
    leadTime: 2.5,
    mttr: 1.2,
    changeFailureRate: 5,
    activeWorkItems: 8,
    completedWorkItems: 24,
    codeCommits: 156,
    testCoverage: 85
  });

  const getDORAClassification = () => {
    // DORA metrics classification
    if (metrics.deploymentFrequency >= 10 && metrics.leadTime <= 1 && 
        metrics.mttr <= 1 && metrics.changeFailureRate <= 5) {
      return { level: "Elite", color: "bg-green-100 text-green-800" };
    } else if (metrics.deploymentFrequency >= 5 && metrics.leadTime <= 7 && 
               metrics.mttr <= 24 && metrics.changeFailureRate <= 10) {
      return { level: "High", color: "bg-blue-100 text-blue-800" };
    } else if (metrics.deploymentFrequency >= 1 && metrics.leadTime <= 30 && 
               metrics.mttr <= 168 && metrics.changeFailureRate <= 15) {
      return { level: "Medium", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { level: "Low", color: "bg-red-100 text-red-800" };
    }
  };

  const doraLevel = getDORAClassification();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DevOps Overview - {project.name}</h2>
          <p className="text-muted-foreground">Métricas DORA e indicadores de performance</p>
        </div>
        <Badge className={doraLevel.color}>
          Performance: {doraLevel.level}
        </Badge>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">DORA Metrics</TabsTrigger>
          <TabsTrigger value="workitems">Work Items</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Deployment Frequency */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Deployment Frequency</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{metrics.deploymentFrequency}</p>
                  <p className="text-xs text-muted-foreground">deploys por mês</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Time */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm">Lead Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{metrics.leadTime}d</p>
                  <p className="text-xs text-muted-foreground">commit to deploy</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Elite</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MTTR */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-sm">MTTR</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{metrics.mttr}h</p>
                  <p className="text-xs text-muted-foreground">tempo de recuperação</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Elite</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Failure Rate */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm">Change Failure Rate</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{metrics.changeFailureRate}%</p>
                  <p className="text-xs text-muted-foreground">falhas em produção</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Elite</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workitems">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Work Items Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Work Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ativos</span>
                    <Badge variant="outline">{metrics.activeWorkItems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Concluídos</span>
                    <Badge className="bg-green-100 text-green-800">{metrics.completedWorkItems}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do Sprint</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Development Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-blue-600" />
                  Atividade de Desenvolvimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commits (30d)</span>
                    <Badge variant="outline">{metrics.codeCommits}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pull Requests</span>
                    <Badge variant="outline">23</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Code Reviews</span>
                    <Badge variant="outline">18</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Collaboration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Colaboração da Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Desenvolvedores Ativos</span>
                    <Badge variant="outline">5</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Daily Standups</span>
                    <Badge className="bg-green-100 text-green-800">100%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sprint Reviews</span>
                    <Badge className="bg-green-100 text-green-800">On Track</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Code Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Code Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Test Coverage</span>
                      <span className="font-medium">{metrics.testCoverage}%</span>
                    </div>
                    <Progress value={metrics.testCoverage} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Code Maintainability</span>
                      <span className="font-medium">A</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Security Rating</span>
                      <span className="font-medium">A</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Unit Tests</span>
                    <Badge className="bg-green-100 text-green-800">245 Passed</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Integration Tests</span>
                    <Badge className="bg-green-100 text-green-800">32 Passed</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">E2E Tests</span>
                    <Badge className="bg-green-100 text-green-800">12 Passed</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Performance Tests</span>
                    <Badge className="bg-yellow-100 text-yellow-800">3 Warning</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevOpsOverview;
