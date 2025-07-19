import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  People,
  Assignment,
  SmartToy,
  Notifications,
  Security,
  TrendingUp,
  TrendingDown,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Schedule
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface AdminStats {
  total_users: number
  active_users: number
  total_requests: number
  pending_requests: number
  completed_requests: number
  ai_interactions: number
  notifications_sent: number
  system_health: 'healthy' | 'warning' | 'error'
  recent_activities: Array<{
    id: string
    action: string
    user_email: string
    timestamp: string
    severity: 'info' | 'warning' | 'error'
  }>
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAdminStats()
  }, [])

  const loadAdminStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar estatísticas do sistema
      const [
        usersResult,
        requestsResult,
        aiResult,
        notificationsResult,
        activitiesResult
      ] = await Promise.all([
        // Estatísticas de usuários
        supabase
          .from('users')
          .select('id, created_at, last_sign_in_at')
          .order('created_at', { ascending: false }),

        // Estatísticas de solicitações
        supabase
          .from('requests')
          .select('id, status, created_at, completed_at'),

        // Estatísticas de IA
        supabase
          .from('thread_messages')
          .select('id, sender_type, created_at')
          .eq('sender_type', 'ai'),

        // Estatísticas de notificações
        supabase
          .from('notifications')
          .select('id, status, created_at'),

        // Atividades recentes
        supabase
          .from('audit_log')
          .select('id, action, user_email, created_at, resource_type')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      if (usersResult.error) throw usersResult.error
      if (requestsResult.error) throw requestsResult.error
      if (aiResult.error) throw aiResult.error
      if (notificationsResult.error) throw notificationsResult.error
      if (activitiesResult.error) throw activitiesResult.error

      const users = usersResult.data || []
      const requests = requestsResult.data || []
      const aiMessages = aiResult.data || []
      const notifications = notificationsResult.data || []
      const activities = activitiesResult.data || []

      // Calcular estatísticas
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const activeUsers = users.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo
      ).length

      const pendingRequests = requests.filter(req => 
        req.status === 'pending' || req.status === 'in_progress'
      ).length

      const completedRequests = requests.filter(req => 
        req.status === 'completed'
      ).length

      const recentAiInteractions = aiMessages.filter(msg => 
        new Date(msg.created_at) > thirtyDaysAgo
      ).length

      const notificationsSent = notifications.filter(notif => 
        new Date(notif.created_at) > thirtyDaysAgo
      ).length

      // Determinar saúde do sistema
      let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'
      if (pendingRequests > 50) systemHealth = 'warning'
      if (pendingRequests > 100) systemHealth = 'error'

      // Processar atividades recentes
      const recentActivities = activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        user_email: activity.user_email || 'Sistema',
        timestamp: activity.created_at,
        severity: activity.action.includes('error') ? 'error' : 
                 activity.action.includes('warning') ? 'warning' : 'info'
      }))

      setStats({
        total_users: users.length,
        active_users: activeUsers,
        total_requests: requests.length,
        pending_requests: pendingRequests,
        completed_requests: completedRequests,
        ai_interactions: recentAiInteractions,
        notifications_sent: notificationsSent,
        system_health: systemHealth,
        recent_activities: recentActivities
      })

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas admin:', error)
      setError('Erro ao carregar estatísticas do sistema')
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle />
      case 'warning':
        return <Warning />
      case 'error':
        return <Error />
      default:
        return <Schedule />
    }
  }

  const getActivityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Error color="error" />
      case 'warning':
        return <Warning color="warning" />
      default:
        return <CheckCircle color="success" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert severity="info">
        Nenhuma estatística disponível
      </Alert>
    )
  }

  const completionRate = stats.total_requests > 0 
    ? (stats.completed_requests / stats.total_requests) * 100 
    : 0

  const userActivityRate = stats.total_users > 0 
    ? (stats.active_users / stats.total_users) * 100 
    : 0

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard Administrativo
        </Typography>
        
        <Tooltip title="Atualizar estatísticas">
          <IconButton onClick={loadAdminStats}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status do Sistema */}
      <Alert 
        severity={getHealthColor(stats.system_health)} 
        icon={getHealthIcon(stats.system_health)}
        sx={{ mb: 3 }}
      >
        <Typography variant="body2">
          <strong>Status do Sistema:</strong> {
            stats.system_health === 'healthy' ? 'Sistema operando normalmente' :
            stats.system_health === 'warning' ? 'Atenção: Muitas solicitações pendentes' :
            'Crítico: Sistema sobrecarregado'
          }
        </Typography>
      </Alert>

      {/* Métricas Principais */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <People color="primary" />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usuários Totais
                  </Typography>
                </Box>
              </Box>
              
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  {stats.active_users} ativos (30 dias)
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={userActivityRate} 
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assignment color="primary" />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_requests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Solicitações Totais
                  </Typography>
                </Box>
              </Box>
              
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  {stats.completed_requests} concluídas
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={completionRate} 
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <SmartToy color="primary" />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.ai_interactions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interações IA (30d)
                  </Typography>
                </Box>
              </Box>
              
              <Box mt={2}>
                <Chip 
                  label="IA Ativa" 
                  color="success" 
                  size="small"
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Notifications color="primary" />
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.notifications_sent}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Notificações (30d)
                  </Typography>
                </Box>
              </Box>
              
              <Box mt={2}>
                <Chip 
                  label="Multicanal" 
                  color="info" 
                  size="small"
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas e Status */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alertas do Sistema
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    {stats.pending_requests > 50 ? <Warning color="warning" /> : <CheckCircle color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`Solicitações Pendentes: ${stats.pending_requests}`}
                    secondary={
                      stats.pending_requests > 50 
                        ? "Atenção: Muitas solicitações aguardando processamento"
                        : "Nível normal de solicitações pendentes"
                    }
                  />
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    {userActivityRate < 50 ? <Warning color="warning" /> : <CheckCircle color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`Taxa de Atividade: ${userActivityRate.toFixed(1)}%`}
                    secondary={
                      userActivityRate < 50 
                        ? "Baixa atividade de usuários"
                        : "Boa atividade de usuários"
                    }
                  />
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    {completionRate < 70 ? <Warning color="warning" /> : <CheckCircle color="success" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`Taxa de Conclusão: ${completionRate.toFixed(1)}%`}
                    secondary={
                      completionRate < 70 
                        ? "Taxa de conclusão abaixo do esperado"
                        : "Boa taxa de conclusão de solicitações"
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Atividades Recentes
              </Typography>
              
              <List>
                {stats.recent_activities.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>
                      {getActivityIcon(activity.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={`${activity.user_email} • ${formatTimeAgo(activity.timestamp)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ações Rápidas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ações Administrativas Rápidas
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                icon={<People />}
                label="Gerenciar Usuários"
                clickable
                color="primary"
                variant="outlined"
                onClick={() => window.location.href = '/admin/users'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                icon={<Security />}
                label="Configurar Permissões"
                clickable
                color="primary"
                variant="outlined"
                onClick={() => window.location.href = '/admin/rbac'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                icon={<Settings />}
                label="Configurações"
                clickable
                color="primary"
                variant="outlined"
                onClick={() => window.location.href = '/admin/settings'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                icon={<Assessment />}
                label="Ver Auditoria"
                clickable
                color="primary"
                variant="outlined"
                onClick={() => window.location.href = '/admin/audit'}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
} 