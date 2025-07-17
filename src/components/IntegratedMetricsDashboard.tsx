import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GitBranch, 
  GitHub, 
  Docker, 
  Zap, 
  Code, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Eye,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Container,
  Workflow,
  TestTube,
  Shield,
  Users,
  Calendar,
  Target
} from "lucide-react";
import IntegrationService, { 
  GitMetrics, 
  GitHubMetrics, 
  DockerMetrics, 
  N8nMetrics, 
  PythonMetrics, 
  TimeTrackingData 
} from "../services/IntegrationService";

interface IntegratedMetricsDashboardProps {
  projectId: string;
  integrationConfig: {
    github: {
      token: string;
      repository: string;
      owner: string;
    };
    docker: {
      host: string;
      port: number;
      api_version: string;
    };
    n8n: {
      base_url: string;
      api_key: string;
    };
    python: {
      project_path: string;
      requirements_file: string;
    };
    git: {
      repository_path: string;
    };
  };
}

const IntegratedMetricsDashboard: React.FC<IntegratedMetricsDashboardProps> = ({
  projectId,
  integrationConfig,
}) => {
  const [metrics, setMetrics] = useState<{
    git: GitMetrics;
    github: GitHubMetrics;
    docker: DockerMetrics;
    n8n: N8nMetrics;
    python: PythonMetrics;
    timeTracking: TimeTrackingData[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'git' | 'github' | 'docker' | 'n8n' | 'python' | 'time'>('overview');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const integrationService = new IntegrationService(integrationConfig);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await integrationService.getCombinedMetrics();
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Setup real-time monitoring
    const interval = setInterval(fetchMetrics, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'running':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'failure':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando métricas integradas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar métricas</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchMetrics}>Tentar Novamente</Button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Dashboard de Métricas Integradas</CardTitle>
              <p className="text-muted-foreground">
                Dados em tempo real de Git, GitHub, Docker, n8n e Python
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <p className="text-sm text-muted-foreground">
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              )}
              <Button onClick={fetchMetrics} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <GitCommit className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{metrics.git.total_commits}</div>
              <div className="text-sm text-muted-foreground">Commits</div>
            </div>
            <div className="text-center">
              <GitPullRequest className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">
                {metrics.github.pull_requests.filter(pr => pr.state === 'open').length}
              </div>
              <div className="text-sm text-muted-foreground">PRs Abertas</div>
            </div>
            <div className="text-center">
              <Container className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">
                {metrics.docker.containers.filter(c => c.status === 'running').length}
              </div>
              <div className="text-sm text-muted-foreground">Containers Ativos</div>
            </div>
            <div className="text-center">
              <Workflow className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">
                {metrics.n8n.workflows.filter(w => w.active).length}
              </div>
              <div className="text-sm text-muted-foreground">Workflows Ativos</div>
            </div>
            <div className="text-center">
              <TestTube className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{metrics.python.test_coverage.total_coverage}%</div>
              <div className="text-sm text-muted-foreground">Cobertura de Testes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'git', label: 'Git', icon: GitBranch },
          { id: 'github', label: 'GitHub', icon: GitHub },
          { id: 'docker', label: 'Docker', icon: Docker },
          { id: 'n8n', label: 'n8n', icon: Zap },
          { id: 'python', label: 'Python', icon: Code },
          { id: 'time', label: 'Tempo', icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === id
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Commits (7 dias)</span>
                  <span className="font-medium">{metrics.git.total_commits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pull Requests</span>
                  <span className="font-medium">{metrics.github.pull_requests.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Issues Abertas</span>
                  <span className="font-medium">
                    {metrics.github.issues.filter(i => i.state === 'open').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Execuções n8n</span>
                  <span className="font-medium">{metrics.n8n.performance_metrics.total_executions}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Taxa de Sucesso n8n</span>
                    <span>{metrics.n8n.performance_metrics.success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.n8n.performance_metrics.success_rate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cobertura de Testes</span>
                    <span>{metrics.python.test_coverage.total_coverage}%</span>
                  </div>
                  <Progress value={metrics.python.test_coverage.total_coverage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Containers Ativos</span>
                    <span>{metrics.docker.containers.filter(c => c.status === 'running').length}</span>
                  </div>
                  <Progress 
                    value={(metrics.docker.containers.filter(c => c.status === 'running').length / metrics.docker.containers.length) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Git Tab */}
      {activeTab === 'git' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Git</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{metrics.git.total_commits}</div>
                    <div className="text-sm text-muted-foreground">Total Commits</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{metrics.git.lines_added}</div>
                    <div className="text-sm text-muted-foreground">Linhas Adicionadas</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{metrics.git.lines_deleted}</div>
                    <div className="text-sm text-muted-foreground">Linhas Removidas</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{metrics.git.files_changed}</div>
                    <div className="text-sm text-muted-foreground">Arquivos Alterados</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.git.branches.map((branch) => (
                  <div key={branch.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{branch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Último commit: {new Date(branch.last_commit).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={branch.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {branch.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {branch.commits_ahead} ahead, {branch.commits_behind} behind
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GitHub Tab */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Repository Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Stars</span>
                    <span className="font-medium">{metrics.github.repository_stats.stars}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Forks</span>
                    <span className="font-medium">{metrics.github.repository_stats.forks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Issues Abertas</span>
                    <span className="font-medium">{metrics.github.repository_stats.open_issues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Linguagem</span>
                    <span className="font-medium">{metrics.github.repository_stats.language}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pull Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.github.pull_requests.slice(0, 5).map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">#{pr.id} {pr.title}</p>
                        <p className="text-xs text-muted-foreground">por {pr.author}</p>
                      </div>
                      <Badge className={getStatusColor(pr.state)}>
                        {pr.state}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.github.issues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">#{issue.id} {issue.title}</p>
                        <p className="text-xs text-muted-foreground">por {issue.author}</p>
                      </div>
                      <Badge className={getStatusColor(issue.state)}>
                        {issue.state}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Docker Tab */}
      {activeTab === 'docker' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Containers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.docker.containers.map((container) => (
                    <div key={container.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{container.name}</h4>
                          <p className="text-xs text-muted-foreground">{container.image}</p>
                        </div>
                        <Badge className={getStatusColor(container.status)}>
                          {container.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span>CPU:</span>
                          <span className="ml-1">{container.cpu_usage}%</span>
                        </div>
                        <div>
                          <span>Memória:</span>
                          <span className="ml-1">{container.memory_usage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.docker.images.map((image) => (
                    <div key={image.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{image.name}</h4>
                          <p className="text-xs text-muted-foreground">Tag: {image.tag}</p>
                        </div>
                        <span className="text-sm font-medium">{formatBytes(image.size)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criada: {new Date(image.created).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* n8n Tab */}
      {activeTab === 'n8n' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.n8n.workflows.map((workflow) => (
                    <div key={workflow.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{workflow.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {workflow.nodes_count} nós, {workflow.executions_count} execuções
                          </p>
                        </div>
                        <Badge className={workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {workflow.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span>Taxa de Sucesso:</span>
                          <span className="ml-1">{workflow.success_rate}%</span>
                        </div>
                        <div>
                          <span>Tempo Médio:</span>
                          <span className="ml-1">{formatDuration(workflow.avg_execution_time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execuções Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.n8n.executions.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{execution.workflow_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.started_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Duração: {formatDuration(execution.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Python Tab */}
      {activeTab === 'python' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Qualidade do Código</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cobertura de Testes</span>
                    <span>{metrics.python.test_coverage.total_coverage}%</span>
                  </div>
                  <Progress value={metrics.python.test_coverage.total_coverage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Score Pylint</span>
                    <span>{metrics.python.code_quality.pylint_score}/10</span>
                  </div>
                  <Progress value={metrics.python.code_quality.pylint_score * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Issues Flake8</span>
                    <span>{metrics.python.code_quality.flake8_issues}</span>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - metrics.python.code_quality.flake8_issues * 5)} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.python.dependencies.slice(0, 5).map((dep) => (
                  <div key={dep.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{dep.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dep.version} → {dep.latest_version}
                      </p>
                    </div>
                    <Badge className={dep.is_outdated ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                      {dep.is_outdated ? 'Desatualizada' : 'Atualizada'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Tracking Tab */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apontamento de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.timeTracking.length > 0 ? (
                <div className="space-y-3">
                  {metrics.timeTracking.map((entry) => (
                    <div key={`${entry.user_id}-${entry.start_time}`} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{entry.description}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.start_time).toLocaleDateString('pt-BR')} - 
                            {new Date(entry.end_time).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="font-medium">{formatDuration(entry.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{entry.category}</Badge>
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum dado de apontamento encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IntegratedMetricsDashboard; 