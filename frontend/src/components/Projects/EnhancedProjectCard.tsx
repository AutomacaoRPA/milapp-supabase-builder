import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  BarChart as ChartIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  methodology: string;
  created_at: string;
  completion_percentage?: number;
  roi_target?: number;
  estimated_effort?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
}

interface EnhancedProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
  onEdit?: (projectId: string) => void;
  onExecute?: (projectId: string) => void;
  onMetrics?: (projectId: string) => void;
}

const EnhancedProjectCard: React.FC<EnhancedProjectCardProps> = ({
  project,
  onClick,
  onEdit,
  onExecute,
  onMetrics,
}) => {
  // Cores e ícones baseados no tipo de projeto
  const getProjectAvatar = (type: string) => {
    switch (type) {
      case 'automation':
        return { icon: '🤖', color: '#2196F3' };
      case 'enhancement':
        return { icon: '⚡', color: '#4CAF50' };
      case 'maintenance':
        return { icon: '🔧', color: '#FF9800' };
      default:
        return { icon: '📊', color: '#9C27B0' };
    }
  };

  // Cores de prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  // Cores de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return '#2196F3';
      case 'development':
        return '#4CAF50';
      case 'testing':
        return '#FF9800';
      case 'deployed':
        return '#9C27B0';
      case 'maintenance':
        return '#607D8B';
      default:
        return '#757575';
    }
  };

  // Verificar se está atrasado
  const isOverdue = () => {
    if (!project.end_date) return false;
    const endDate = new Date(project.end_date);
    const today = new Date();
    return endDate < today && project.status !== 'deployed';
  };

  // Calcular dias restantes
  const getDaysRemaining = () => {
    if (!project.end_date) return null;
    const endDate = new Date(project.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Nível de urgência
  const getUrgencyLevel = () => {
    const daysRemaining = getDaysRemaining();
    if (!daysRemaining) return 'none';
    if (daysRemaining < 0) return 'critical';
    if (daysRemaining <= 3) return 'high';
    if (daysRemaining <= 7) return 'medium';
    return 'low';
  };

  const projectAvatar = getProjectAvatar(project.type);
  const daysRemaining = getDaysRemaining();
  const urgencyLevel = getUrgencyLevel();
  const isOverdueProject = isOverdue();

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `2px solid ${isOverdueProject ? '#f44336' : 'transparent'}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 8,
          borderColor: isOverdueProject ? '#d32f2f' : projectAvatar.color,
        },
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={() => onClick(project.id)}
    >
      {/* Indicador de urgência */}
      {isOverdueProject && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 1,
          }}
        >
          <Badge
            badgeContent={<WarningIcon sx={{ fontSize: 16, color: '#fff' }} />}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#f44336',
                color: '#fff',
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
              },
            }}
          />
        </Box>
      )}

      <CardContent sx={{ pb: 1 }}>
        {/* Header do card */}
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: projectAvatar.color,
              width: 48,
              height: 48,
              fontSize: '1.5rem',
            }}
          >
            {projectAvatar.icon}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </Typography>
            
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4,
                height: '2.8em',
              }}
            >
              {project.description}
            </Typography>
          </Box>

          <IconButton size="small" sx={{ mt: -0.5 }}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Badges de status e prioridade */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip
            label={project.status}
            size="small"
            sx={{
              bgcolor: getStatusColor(project.status),
              color: '#fff',
              fontWeight: 500,
            }}
          />
          <Chip
            label={project.priority}
            size="small"
            sx={{
              bgcolor: getPriorityColor(project.priority),
              color: '#fff',
              fontWeight: 500,
            }}
          />
          <Chip
            label={project.type}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>

        {/* Indicador de atraso */}
        {isOverdueProject && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              p: 1,
              bgcolor: '#ffebee',
              borderRadius: 1,
              border: '1px solid #ffcdd2',
            }}
          >
            <WarningIcon sx={{ color: '#f44336', fontSize: 16 }} />
            <Typography variant="caption" color="error" fontWeight={500}>
              Atrasado há {Math.abs(daysRemaining || 0)} dias
            </Typography>
          </Box>
        )}

        {/* Barra de progresso */}
        {project.completion_percentage !== undefined && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="textSecondary">
                Progresso
              </Typography>
              <Typography variant="caption" color="primary" fontWeight={500}>
                {Math.round(project.completion_percentage)}% completo
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={project.completion_percentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Métricas do projeto */}
        <Box display="flex" flexDirection="column" gap={1}>
          {/* Prazo */}
          {project.end_date && (
            <Box display="flex" alignItems="center" gap={1}>
              <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="textSecondary">
                Prazo: {new Date(project.end_date).toLocaleDateString()}
              </Typography>
              {daysRemaining !== null && (
                <Chip
                  label={`${daysRemaining > 0 ? daysRemaining : Math.abs(daysRemaining)} dias ${daysRemaining > 0 ? 'restantes' : 'atrasado'}`}
                  size="small"
                  color={daysRemaining > 0 ? 'default' : 'error'}
                  variant={daysRemaining > 0 ? 'outlined' : 'filled'}
                />
              )}
            </Box>
          )}

          {/* Custo estimado */}
          {project.roi_target && (
            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="textSecondary">
                ROI Alvo: {project.roi_target}%
              </Typography>
            </Box>
          )}

          {/* Esforço estimado */}
          {project.estimated_effort && (
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="textSecondary">
                Esforço: {project.estimated_effort}h
              </Typography>
            </Box>
          )}

          {/* Responsável */}
          {project.assigned_to && (
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="textSecondary">
                Responsável: {project.assigned_to}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Ações rápidas */}
      <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
        <Box display="flex" gap={1} width="100%">
          <Tooltip title="Editar Projeto">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(project.id);
              }}
              sx={{ color: 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Executar Projeto">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onExecute?.(project.id);
              }}
              sx={{ color: 'success.main' }}
            >
              <PlayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Ver Métricas">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMetrics?.(project.id);
              }}
              sx={{ color: 'info.main' }}
            >
              <ChartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default EnhancedProjectCard; 