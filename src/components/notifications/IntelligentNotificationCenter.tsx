import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Divider,
  Alert,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
  Snackbar,
  CircularProgress,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  CheckCircle,
  Warning,
  Error,
  Info,
  Schedule,
  Delete,
  Settings,
  FilterList,
  Refresh,
  ExpandMore,
  Email,
  Chat,
  Phone,
  Smartphone,
  Close,
  PriorityHigh,
  LowPriority,
  MoreVert,
  Archive,
  MarkEmailRead,
  DoNotDisturb,
  DoNotDisturbOff
} from '@mui/icons-material'
import { intelligentNotificationService } from '../../services/notifications/IntelligentNotificationService'
import { supabase } from '../../services/supabase/client'

interface Notification {
  id: string
  title: string
  message: string
  type: 'alert' | 'info' | 'success' | 'warning' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'sent' | 'failed' | 'read'
  createdAt: string
  readAt?: string
  channels: string[]
  metadata?: any
}

interface NotificationPreference {
  channel: string
  isEnabled: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  priority: 'all' | 'high_only' | 'urgent_only'
}

export function IntelligentNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de UI
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  
  // Estados de filtro
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Estados de preferências
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      channel: 'email',
      isEnabled: true,
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      frequency: 'immediate',
      priority: 'all'
    },
    {
      channel: 'teams',
      isEnabled: true,
      quietHours: { enabled: true, start: '18:00', end: '08:00' },
      frequency: 'immediate',
      priority: 'high_only'
    },
    {
      channel: 'whatsapp',
      isEnabled: false,
      quietHours: { enabled: true, start: '20:00', end: '08:00' },
      frequency: 'immediate',
      priority: 'urgent_only'
    },
    {
      channel: 'in_app',
      isEnabled: true,
      quietHours: { enabled: false, start: '00:00', end: '00:00' },
      frequency: 'immediate',
      priority: 'all'
    }
  ])

  useEffect(() => {
    loadNotifications()
    loadPreferences()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const userNotifications = await intelligentNotificationService.getUserNotifications(userId, 100)
      setNotifications(userNotifications)
      setUnreadCount(userNotifications.filter(n => n.status !== 'read').length)
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error)
      setError('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const userPrefs = await intelligentNotificationService.getUserPreferences(userId)
      if (userPrefs.length > 0) {
        setPreferences(userPrefs)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preferências:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await intelligentNotificationService.markAsRead(notificationId)
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
      setSuccess('Notificação marcada como lida')
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error)
      setError('Erro ao marcar notificação como lida')
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status !== 'read')
      
      for (const notification of unreadNotifications) {
        await intelligentNotificationService.markAsRead(notification.id)
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read', readAt: new Date().toISOString() }))
      )
      
      setUnreadCount(0)
      setSuccess('Todas as notificações marcadas como lidas')
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      setError('Erro ao marcar notificações como lidas')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notificacoes')
        .delete()
        .eq('id', notificationId)
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setSuccess('Notificação removida')
    } catch (error) {
      console.error('❌ Erro ao remover notificação:', error)
      setError('Erro ao remover notificação')
    }
  }

  const savePreferences = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      await intelligentNotificationService.setNotificationPreferences(userId, preferences)
      setSuccess('Preferências salvas com sucesso')
      setSettingsOpen(false)
    } catch (error) {
      console.error('❌ Erro ao salvar preferências:', error)
      setError('Erro ao salvar preferências')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle color="success" />
      case 'warning': return <Warning color="warning" />
      case 'critical': return <Error color="error" />
      case 'alert': return <PriorityHigh color="error" />
      default: return <Info color="info" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Email />
      case 'teams': return <Chat />
      case 'whatsapp': return <Smartphone />
      case 'in_app': return <Notifications />
      default: return <Notifications />
    }
  }

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      if (filterType !== 'all' && notification.type !== filterType) return false
      if (filterPriority !== 'all' && notification.priority !== filterPriority) return false
      if (filterStatus !== 'all' && notification.status !== filterStatus) return false
      return true
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Agora'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
          Centro de Notificações Inteligentes
        </Typography>
        
        <Box display="flex" gap={1}>
          <Badge badgeContent={unreadCount} color="error">
            <IconButton onClick={() => setFilterOpen(!filterOpen)}>
              <FilterList />
            </IconButton>
          </Badge>
          
          <Tooltip title="Configurações">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <Settings />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Atualizar">
            <IconButton onClick={loadNotifications}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      {filterOpen && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Tipo"
                  >
                    <MenuItem value="all">Todos os tipos</MenuItem>
                    <MenuItem value="success">Sucesso</MenuItem>
                    <MenuItem value="warning">Aviso</MenuItem>
                    <MenuItem value="critical">Crítico</MenuItem>
                    <MenuItem value="info">Informação</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    label="Prioridade"
                  >
                    <MenuItem value="all">Todas as prioridades</MenuItem>
                    <MenuItem value="urgent">Urgente</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="medium">Média</MenuItem>
                    <MenuItem value="low">Baixa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Todos os status</MenuItem>
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="sent">Enviada</MenuItem>
                    <MenuItem value="read">Lida</MenuItem>
                    <MenuItem value="failed">Falhou</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Lista de Notificações */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box textAlign="center" p={3}>
              <NotificationsOff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                Nenhuma notificação encontrada
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {notifications.length === 0 
                  ? 'Você não tem notificações ainda'
                  : 'Nenhuma notificação atende aos filtros aplicados'
                }
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.status === 'read' ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      {getTypeIcon(notification.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body1"
                            fontWeight={notification.status === 'read' ? 'normal' : 'bold'}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority) as any}
                          />
                          {notification.status !== 'read' && (
                            <Chip
                              label="Nova"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {notification.message}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mt={1}>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(notification.createdAt)}
                            </Typography>
                            <Box display="flex" gap={0.5}>
                              {notification.channels.map(channel => (
                                <Tooltip key={channel} title={channel}>
                                  <IconButton size="small">
                                    {getChannelIcon(channel)}
                                  </IconButton>
                                </Tooltip>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        {notification.status !== 'read' && (
                          <Tooltip title="Marcar como lida">
                            <IconButton
                              size="small"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <MarkEmailRead />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setSelectedNotification(notification)
                            setAnchorEl(e.currentTarget)
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItemComponent onClick={() => {
          if (selectedNotification) {
            markAsRead(selectedNotification.id)
          }
          setAnchorEl(null)
        }}>
          <MarkEmailRead sx={{ mr: 1 }} />
          Marcar como lida
        </MenuItemComponent>
        
        <MenuItemComponent onClick={() => {
          if (selectedNotification) {
            deleteNotification(selectedNotification.id)
          }
          setAnchorEl(null)
        }}>
          <Delete sx={{ mr: 1 }} />
          Remover
        </MenuItemComponent>
      </Menu>

      {/* Dialog de Configurações */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configurações de Notificações
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Configure como e quando você deseja receber notificações
          </Typography>
          
          {preferences.map((pref, index) => (
            <Accordion key={pref.channel} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getChannelIcon(pref.channel)}
                  <Typography variant="h6" textTransform="capitalize">
                    {pref.channel.replace('_', ' ')}
                  </Typography>
                  <Switch
                    checked={pref.isEnabled}
                    onChange={(e) => {
                      const newPrefs = [...preferences]
                      newPrefs[index].isEnabled = e.target.checked
                      setPreferences(newPrefs)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Frequência</InputLabel>
                      <Select
                        value={pref.frequency}
                        onChange={(e) => {
                          const newPrefs = [...preferences]
                          newPrefs[index].frequency = e.target.value as any
                          setPreferences(newPrefs)
                        }}
                        label="Frequência"
                      >
                        <MenuItem value="immediate">Imediata</MenuItem>
                        <MenuItem value="hourly">A cada hora</MenuItem>
                        <MenuItem value="daily">Diária</MenuItem>
                        <MenuItem value="weekly">Semanal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Prioridade</InputLabel>
                      <Select
                        value={pref.priority}
                        onChange={(e) => {
                          const newPrefs = [...preferences]
                          newPrefs[index].priority = e.target.value as any
                          setPreferences(newPrefs)
                        }}
                        label="Prioridade"
                      >
                        <MenuItem value="all">Todas</MenuItem>
                        <MenuItem value="high_only">Alta ou superior</MenuItem>
                        <MenuItem value="urgent_only">Apenas urgentes</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pref.quietHours.enabled}
                          onChange={(e) => {
                            const newPrefs = [...preferences]
                            newPrefs[index].quietHours.enabled = e.target.checked
                            setPreferences(newPrefs)
                          }}
                        />
                      }
                      label="Horário silencioso"
                    />
                  </Grid>
                  
                  {pref.quietHours.enabled && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="time"
                          label="Início"
                          value={pref.quietHours.start}
                          onChange={(e) => {
                            const newPrefs = [...preferences]
                            newPrefs[index].quietHours.start = e.target.value
                            setPreferences(newPrefs)
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="time"
                          label="Fim"
                          value={pref.quietHours.end}
                          onChange={(e) => {
                            const newPrefs = [...preferences]
                            newPrefs[index].quietHours.end = e.target.value
                            setPreferences(newPrefs)
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={savePreferences} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
} 