import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Rocket as RocketIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  progress?: number;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  trend,
  icon,
  color,
  subtitle,
  progress,
}) => {
  const getTrendIcon = () => {
    if (!trend) return <RemoveIcon sx={{ fontSize: 16 }} />;
    if (trend > 0) return <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />;
    return <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text.secondary';
    if (trend > 0) return 'success.main';
    return 'error.main';
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          borderColor: color,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="body2" color="textSecondary" fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}20`,
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>

        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {getTrendIcon()}
            <Typography
              variant="caption"
              sx={{ color: getTrendColor(), fontWeight: 600 }}
            >
              {trend > 0 ? '+' : ''}{trend}% vs mês anterior
            </Typography>
          </Box>
        )}

        {subtitle && (
          <Typography variant="caption" color="textSecondary">
            {subtitle}
          </Typography>
        )}

        {progress !== undefined && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="textSecondary">
                Progresso
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: color,
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface KPIDashboardProps {
  projects: any[];
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ projects }) => {
  // Calcular métricas
  const calculateMetrics = () => {
    const metrics = {
      totalProjects: projects.length,
      activeProjects: 0,
      overdueProjects: 0,
      completedProjects: 0,
      averageProgress: 0,
      highPriorityProjects: 0,
      automationProjects: 0,
      totalROI: 0,
    };

    let totalProgress = 0;
    let projectsWithProgress = 0;

    projects.forEach(project => {
      // Projetos ativos
      if (project.status !== 'deployed' && project.status !== 'cancelled') {
        metrics.activeProjects++;
      }

      // Projetos atrasados
      if (project.end_date) {
        const endDate = new Date(project.end_date);
        const today = new Date();
        if (endDate < today && project.status !== 'deployed') {
          metrics.overdueProjects++;
        }
      }

      // Projetos concluídos
      if (project.status === 'deployed') {
        metrics.completedProjects++;
      }

      // Alta prioridade
      if (project.priority === 'high') {
        metrics.highPriorityProjects++;
      }

      // Automações
      if (project.type === 'automation') {
        metrics.automationProjects++;
      }

      // Progresso
      if (project.completion_percentage !== undefined) {
        totalProgress += project.completion_percentage;
        projectsWithProgress++;
      }

      // ROI
      if (project.roi_target) {
        metrics.totalROI += project.roi_target;
      }
    });

    metrics.averageProgress = projectsWithProgress > 0 ? totalProgress / projectsWithProgress : 0;
    metrics.totalROI = metrics.totalROI / Math.max(metrics.totalProjects, 1);

    return metrics;
  };

  const metrics = calculateMetrics();

  // Calcular tendências (simulado)
  const getTrends = () => ({
    active: 12, // +12% vs mês anterior
    overdue: -5, // -5% vs mês anterior
    completed: 8, // +8% vs mês anterior
    roi: 15, // +15% vs mês anterior
  });

  const trends = getTrends();

  return (
    <Box mb={4}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        📊 KPIs do Projeto
      </Typography>
      
      <Grid container spacing={3}>
        {/* Projetos Ativos */}
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Projetos Ativos"
            value={metrics.activeProjects}
            trend={trends.active}
            icon={<RocketIcon />}
            color="#2196F3"
            subtitle={`de ${metrics.totalProjects} total`}
            progress={(metrics.activeProjects / Math.max(metrics.totalProjects, 1)) * 100}
          />
        </Grid>

        {/* Projetos Atrasados */}
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Atrasados"
            value={metrics.overdueProjects}
            trend={trends.overdue}
            icon={<WarningIcon />}
            color="#f44336"
            subtitle="requerem atenção"
            progress={metrics.overdueProjects > 0 ? 100 : 0}
          />
        </Grid>

        {/* Projetos Concluídos */}
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Concluídos"
            value={metrics.completedProjects}
            trend={trends.completed}
            icon={<CheckIcon />}
            color="#4caf50"
            subtitle="este mês"
            progress={(metrics.completedProjects / Math.max(metrics.totalProjects, 1)) * 100}
          />
        </Grid>

        {/* ROI Médio */}
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="ROI Médio"
            value={`${Math.round(metrics.totalROI)}%`}
            trend={trends.roi}
            icon={<ChartIcon />}
            color="#9c27b0"
            subtitle="retorno sobre investimento"
            progress={Math.min(metrics.totalROI, 100)}
          />
        </Grid>
      </Grid>

      {/* Métricas secundárias */}
      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" fontWeight={600}>
              {metrics.highPriorityProjects}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Alta Prioridade
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main" fontWeight={600}>
              {metrics.automationProjects}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Automações
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main" fontWeight={600}>
              {Math.round(metrics.averageProgress)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Progresso Médio
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main" fontWeight={600}>
              {metrics.totalProjects - metrics.activeProjects}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Finalizados
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KPIDashboard; 