import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
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
  Zap, 
  GitBranch,
  BarChart3,
  Activity,
  Target,
  Award,
  Lock,
  Unlock,
  Search,
  Filter
} from "lucide-react";

interface QualityGate {
  id: string;
  name: string;
  phase: 'G1' | 'G2' | 'G3' | 'G4';
  category: 'technical' | 'business' | 'security' | 'compliance' | 'performance';
  criteria: QualityCriterion[];
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional';
  approver: string;
  due_date: string;
  completed_date?: string;
  score: number;
  max_score: number;
  automated_checks: AutomatedCheck[];
  manual_reviews: ManualReview[];
  compliance_requirements: ComplianceRequirement[];
}

interface QualityCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  status: 'pending' | 'passed' | 'failed' | 'not_applicable';
  evidence: string;
  reviewer: string;
  reviewed_date?: string;
  comments: string;
}

interface AutomatedCheck {
  id: string;
  name: string;
  type: 'code_quality' | 'security_scan' | 'performance_test' | 'unit_test' | 'integration_test';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  result: string;
  execution_time: number;
  last_run: string;
  threshold: number;
  actual_value: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface ManualReview {
  id: string;
  reviewer: string;
  review_type: 'code_review' | 'design_review' | 'security_review' | 'business_review';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'needs_changes';
  comments: string;
  reviewed_date?: string;
  findings: Finding[];
}

interface Finding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'security' | 'performance' | 'usability' | 'accessibility';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string;
  due_date: string;
  resolved_date?: string;
}

