import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Badge
} from '@mui/material'
import {
  Add,
  Visibility,
  Chat,
  Timeline,
  Assignment,
  CheckCircle,
  Pending,
  Error,
  Schedule,
  Person,
  CalendarToday,
  PriorityHigh,
  AttachFile,
  Send,
  SmartToy,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import { supabase } from '../services/supabase/client'
import { useCurrentRole } from '../hooks/useCurrentRole'
import { RoleBadge } from '../components/ui/RoleBadge'

interface Request {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  requested_at: string
  completed_at?: string
  project_name: string
  project_id: string
  current_state: string
  state_color: string
  state_icon: string
  assigned_to_name?: string
  message_count: number
  last_message_at?: string
}

interface ThreadMessage {
  id: string
  sender_type: 'user' | 'ai' | 'system'
  content: string
  created_at: string
  sender_name?: string
}

export function SolicitanteDashboard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [showThread, setShowThread] = useState(false)
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [newRequestData, setNewRequestData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: ''
  })

  // Mock project ID - em produção viria do contexto
  const projectId = '00000000-0000-0000-0000-000000000001'
  const { role, isSolicitante } = useCurrentRole(projectId)

  useEffect(() => {
    if (isSolicitante) {
      loadRequests()
    }
  }, [isSolicitante])

  const loadRequests = async () => {
    try {
      setLoading(true)
      
      // Em produção, usar a view solicitante_dashboard
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          title,
          description,
          priority,
          status,
          requested_at,
          completed_at,
          projects!inner(name, id),
          workflow_states!inner(name, color, icon),
          users!assigned_to(name),
          request_threads(thread_messages(count))
        `)
        .eq('solicitante_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      // Transformar dados para o formato esperado
      const transformedRequests: Request[] = (data || []).map(req => ({
        id: req.id,
        title: req.title,
        description: req.description,
        priority: req.priority,
        status: req.status,
        requested_at: req.requested_at,
        completed_at: req.completed_at,
        project_name: req.projects?.name || 'Projeto',
        project_id: req.projects?.id || '',
        current_state: req.workflow_states?.name || 'Pendente',
        state_color: req.workflow_states?.color || '#6B7280',
        state_icon: req.workflow_states?.icon || '⏳',
        assigned_to_name: req.users?.name,
        message_count: req.request_threads?.[0]?.thread_messages?.[0]?.count || 0,
        last_message_at: req.request_threads?.[0]?.last_message_at
      }))

      setRequests(transformedRequests)
    } catch (error) {
      console.error('❌ Erro ao carregar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadThreadMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('thread_messages')
        .select(`
          id,
          sender_type,
          content,
          created_at,
          users!inner(name)
        `)
        .eq('request_threads.request_id', requestId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const messages: ThreadMessage[] = (data || []).map(msg => ({
        id: msg.id,
        sender_type: msg.sender_type,
        content: msg.content,
        created_at: msg.created_at,
        sender_name: msg.users?.name
      }))

      setThreadMessages(messages)
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error)
    }
  }

  const createNewRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('requests')
        .insert({
          project_id: projectId,
          solicitante_id: user.id,
          title: newRequestData.title,
          description: newRequestData.description,
          priority: newRequestData.priority,
          category: newRequestData.category,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Criar thread inicial
      await supabase
        .from('request_threads')
        .insert({
          request_id: data.id,
          user_id: user.id,
          title: `Solicitação: ${newRequestData.title}`
        })

      setShowNewRequest(false)
      setNewRequestData({ title: '', description: '', priority: 'medium', category: '' })
      loadRequests()
    } catch (error) {
      console.error('❌ Erro ao criar solicitação:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#F59E0B',
      in_progress: '#3B82F6',
      review: '#8B5CF6',
      approved: '#10B981',
      rejected: '#EF4444',
      completed: '#059669',
      cancelled: '#6B7280'
    }
    return colors[status as keyof typeof colors] || '#6B7280'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Pending />,
      in_progress: <Assignment />,
      review: <Visibility />,
      approved: <CheckCircle />,
      rejected: <Error />,
      completed: <CheckCircle />,
      cancelled: <Error />
    }
    return icons[status as keyof typeof icons] || <Pending />
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626'
    }
    return colors[priority as keyof typeof colors] || '#6B7280'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProgressValue = (request: Request) => {
    const stages = ['pending', 'in_progress', 'review', 'approved', 'completed']
    const currentIndex = stages.indexOf(request.status)
    return ((currentIndex + 1) / stages.length) * 100
  }

  if (!isSolicitante) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="warning">
          Você não tem permissão para acessar esta área. Apenas solicitantes podem ver este dashboard.
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Meu Painel de Solicitações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Acompanhe suas solicitações e interações com a IA
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <RoleBadge role={role || 'solicitante'} projectId={projectId} />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowNewRequest(true)}
          >
            Nova Solicitação
          </Button>
        </Box>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#3B82F6' }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {requests.filter(r => r.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#10B981' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {requests.filter(r => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Concluídas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#8B5CF6' }}>
                  <Chat />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {requests.reduce((sum, r) => sum + r.message_count, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interações IA
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#F59E0B' }}>
                  <Timeline />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {requests.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Solicitações */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Minhas Solicitações
          </Typography>
          
          {loading ? (
            <LinearProgress />
          ) : requests.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma solicitação encontrada
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Crie sua primeira solicitação para começar a usar o sistema.
              </Typography>
            </Box>
          ) : (
            <List>
              {requests.map((request, index) => (
                <React.Fragment key={request.id}>
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(request.status)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {request.title}
                          </Typography>
                          <Chip
                            label={request.priority.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(request.priority),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {request.description}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={2} mb={1}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <CalendarToday sx={{ fontSize: 16 }} />
                              <Typography variant="caption">
                                {formatDate(request.requested_at)}
                              </Typography>
                            </Box>
                            
                            {request.assigned_to_name && (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Person sx={{ fontSize: 16 }} />
                                <Typography variant="caption">
                                  {request.assigned_to_name}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={getProgressValue(request)}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(getProgressValue(request))}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <Box display="flex" gap={1}>
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Conversar com IA">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request)
                            loadThreadMessages(request.id)
                            setShowThread(true)
                          }}
                        >
                          <Badge badgeContent={request.message_count} color="primary">
                            <Chat />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  
                  {index < requests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Solicitação */}
      <Dialog
        open={showNewRequest}
        onClose={() => setShowNewRequest(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Add />
            Nova Solicitação
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Título da Solicitação"
              value={newRequestData.title}
              onChange={(e) => setNewRequestData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            
            <TextField
              label="Descrição"
              value={newRequestData.description}
              onChange={(e) => setNewRequestData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={newRequestData.priority}
                onChange={(e) => setNewRequestData(prev => ({ ...prev, priority: e.target.value as any }))}
                label="Prioridade"
              >
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="critical">Crítica</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Categoria (opcional)"
              value={newRequestData.category}
              onChange={(e) => setNewRequestData(prev => ({ ...prev, category: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowNewRequest(false)}>
            Cancelar
          </Button>
          <Button
            onClick={createNewRequest}
            variant="contained"
            disabled={!newRequestData.title || !newRequestData.description}
          >
            Criar Solicitação
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Thread de IA */}
      <Dialog
        open={showThread}
        onClose={() => setShowThread(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy />
            Conversa com IA - {selectedRequest?.title}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box height="400px" overflow="auto" p={2}>
            {threadMessages.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhuma mensagem ainda
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Inicie uma conversa com a IA para obter ajuda com sua solicitação.
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {threadMessages.map((message) => (
                  <Box
                    key={message.id}
                    display="flex"
                    justifyContent={message.sender_type === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: message.sender_type === 'user' ? 'primary.main' : 'grey.100',
                        color: message.sender_type === 'user' ? 'white' : 'text.primary'
                      }}
                    >
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                        {formatDate(message.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowThread(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 