
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch,
  Download,
  Upload,
  Settings,
  History
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface Pipeline {
  id: string;
  name: string;
  status: "running" | "succeeded" | "failed" | "queued";
  duration: string;
  branch: string;
  lastRun: string;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: string;
  name: string;
  status: "running" | "succeeded" | "failed" | "pending";
  duration?: string;
}

interface PipelineManagementProps {
  project: Project;
}

const PipelineManagement = ({ project }: PipelineManagementProps) => {
  const [pipelines] = useState<Pipeline[]>([
    {
      id: "ci-1",
      name: "CI - Build and Test",
      status: "succeeded",
      duration: "3m 45s",
      branch: "main",
      lastRun: "2024-01-17T10:30:00Z",
      stages: [
        { id: "build", name: "Build", status: "succeeded", duration: "1m 20s" },
        { id: "test", name: "Test", status: "succeeded", duration: "2m 15s" },
        { id: "quality", name: "Quality Gates", status: "succeeded", duration: "10s" }
      ]
    },
    {
      id: "cd-1", 
      name: "CD - Deploy to Production",
      status: "running",
      duration: "5m 12s",
      branch: "release/v1.2.0",
      lastRun: "2024-01-17T11:00:00Z",
      stages: [
        { id: "build", name: "Build", status: "succeeded", duration: "1m 30s" },
        { id: "staging", name: "Deploy Staging", status: "succeeded", duration: "2m 00s" },
        { id: "tests", name: "Integration Tests", status: "running" },
        { id: "production", name: "Deploy Production", status: "pending" }
      ]
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "running": return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case "queued": 
      case "pending": return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "queued":
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipelines - {project.name}</h2>
          <p className="text-muted-foreground">CI/CD e automação de deploys</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Executar Pipeline
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pipelines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="space-y-4">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(pipeline.status)}
                    <div>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {pipeline.branch}
                        </div>
                        <div className="flex items-center gap-1">
                          <History className="h-3 w-3" />
                          {formatDate(pipeline.lastRun)}
                        </div>
                        <span>Duração: {pipeline.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(pipeline.status)}>
                      {pipeline.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Pipeline Stages */}
                <div className="space-y-3">
                  <h4 className="font-medium">Stages</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {pipeline.stages.map((stage, index) => (
                      <div key={stage.id} className="relative">
                        <Card className={`transition-colors ${
                          stage.status === "running" ? "border-blue-500 bg-blue-50" :
                          stage.status === "succeeded" ? "border-green-500 bg-green-50" :
                          stage.status === "failed" ? "border-red-500 bg-red-50" :
                          "border-gray-200"
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(stage.status)}
                              <span className="font-medium text-sm">{stage.name}</span>
                            </div>
                            {stage.duration && (
                              <p className="text-xs text-muted-foreground">
                                {stage.duration}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Arrow between stages */}
                        {index < pipeline.stages.length - 1 && (
                          <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                            <div className="w-4 h-0.5 bg-gray-300"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="releases">
          <Card>
            <CardHeader>
              <CardTitle>Release Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Release v1.2.0</h4>
                    <p className="text-sm text-muted-foreground">Produção • Deploy em 17/01/2024</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Stable</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Release v1.3.0-beta</h4>
                    <p className="text-sm text-muted-foreground">Staging • Deploy em progresso</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Beta</Badge>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Promover
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>v1.3.0-dev</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Deploy:</span>
                    <span>2h ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Staging
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-blue-100 text-blue-800">Deploying</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>v1.2.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Deploy:</span>
                    <span>10m ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Production
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-green-100 text-green-800">Stable</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span>v1.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Deploy:</span>
                    <span>2 days ago</span>
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

export default PipelineManagement;
