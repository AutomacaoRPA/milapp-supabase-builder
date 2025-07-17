import { useState, useEffect, useCallback } from 'react';
import IntegrationService, { 
  GitMetrics, 
  GitHubMetrics, 
  DockerMetrics, 
  N8nMetrics, 
  PythonMetrics, 
  TimeTrackingData,
  IntegrationConfig 
} from '../services/IntegrationService';

interface UseIntegrationMetricsReturn {
  // Estado
  metrics: {
    git: GitMetrics;
    github: GitHubMetrics;
    docker: DockerMetrics;
    n8n: N8nMetrics;
    python: PythonMetrics;
    timeTracking: TimeTrackingData[];
  } | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Métodos
  fetchMetrics: () => Promise<void>;
  startRealTimeMonitoring: (callback: (metrics: any) => void) => void;
  stopRealTimeMonitoring: () => void;
  
  // Métodos específicos por ferramenta
  fetchGitMetrics: () => Promise<GitMetrics>;
  fetchGitHubMetrics: () => Promise<GitHubMetrics>;
  fetchDockerMetrics: () => Promise<DockerMetrics>;
  fetchN8nMetrics: () => Promise<N8nMetrics>;
  fetchPythonMetrics: () => Promise<PythonMetrics>;
  fetchTimeTrackingData: (startDate: string, endDate: string) => Promise<TimeTrackingData[]>;
  
  // Métodos de análise
  getDeveloperActivity: () => DeveloperActivity[];
  getProjectVelocity: () => ProjectVelocity;
  getResourceUtilization: () => ResourceUtilization;
  getQualityMetrics: () => QualityMetrics;
  getDeploymentMetrics: () => DeploymentMetrics;
  
  // Métodos de relatórios
  generateIntegrationReport: (startDate: string, endDate: string) => Promise<IntegrationReport>;
  exportMetricsData: (format: 'json' | 'csv' | 'excel') => Promise<string>;
}

interface DeveloperActivity {
  developer: string;
  commits: number;
  lines_added: number;
  lines_deleted: number;
  pull_requests: number;
  issues_created: number;
  issues_resolved: number;
  time_spent: number;
  productivity_score: number;
}

interface ProjectVelocity {
  commits_per_day: number;
  pull_requests_per_week: number;
  issues_resolved_per_week: number;
  deployment_frequency: number;
  lead_time: number;
  cycle_time: number;
}

interface ResourceUtilization {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_usage: number;
  container_utilization: number;
  workflow_utilization: number;
}

interface QualityMetrics {
  code_coverage: number;
  test_pass_rate: number;
  security_score: number;
  code_quality_score: number;
  technical_debt: number;
  bug_density: number;
}

interface DeploymentMetrics {
  deployment_frequency: number;
  lead_time: number;
  mean_time_to_recovery: number;
  change_failure_rate: number;
  deployment_success_rate: number;
}

interface IntegrationReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_commits: number;
    total_pull_requests: number;
    total_issues: number;
    total_deployments: number;
    total_executions: number;
  };
  developer_activity: DeveloperActivity[];
  project_velocity: ProjectVelocity;
  resource_utilization: ResourceUtilization;
  quality_metrics: QualityMetrics;
  deployment_metrics: DeploymentMetrics;
  recommendations: string[];
}

