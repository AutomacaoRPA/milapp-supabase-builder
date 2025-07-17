import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitMerge,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Code,
  Database,
  Settings,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  History,
  TrendingUp,
  Shield,
  Zap,
  BarChart3
} from "lucide-react";

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bugfix' | 'hotfix' | 'refactor' | 'documentation' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'implemented' | 'rolled_back';
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  risk_assessment: string;
  rollback_plan: string;
  requested_by: string;
  requested_date: string;
  approved_by?: string;
  approved_date?: string;
  implemented_by?: string;
  implemented_date?: string;
  branch_name: string;
  commit_hash?: string;
  pull_request_url?: string;
  reviewers: Reviewer[];
  approvals: Approval[];
  testing_results: TestingResult[];
  deployment_info: DeploymentInfo;
}

interface Reviewer {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'requested_changes';
  comments: string;
  reviewed_date?: string;
}

interface Approval {
  id: string;
  approver_id: string;
  approver_name: string;
  approver_role: string;
  decision: 'approved' | 'rejected' | 'conditional';
  comments: string;
  approved_date: string;
  conditions?: string[];
}

interface TestingResult {
  id: string;
  test_type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'uat';
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  executed_by: string;
  executed_date: string;
  results_summary: string;
  test_coverage: number;
  defects_found: number;
}

interface DeploymentInfo {
  environment: 'dev' | 'test' | 'staging' | 'production';
  deployment_date?: string;
  deployed_by?: string;
  deployment_method: 'manual' | 'automated' | 'blue_green' | 'canary';
  health_checks: HealthCheck[];
  rollback_triggered: boolean;
  rollback_reason?: string;
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  response_time: number;
  last_check: string;
  details: string;
}

interface ChangeManagementSystemProps {
  changeRequests: ChangeRequest[];
  onCreateChangeRequest: (request: Partial<ChangeRequest>) => void;
  onUpdateChangeRequest: (requestId: string, updates: Partial<ChangeRequest>) => void;
  onApproveChangeRequest: (requestId: string, approval: Partial<Approval>) => void;
  onRejectChangeRequest: (requestId: string, reason: string) => void;
  onImplementChangeRequest: (requestId: string, implementation: Partial<ChangeRequest>) => void;
  onRollbackChangeRequest: (requestId: string, reason: string) => void;
}