interface ComplianceRequirement {
  id: string;
  framework: 'ISO27001' | 'SOX' | 'GDPR' | 'PCI-DSS' | 'ITIL' | 'COBIT';
  requirement: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed';
  evidence: string;
  last_assessment: string;
  next_assessment: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

interface QualityComplianceSystemProps {
  qualityGates: QualityGate[];
  onCreateQualityGate: (gate: Partial<QualityGate>) => void;
  onUpdateQualityGate: (gateId: string, updates: Partial<QualityGate>) => void;
  onApproveQualityGate: (gateId: string, approval: Partial<QualityGate>) => void;
  onRejectQualityGate: (gateId: string, reason: string) => void;
  onRunAutomatedChecks: (gateId: string) => void;
  onAddManualReview: (gateId: string, review: Partial<ManualReview>) => void;
}

const QualityComplianceSystem: React.FC<QualityComplianceSystemProps> = ({
  qualityGates,
  onCreateQualityGate,
  onUpdateQualityGate,
  onApproveQualityGate,
  onRejectQualityGate,
  onRunAutomatedChecks,
  onAddManualReview,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gates' | 'compliance' | 'metrics' | 'reports'>('overview');
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'conditional': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'partially_compliant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOverallScore = () => {
    const totalGates = qualityGates.length;
    const passedGates = qualityGates.filter(gate => gate.status === 'passed').length;
    return totalGates > 0 ? (passedGates / totalGates) * 100 : 0;
  };

  const calculateComplianceScore = () => {
    const allRequirements = qualityGates.flatMap(gate => gate.compliance_requirements);
    const compliantRequirements = allRequirements.filter(req => req.status === 'compliant').length;
    return allRequirements.length > 0 ? (compliantRequirements / allRequirements.length) * 100 : 0;
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'G1': return <Target className="h-4 w-4" />;
      case 'G2': return <Code className="h-4 w-4" />;
      case 'G3': return <Database className="h-4 w-4" />;
      case 'G4': return <Shield className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Sistema de Qualidade e Compliance</CardTitle>
              <p className="text-muted-foreground">Gestão integrada de qualidade e conformidade regulatória</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Relatório de Compliance
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Quality Gate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateOverallScore().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Score Geral de Qualidade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateComplianceScore().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Compliance Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {qualityGates.filter(gate => gate.status === 'passed').length}
              </div>
              <div className="text-sm text-muted-foreground">Gates Aprovados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {qualityGates.filter(gate => gate.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">Gates Reprovados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'gates', label: 'Quality Gates', icon: Shield },
          { id: 'compliance', label: 'Compliance', icon: Lock },
          { id: 'metrics', label: 'Métricas', icon: TrendingUp },
          { id: 'reports', label: 'Relatórios', icon: FileText },
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
              <CardTitle>Status dos Quality Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['G1', 'G2', 'G3', 'G4'].map((phase) => {
                  const phaseGates = qualityGates.filter(gate => gate.phase === phase);
                  const passedGates = phaseGates.filter(gate => gate.status === 'passed').length;
                  const progress = phaseGates.length > 0 ? (passedGates / phaseGates.length) * 100 : 0;
                  
                  return (
                    <div key={phase} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getPhaseIcon(phase)}
                        <span className="font-medium">Gate {phase}</span>
                        <Badge variant="outline">{phaseGates.length} gates</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance por Framework</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['ISO27001', 'SOX', 'GDPR', 'PCI-DSS', 'ITIL', 'COBIT'].map((framework) => {
                  const allRequirements = qualityGates.flatMap(gate => 
                    gate.compliance_requirements.filter(req => req.framework === framework)
                  );
                  const compliantRequirements = allRequirements.filter(req => req.status === 'compliant').length;
                  const progress = allRequirements.length > 0 ? (compliantRequirements / allRequirements.length) * 100 : 0;
                  
                  return (
                    <div key={framework} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{framework}</span>
                        <Badge className={getComplianceColor(progress >= 80 ? 'compliant' : progress >= 60 ? 'partially_compliant' : 'non_compliant')}>
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quality Gates Tab */}
      {activeTab === 'gates' && (
        <div className="space-y-4">
          {qualityGates.map((gate) => (
            <Card key={gate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getPhaseIcon(gate.phase)}
                      <h4 className="font-medium">{gate.name}</h4>
                      <Badge className={getStatusColor(gate.status)}>
                        {gate.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">{gate.category}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Aprovador:</span>
                        <p className="font-medium">{gate.approver}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prazo:</span>
                        <p className="font-medium">{formatDate(gate.due_date)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Score:</span>
                        <p className="font-medium">{gate.score}/{gate.max_score}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Critérios:</span>
                        <p className="font-medium">{gate.criteria.length}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso</span>
                        <span>{((gate.score / gate.max_score) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(gate.score / gate.max_score) * 100} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Checks Automatizados</h5>
                        <div className="space-y-1">
                          {gate.automated_checks.map((check) => (
                            <div key={check.id} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                              <span>{check.name}</span>
                              <Badge className={getStatusColor(check.status)}>
                                {check.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">Reviews Manuais</h5>
                        <div className="space-y-1">
                          {gate.manual_reviews.map((review) => (
                            <div key={review.id} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                              <span>{review.reviewer}</span>
                              <Badge className={getStatusColor(review.status)}>
                                {review.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedGate(gate.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {gate.status === 'in_progress' && (
                      <>
                        <Button size="sm" onClick={() => onRunAutomatedChecks(gate.id)}>
                          <Zap className="h-4 w-4 mr-1" />
                          Executar Checks
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onApproveQualityGate(gate.id, {})}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
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

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {['ISO27001', 'SOX', 'GDPR', 'PCI-DSS', 'ITIL', 'COBIT'].map((framework) => {
            const allRequirements = qualityGates.flatMap(gate => 
              gate.compliance_requirements.filter(req => req.framework === framework)
            );
            
            return (
              <Card key={framework}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{framework}</CardTitle>
                    <Badge className={getComplianceColor(
                      allRequirements.filter(req => req.status === 'compliant').length / allRequirements.length >= 0.8 ? 'compliant' :
                      allRequirements.filter(req => req.status === 'compliant').length / allRequirements.length >= 0.6 ? 'partially_compliant' : 'non_compliant'
                    )}>
                      {allRequirements.length > 0 ? 
                        `${((allRequirements.filter(req => req.status === 'compliant').length / allRequirements.length) * 100).toFixed(0)}% Compliant` : 
                        'Não Avaliado'
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allRequirements.map((requirement) => (
                      <div key={requirement.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{requirement.requirement}</h4>
                            <p className="text-xs text-muted-foreground">{requirement.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getComplianceColor(requirement.status)}>
                              {requirement.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getSeverityColor(requirement.risk_level)}>
                              {requirement.risk_level}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span>Última Avaliação:</span>
                            <p>{formatDate(requirement.last_assessment)}</p>
                          </div>
                          <div>
                            <span>Próxima Avaliação:</span>
                            <p>{formatDate(requirement.next_assessment)}</p>
                          </div>
                          <div>
                            <span>Evidência:</span>
                            <p className="truncate">{requirement.evidence}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Qualidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Code Coverage</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Security Score</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance Score</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accessibility Score</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trends de Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Trends de Compliance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Relatório de Compliance</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span>Métricas de Qualidade</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Auditoria de Segurança</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Performance Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QualityComplianceSystem; 