const useIntegrationMetrics = (config: IntegrationConfig): UseIntegrationMetricsReturn => {
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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  const integrationService = new IntegrationService(config);

  const fetchMetrics = useCallback(async () => {
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
  }, [integrationService]);

  const startRealTimeMonitoring = useCallback((callback: (metrics: any) => void) => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

    const interval = setInterval(async () => {
      try {
        const data = await integrationService.getCombinedMetrics();
        setMetrics(data);
        setLastUpdate(new Date());
        callback(data);
      } catch (err) {
        console.error('Erro no monitoramento em tempo real:', err);
      }
    }, 300000); // 5 minutos

    setMonitoringInterval(interval);
  }, [integrationService, monitoringInterval]);

  const stopRealTimeMonitoring = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
  }, [monitoringInterval]);

  // Métodos específicos por ferramenta
  const fetchGitMetrics = useCallback(async (): Promise<GitMetrics> => {
    return await integrationService.getGitMetrics();
  }, [integrationService]);

  const fetchGitHubMetrics = useCallback(async (): Promise<GitHubMetrics> => {
    return await integrationService.getGitHubMetrics();
  }, [integrationService]);

  const fetchDockerMetrics = useCallback(async (): Promise<DockerMetrics> => {
    return await integrationService.getDockerMetrics();
  }, [integrationService]);

  const fetchN8nMetrics = useCallback(async (): Promise<N8nMetrics> => {
    return await integrationService.getN8nMetrics();
  }, [integrationService]);

  const fetchPythonMetrics = useCallback(async (): Promise<PythonMetrics> => {
    return await integrationService.getPythonMetrics();
  }, [integrationService]);

  const fetchTimeTrackingData = useCallback(async (startDate: string, endDate: string): Promise<TimeTrackingData[]> => {
    return await integrationService.getTimeTrackingData(startDate, endDate);
  }, [integrationService]);

  // Métodos de análise
  const getDeveloperActivity = useCallback((): DeveloperActivity[] => {
    if (!metrics) return [];

    const developerMap = new Map<string, DeveloperActivity>();

    // Analisar dados do Git
    Object.entries(metrics.git.commits_by_author).forEach(([author, commits]) => {
      if (!developerMap.has(author)) {
        developerMap.set(author, {
          developer: author,
          commits: 0,
          lines_added: 0,
          lines_deleted: 0,
          pull_requests: 0,
          issues_created: 0,
          issues_resolved: 0,
          time_spent: 0,
          productivity_score: 0
        });
      }
      const dev = developerMap.get(author)!;
      dev.commits = commits;
    });

    // Analisar dados do GitHub
    metrics.github.pull_requests.forEach(pr => {
      const dev = developerMap.get(pr.author);
      if (dev) {
        dev.pull_requests++;
      }
    });

    metrics.github.issues.forEach(issue => {
      const dev = developerMap.get(issue.author);
      if (dev) {
        dev.issues_created++;
        if (issue.state === 'closed') {
          dev.issues_resolved++;
        }
      }
    });

    // Analisar dados de tempo
    metrics.timeTracking.forEach(entry => {
      const dev = developerMap.get(entry.user_id);
      if (dev) {
        dev.time_spent += entry.duration;
      }
    });

    // Calcular productivity score
    developerMap.forEach(dev => {
      const commitsScore = dev.commits * 10;
      const prScore = dev.pull_requests * 20;
      const issuesScore = dev.issues_resolved * 15;
      const timeEfficiency = dev.time_spent > 0 ? (commitsScore + prScore + issuesScore) / dev.time_spent : 0;
      
      dev.productivity_score = Math.min(100, timeEfficiency * 1000);
    });

    return Array.from(developerMap.values()).sort((a, b) => b.productivity_score - a.productivity_score);
  }, [metrics]);

  const getProjectVelocity = useCallback((): ProjectVelocity => {
    if (!metrics) {
      return {
        commits_per_day: 0,
        pull_requests_per_week: 0,
        issues_resolved_per_week: 0,
        deployment_frequency: 0,
        lead_time: 0,
        cycle_time: 0
      };
    }

    // Calcular métricas de velocidade
    const totalDays = 30; // Assumindo 30 dias de dados
    const commits_per_day = metrics.git.total_commits / totalDays;
    
    const openPRs = metrics.github.pull_requests.filter(pr => pr.state === 'open').length;
    const mergedPRs = metrics.github.pull_requests.filter(pr => pr.state === 'merged').length;
    const pull_requests_per_week = (openPRs + mergedPRs) / 4; // Assumindo 4 semanas

    const resolvedIssues = metrics.github.issues.filter(issue => issue.state === 'closed').length;
    const issues_resolved_per_week = resolvedIssues / 4;

    const deployment_frequency = metrics.github.deployment_status.filter(d => d.state === 'success').length / 4;

    // Calcular lead time e cycle time (simplificado)
    const lead_time = 7; // dias (seria calculado baseado nos dados reais)
    const cycle_time = 3; // dias (seria calculado baseado nos dados reais)

    return {
      commits_per_day,
      pull_requests_per_week,
      issues_resolved_per_week,
      deployment_frequency,
      lead_time,
      cycle_time
    };
  }, [metrics]);

  const getResourceUtilization = useCallback((): ResourceUtilization => {
    if (!metrics) {
      return {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        network_usage: 0,
        container_utilization: 0,
        workflow_utilization: 0
      };
    }

    // Calcular utilização de recursos Docker
    const totalContainers = metrics.docker.containers.length;
    const runningContainers = metrics.docker.containers.filter(c => c.status === 'running').length;
    const container_utilization = totalContainers > 0 ? (runningContainers / totalContainers) * 100 : 0;

    // Calcular utilização de workflows n8n
    const totalWorkflows = metrics.n8n.workflows.length;
    const activeWorkflows = metrics.n8n.workflows.filter(w => w.active).length;
    const workflow_utilization = totalWorkflows > 0 ? (activeWorkflows / totalWorkflows) * 100 : 0;

    // Médias de utilização de recursos
    const cpu_usage = metrics.docker.containers.reduce((sum, c) => sum + c.cpu_usage, 0) / totalContainers || 0;
    const memory_usage = metrics.docker.containers.reduce((sum, c) => sum + c.memory_usage, 0) / totalContainers || 0;

    return {
      cpu_usage,
      memory_usage,
      disk_usage: 0, // Seria calculado baseado nos dados reais
      network_usage: 0, // Seria calculado baseado nos dados reais
      container_utilization,
      workflow_utilization
    };
  }, [metrics]);

  const getQualityMetrics = useCallback((): QualityMetrics => {
    if (!metrics) {
      return {
        code_coverage: 0,
        test_pass_rate: 0,
        security_score: 0,
        code_quality_score: 0,
        technical_debt: 0,
        bug_density: 0
      };
    }

    const code_coverage = metrics.python.test_coverage.total_coverage;
    const test_pass_rate = 100 - metrics.python.test_coverage.uncovered_lines.length; // Simplificado
    const security_score = 100 - metrics.python.security_scan.vulnerabilities.length * 10; // Simplificado
    const code_quality_score = metrics.python.code_quality.pylint_score * 10;
    const technical_debt = metrics.python.code_quality.technical_debt;
    const bug_density = metrics.github.issues.filter(i => i.state === 'open').length / 1000; // Por 1000 linhas

    return {
      code_coverage,
      test_pass_rate,
      security_score,
      code_quality_score,
      technical_debt,
      bug_density
    };
  }, [metrics]);

  const getDeploymentMetrics = useCallback((): DeploymentMetrics => {
    if (!metrics) {
      return {
        deployment_frequency: 0,
        lead_time: 0,
        mean_time_to_recovery: 0,
        change_failure_rate: 0,
        deployment_success_rate: 0
      };
    }

    const successfulDeployments = metrics.github.deployment_status.filter(d => d.state === 'success').length;
    const totalDeployments = metrics.github.deployment_status.length;
    const deployment_success_rate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;

    const deployment_frequency = totalDeployments / 4; // Por semana
    const lead_time = 7; // dias (seria calculado baseado nos dados reais)
    const mean_time_to_recovery = 2; // horas (seria calculado baseado nos dados reais)
    const change_failure_rate = 100 - deployment_success_rate;

    return {
      deployment_frequency,
      lead_time,
      mean_time_to_recovery,
      change_failure_rate,
      deployment_success_rate
    };
  }, [metrics]);

  // Métodos de relatórios
  const generateIntegrationReport = useCallback(async (startDate: string, endDate: string): Promise<IntegrationReport> => {
    const timeTrackingData = await fetchTimeTrackingData(startDate, endDate);
    
    const report: IntegrationReport = {
      period: { start_date: startDate, end_date: endDate },
      summary: {
        total_commits: metrics?.git.total_commits || 0,
        total_pull_requests: metrics?.github.pull_requests.length || 0,
        total_issues: metrics?.github.issues.length || 0,
        total_deployments: metrics?.github.deployment_status.length || 0,
        total_executions: metrics?.n8n.performance_metrics.total_executions || 0
      },
      developer_activity: getDeveloperActivity(),
      project_velocity: getProjectVelocity(),
      resource_utilization: getResourceUtilization(),
      quality_metrics: getQualityMetrics(),
      deployment_metrics: getDeploymentMetrics(),
      recommendations: generateRecommendations()
    };

    return report;
  }, [metrics, fetchTimeTrackingData, getDeveloperActivity, getProjectVelocity, getResourceUtilization, getQualityMetrics, getDeploymentMetrics]);

  const generateRecommendations = (): string[] => {
    const recommendations: string[] = [];

    if (!metrics) return recommendations;

    // Análise de qualidade
    if (metrics.python.test_coverage.total_coverage < 80) {
      recommendations.push('Aumentar cobertura de testes para pelo menos 80%');
    }

    if (metrics.python.code_quality.pylint_score < 7) {
      recommendations.push('Melhorar qualidade do código - score Pylint abaixo de 7');
    }

    // Análise de performance
    if (metrics.n8n.performance_metrics.success_rate < 90) {
      recommendations.push('Investigar falhas nos workflows n8n - taxa de sucesso abaixo de 90%');
    }

    // Análise de recursos
    const containerUtilization = (metrics.docker.containers.filter(c => c.status === 'running').length / metrics.docker.containers.length) * 100;
    if (containerUtilization < 50) {
      recommendations.push('Otimizar utilização de containers - menos de 50% estão ativos');
    }

    // Análise de atividade
    if (metrics.git.total_commits < 10) {
      recommendations.push('Aumentar frequência de commits - atividade baixa detectada');
    }

    return recommendations;
  };

  const exportMetricsData = useCallback(async (format: 'json' | 'csv' | 'excel'): Promise<string> => {
    if (!metrics) throw new Error('Nenhum dado disponível para exportação');

    switch (format) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'csv':
        return convertToCSV(metrics);
      case 'excel':
        return convertToExcel(metrics);
      default:
        throw new Error('Formato não suportado');
    }
  }, [metrics]);

  const convertToCSV = (data: any): string => {
    // Implementação simplificada de conversão para CSV
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Commits', data.git.total_commits],
      ['Pull Requests', data.github.pull_requests.length],
      ['Issues', data.github.issues.length],
      ['Containers', data.docker.containers.length],
      ['Workflows', data.n8n.workflows.length],
      ['Test Coverage', `${data.python.test_coverage.total_coverage}%`]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const convertToExcel = (data: any): string => {
    // Implementação simplificada - retornaria um buffer ou URL
    return 'excel_export_url';
  };

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  return {
    // Estado
    metrics,
    loading,
    error,
    lastUpdate,

    // Métodos
    fetchMetrics,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    
    // Métodos específicos por ferramenta
    fetchGitMetrics,
    fetchGitHubMetrics,
    fetchDockerMetrics,
    fetchN8nMetrics,
    fetchPythonMetrics,
    fetchTimeTrackingData,
    
    // Métodos de análise
    getDeveloperActivity,
    getProjectVelocity,
    getResourceUtilization,
    getQualityMetrics,
    getDeploymentMetrics,
    
    // Métodos de relatórios
    generateIntegrationReport,
    exportMetricsData
  };
};

export default useIntegrationMetrics;
export type {
  DeveloperActivity,
  ProjectVelocity,
  ResourceUtilization,
  QualityMetrics,
  DeploymentMetrics,
  IntegrationReport
}; 