import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material'
import {
  Notifications,
  NotificationsActive,
  NotificationsNone,
  CheckCircle,
  Error,
  Info,
  Warning,
  Schedule,
  SmartToy,
  Assignment,
  Timeline,
  Close,
  MarkEmailRead,
  Settings
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface Notification {
  id: string
  type: 'request_status_change' | 'request_assigned' | 'ai_response' | 'approval_required' | 'deadline_approaching' | 'workflow_update' | 'system_alert'
  title: string
  message: string
  link?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_read: boolean
  created_at: string
  metadata: Record<string, any>
}

interface NotificationCenterProps {
  projectId?: string
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationCenter({ projectId, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [loading, setLoading] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  const open = Boolean(anchorEl)

  useEffect(() => {
    loadNotifications()
    // Configurar real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${(async () => {
          const { data: { user } } = await supabase.auth.getUser()
          return user?.id
        })()}`
      }, (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [projectId])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_project_id: projectId,
        p_unread_only: false,
        p_limit: 50
      })

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.is_read).length)
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      })

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setMarkingRead(true)
      
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_project_id: projectId
      })

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
    } finally {
      setMarkingRead(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    onNotificationClick?.(notification)
    
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request_status_change':
        return <Timeline />
      case 'request_assigned':
        return <Assignment />
      case 'ai_response':
        return <SmartToy />
      case 'approval_required':
        return <CheckCircle />
      case 'deadline_approaching':
        return <Schedule />
      case 'workflow_update':
        return <Timeline />
      case 'system_alert':
        return <Info />
      default:
        return <Notifications />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'error'
    if (priority === 'high') return 'warning'
    
    switch (type) {
      case 'approval_required':
        return 'warning'
      case 'deadline_approaching':
        return 'error'
      case 'ai_response':
        return 'info'
      default:
        return 'primary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#DC2626'
      case 'high':
        return '#F59E0B'
      case 'normal':
        return '#3B82F6'
      case 'low':
        return '#10B981'
      default:
        return '#6B7280'
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
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton
          onClick={handleClick}
          sx={{
            position: 'relative',
            color: unreadCount > 0 ? 'primary.main' : 'inherit'
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? <NotificationsActive /> : <NotificationsNone />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Cabeçalho */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Notificações
            </Typography>
            
            <Box display="flex" gap={1}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  disabled={markingRead}
                  startIcon={markingRead ? <CircularProgress size={16} /> : <MarkEmailRead />}
                >
                  Marcar todas
                </Button>
              )}
              
              <IconButton size="small" onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Lista de Notificações */}
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <NotificationsNone sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma notificação
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Você será notificado quando houver atualizações importantes.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      },
                      position: 'relative'
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: getNotificationColor(notification.type, notification.priority),
                          width: 32,
                          height: 32
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={notification.is_read ? 'normal' : 'bold'}
                            sx={{ flex: 1 }}
                          >
                            {notification.title}
                          </Typography>
                          
                          <Chip
                            label={notification.priority}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(notification.priority),
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                          
                          {!notification.is_read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main'
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1
                            }}
                          >
                            {notification.message}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Rodapé */}
        {notifications.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => {
                handleClose()
                // Navegar para página de notificações
                window.location.href = '/notifications'
              }}
            >
              Ver Todas as Notificações
            </Button>
          </Box>
        )}
      </Menu>
    </>
  )
}

// Componente para notificação toast
interface NotificationToastProps {
  notification: Notification
  onClose: () => void
  onAction?: () => void
}

export function NotificationToast({ notification, onClose, onAction }: NotificationToastProps) {
  const getSeverity = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error'
      case 'high':
        return 'warning'
      default:
        return 'info'
    }
  }

  return (
    <Alert
      severity={getSeverity(notification.priority)}
      onClose={onClose}
      action={
        onAction && (
          <Button
            color="inherit"
            size="small"
            onClick={onAction}
          >
            Ver
          </Button>
        )
      }
      sx={{
        width: '100%',
        maxWidth: 400,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          {notification.title}
        </Typography>
        <Typography variant="body2">
          {notification.message}
        </Typography>
      </Box>
    </Alert>
  )
} 