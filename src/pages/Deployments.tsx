import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings, Activity, CheckCircle, AlertCircle } from "lucide-react";

const Deployments = () => {
  const deployments = [
    {
      id: "deploy-001",
      project: "Automação de Notas Fiscais",
      version: "v1.2.0",
      environment: "production",
      status: "success",
      deployedBy: "João Silva",
      deployedAt: "2024-01-15 14:30",
      duration: "5m 23s",
      healthChecks: {
        total: 8,
        passed: 8,
        failed: 0
      }
    },
    {
      id: "deploy-002",
      project: "Conciliação Bancária",
      version: "v2.1.0",
      environment: "staging",
      status: "in_progress",
      deployedBy: "Maria Santos",
      deployedAt: "2024-01-15 16:45",
      duration: "2m 15s",
      healthChecks: {
        total: 6,
        passed: 4,
        failed: 2
      }
    },
    {
      id: "deploy-003",
      project: "Relatório de Vendas",
      version: "v1.0.5",
      environment: "production",
      status: "failed",
      deployedBy: "Carlos Lima",
      deployedAt: "2024-01-14 10:20",
      duration: "1m 45s",
      healthChecks: {
        total: 5,
        passed: 2,
        failed: 3
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress": return <Activity className="h-5 w-5 text-blue-500" />;
      case "failed": return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case "production": return "bg-red-100 text-red-800";
      case "staging": return "bg-yellow-100 text-yellow-800";
      case "testing": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Deployments
          </h1>
          <p className="text-muted-foreground">
            Pipeline de deploy e monitoramento de automações RPA
          </p>
        </div>

        {/* Métricas de Deploy */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deployments Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">12</div>
              <p className="text-sm text-muted-foreground">+3 vs ontem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">92%</div>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">3.2m</div>
              <p className="text-sm text-muted-foreground">Por deployment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Em Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">24</div>
              <p className="text-sm text-muted-foreground">Automações ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Deployments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Deployments Recentes</h2>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Novo Deploy
            </Button>
          </div>

          {deployments.map((deployment) => (
            <Card key={deployment.id} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <CardTitle className="text-lg">{deployment.project}</CardTitle>
                      <CardDescription>
                        Versão {deployment.version} • {deployment.deployedBy} • {deployment.deployedAt}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getEnvironmentColor(deployment.environment)}>
                      {deployment.environment}
                    </Badge>
                    <Badge className={getStatusColor(deployment.status)}>
                      {deployment.status === "success" && "Sucesso"}
                      {deployment.status === "in_progress" && "Em Progresso"}
                      {deployment.status === "failed" && "Falhou"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Health Checks */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Health Checks</span>
                    <span>{deployment.healthChecks.passed}/{deployment.healthChecks.total} passaram</span>
                  </div>
                  <Progress 
                    value={(deployment.healthChecks.passed / deployment.healthChecks.total) * 100} 
                    className="h-2" 
                  />
                </div>

                {/* Informações do Deploy */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="ml-2 font-medium">{deployment.duration}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deploy ID:</span>
                    <span className="ml-2 font-mono text-xs">{deployment.id}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                  {deployment.status === "failed" && (
                    <Button size="sm" variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Ver Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Status atual dos ambientes de deploy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Production</span>
                </div>
                <p className="text-sm text-muted-foreground">24 automações ativas</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Staging</span>
                </div>
                <p className="text-sm text-muted-foreground">3 automações em teste</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Development</span>
                </div>
                <p className="text-sm text-muted-foreground">8 automações em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deployments; 