const ChangeManagementSystem: React.FC<ChangeManagementSystemProps> = ({
  changeRequests,
  onCreateChangeRequest,
  onUpdateChangeRequest,
  onApproveChangeRequest,
  onRejectChangeRequest,
  onImplementChangeRequest,
  onRollbackChangeRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'approvals' | 'deployments' | 'analytics'>('overview');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'rolled_back': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const calculateApprovalProgress = (request: ChangeRequest) => {
    const totalReviewers = request.reviewers.length;
    const approvedReviewers = request.reviewers.filter(r => r.status === 'approved').length;
    return (approvedReviewers / totalReviewers) * 100;
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Plus className="h-4 w-4" />;
      case 'bugfix': return <AlertTriangle className="h-4 w-4" />;
      case 'hotfix': return <Zap className="h-4 w-4" />;
      case 'refactor': return <Code className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'infrastructure': return <Database className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Sistema de Gestão de Mudanças</CardTitle>
              <p className="text-muted-foreground">Controle de versão integrado com aprovações e deploy</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Relatório de Mudanças
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{changeRequests.length}</div>
              <div className="text-sm text-muted-foreground">Total de Mudanças</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {changeRequests.filter(cr => cr.status === 'reviewing').length}
              </div>
              <div className="text-sm text-muted-foreground">Em Revisão</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {changeRequests.filter(cr => cr.status === 'implemented').length}
              </div>
              <div className="text-sm text-muted-foreground">Implementadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {changeRequests.filter(cr => cr.status === 'rejected').length}
              </div>
              <div className="text-sm text-muted-foreground">Rejeitadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {changeRequests.filter(cr => cr.status === 'rolled_back').length}
              </div>
              <div className="text-sm text-muted-foreground">Rollbacks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'requests', label: 'Solicitações', icon: GitPullRequest },
          { id: 'approvals', label: 'Aprovações', icon: Shield },
          { id: 'deployments', label: 'Deployments', icon: GitMerge },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
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
              <CardTitle>Pipeline de Mudanças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Draft</span>
                  <Badge variant="outline">{changeRequests.filter(cr => cr.status === 'draft').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Submitted</span>
                  <Badge variant="outline">{changeRequests.filter(cr => cr.status === 'submitted').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reviewing</span>
                  <Badge variant="outline">{changeRequests.filter(cr => cr.status === 'reviewing').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approved</span>
                  <Badge variant="outline">{changeRequests.filter(cr => cr.status === 'approved').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Implemented</span>
                  <Badge variant="outline">{changeRequests.filter(cr => cr.status === 'implemented').length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tempo Médio de Aprovação</span>
                    <span>2.3 dias</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Taxa de Aprovação</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Taxa de Rollback</span>
                    <span>3%</span>
                  </div>
                  <Progress value={3} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {changeRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getChangeTypeIcon(request.type)}
                      <h4 className="font-medium">{request.title}</h4>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      <Badge className={getImpactColor(request.impact_level)}>
                        Impacto: {request.impact_level}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{request.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Solicitante:</span>
                        <p className="font-medium">{request.requested_by}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data:</span>
                        <p className="font-medium">{formatDate(request.requested_date)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Branch:</span>
                        <p className="font-medium font-mono">{request.branch_name}</p>
                      </div>
                      {request.commit_hash && (
                        <div>
                          <span className="text-muted-foreground">Commit:</span>
                          <p className="font-medium font-mono text-xs">{request.commit_hash.substring(0, 8)}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso de Aprovação</span>
                        <span>{calculateApprovalProgress(request).toFixed(0)}%</span>
                      </div>
                      <Progress value={calculateApprovalProgress(request)} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.status === 'reviewing' && (
                      <>
                        <Button size="sm" onClick={() => onApproveChangeRequest(request.id, {})}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onRejectChangeRequest(request.id, '')}>
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {changeRequests
            .filter(cr => cr.status === 'reviewing' || cr.status === 'approved')
            .map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Revisores</h5>
                      <div className="space-y-2">
                        {request.reviewers.map((reviewer) => (
                          <div key={reviewer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{reviewer.name}</p>
                              <p className="text-xs text-muted-foreground">{reviewer.role}</p>
                            </div>
                            <Badge className={getStatusColor(reviewer.status)}>
                              {reviewer.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {request.approvals.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Aprovações</h5>
                        <div className="space-y-2">
                          {request.approvals.map((approval) => (
                            <div key={approval.id} className="p-2 border rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{approval.approver_name}</span>
                                <Badge className={getStatusColor(approval.decision)}>
                                  {approval.decision}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{approval.comments}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(approval.approved_date)}
                              </p>
                            </div>
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

      {/* Deployments Tab */}
      {activeTab === 'deployments' && (
        <div className="space-y-4">
          {changeRequests
            .filter(cr => cr.status === 'implemented' || cr.status === 'rolled_back')
            .map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ambiente</p>
                        <p className="font-medium">{request.deployment_info.environment}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Método</p>
                        <p className="font-medium">{request.deployment_info.deployment_method}</p>
                      </div>
                      {request.deployment_info.deployment_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Data do Deploy</p>
                          <p className="font-medium">{formatDate(request.deployment_info.deployment_date)}</p>
                        </div>
                      )}
                      {request.deployment_info.deployed_by && (
                        <div>
                          <p className="text-sm text-muted-foreground">Deployado por</p>
                          <p className="font-medium">{request.deployment_info.deployed_by}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Health Checks</h5>
                      <div className="space-y-2">
                        {request.deployment_info.health_checks.map((check, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{check.name}</p>
                              <p className="text-xs text-muted-foreground">{check.details}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(check.status)}>
                                {check.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{check.response_time}ms</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {request.deployment_info.rollback_triggered && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <h5 className="font-medium text-red-800">Rollback Executado</h5>
                        </div>
                        <p className="text-sm text-red-700">{request.deployment_info.rollback_reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Mudanças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mudanças por Tipo</span>
                  </div>
                  <div className="space-y-2">
                    {['feature', 'bugfix', 'hotfix', 'refactor', 'documentation', 'infrastructure'].map((type) => {
                      const count = changeRequests.filter(cr => cr.type === type).length;
                      const percentage = (count / changeRequests.length) * 100;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance de Deploy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Taxa de Sucesso</span>
                    <span>97%</span>
                  </div>
                  <Progress value={97} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tempo Médio de Deploy</span>
                    <span>15 min</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Deployments Automatizados</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChangeManagementSystem; 