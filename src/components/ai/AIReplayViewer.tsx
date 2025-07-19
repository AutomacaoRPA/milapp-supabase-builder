import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Paper,
  Grid,
  Rating,
  LinearProgress
} from '@mui/material'
import {
  SmartToy,
  Person,
  Settings,
  ThumbUp,
  ThumbDown,
  Edit,
  Flag,
  Timeline,
  PlayArrow,
  Pause,
  Speed,
  Download,
  Share,
  Analytics,
  Psychology
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface ThreadMessage {
  id: string
  sender_type: 'user' | 'ai' | 'system'
  content: string
  message_type: 'text' | 'file' | 'decision' | 'approval'
  attachments: any[]
  metadata: Record<string, any>
  created_at: string
  sender_name?: string
  feedback?: {
    rating: number
    feedback_type: 'useful' | 'error' | 'needs_review'
    comments?: string
    reviewed_by?: string
    reviewed_at?: string
  }
}

interface AIReplayViewerProps {
  requestId: string
  onFeedback?: (messageId: string, feedback: any) => void
  readOnly?: boolean
}

export function AIReplayViewer({ requestId, onFeedback, readOnly = false }: AIReplayViewerProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ThreadMessage | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    feedback_type: 'useful' as 'useful' | 'error' | 'needs_review',
    comments: ''
  })
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (requestId) {
      loadThreadMessages()
    }
  }, [requestId])

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (currentMessageIndex < messages.length - 1) {
          setCurrentMessageIndex(prev => prev + 1)
        } else {
          setIsPlaying(false)
        }
      }, 2000 / playbackSpeed)

      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentMessageIndex, messages.length, playbackSpeed])

  const loadThreadMessages = async () => {
    try {
      setLoading(true)

      // Carregar thread da solicitação
      const { data: threadData, error: threadError } = await supabase
        .from('request_threads')
        .select('id')
        .eq('request_id', requestId)
        .single()

      if (threadError) throw threadError

      // Carregar mensagens com feedback
      const { data: messagesData, error: messagesError } = await supabase
        .from('thread_messages')
        .select(`
          id,
          sender_type,
          content,
          message_type,
          attachments,
          metadata,
          created_at,
          users!inner(name),
          message_feedback(rating, feedback_type, comments, reviewed_by, reviewed_at)
        `)
        .eq('thread_id', threadData.id)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      const transformedMessages: ThreadMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        sender_type: msg.sender_type,
        content: msg.content,
        message_type: msg.message_type,
        attachments: msg.attachments || [],
        metadata: msg.metadata || {},
        created_at: msg.created_at,
        sender_name: msg.users?.name,
        feedback: msg.message_feedback?.[0] || undefined
      }))

      setMessages(transformedMessages)
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveFeedback = async () => {
    if (!selectedMessage) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('message_feedback')
        .upsert({
          message_id: selectedMessage.id,
          rating: feedbackData.rating,
          feedback_type: feedbackData.feedback_type,
          comments: feedbackData.comments,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })

      if (error) throw error

      // Atualizar mensagem local
      setMessages(prev => 
        prev.map(msg => 
          msg.id === selectedMessage.id 
            ? { 
                ...msg, 
                feedback: {
                  rating: feedbackData.rating,
                  feedback_type: feedbackData.feedback_type,
                  comments: feedbackData.comments,
                  reviewed_by: user.email,
                  reviewed_at: new Date().toISOString()
                }
              }
            : msg
        )
      )

      onFeedback?.(selectedMessage.id, feedbackData)
      setShowFeedbackDialog(false)
      setSelectedMessage(null)
      setFeedbackData({ rating: 0, feedback_type: 'useful', comments: '' })
    } catch (error) {
      console.error('❌ Erro ao salvar feedback:', error)
    }
  }

  const getMessageIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return <SmartToy />
      case 'system':
        return <Settings />
      default:
        return <Person />
    }
  }

  const getMessageColor = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return '#8B5CF6'
      case 'system':
        return '#6B7280'
      default:
        return '#3B82F6'
    }
  }

  const getFeedbackColor = (feedbackType: string) => {
    switch (feedbackType) {
      case 'useful':
        return 'success'
      case 'error':
        return 'error'
      case 'needs_review':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getFeedbackIcon = (feedbackType: string) => {
    switch (feedbackType) {
      case 'useful':
        return <ThumbUp />
      case 'error':
        return <ThumbDown />
      case 'needs_review':
        return <Flag />
      default:
        return null
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const startPlayback = () => {
    setCurrentMessageIndex(0)
    setIsPlaying(true)
  }

  const pausePlayback = () => {
    setIsPlaying(false)
  }

  const exportReplay = () => {
    const replayData = {
      request_id: requestId,
      messages: messages,
      exported_at: new Date().toISOString(),
      metadata: {
        total_messages: messages.length,
        ai_messages: messages.filter(m => m.sender_type === 'ai').length,
        user_messages: messages.filter(m => m.sender_type === 'user').length,
        feedback_count: messages.filter(m => m.feedback).length
      }
    }

    const blob = new Blob([JSON.stringify(replayData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-replay-${requestId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getAnalytics = () => {
    const aiMessages = messages.filter(m => m.sender_type === 'ai')
    const userMessages = messages.filter(m => m.sender_type === 'user')
    const feedbackCount = messages.filter(m => m.feedback).length
    
    const avgRating = aiMessages.length > 0 
      ? aiMessages.reduce((sum, m) => sum + (m.feedback?.rating || 0), 0) / aiMessages.length
      : 0

    return {
      totalMessages: messages.length,
      aiMessages: aiMessages.length,
      userMessages: userMessages.length,
      feedbackCount,
      avgRating,
      conversationDuration: messages.length > 1 
        ? new Date(messages[messages.length - 1].created_at).getTime() - new Date(messages[0].created_at).getTime()
        : 0
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    )
  }

  const analytics = getAnalytics()

  return (
    <Box>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Psychology color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Replay IA - Análise de Interações
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Reproduzir conversa">
            <IconButton
              onClick={isPlaying ? pausePlayback : startPlayback}
              color={isPlaying ? 'primary' : 'default'}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(e.target.value as number)}
              displayEmpty
            >
              <MenuItem value={0.5}>0.5x</MenuItem>
              <MenuItem value={1}>1x</MenuItem>
              <MenuItem value={2}>2x</MenuItem>
              <MenuItem value={5}>5x</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Exportar replay">
            <IconButton onClick={exportReplay}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{analytics.totalMessages}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Mensagens
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{analytics.aiMessages}</Typography>
              <Typography variant="body2" color="text.secondary">
                Respostas IA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{analytics.feedbackCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Feedbacks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">{analytics.avgRating.toFixed(1)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Avaliação Média
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Timeline de Mensagens */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Timeline da Conversa
          </Typography>
          
          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            <List>
              {messages.map((message, index) => (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.sender_type === 'user' ? 'flex-end' : 'flex-start',
                    p: 0,
                    mb: 2,
                    opacity: isPlaying && index > currentMessageIndex ? 0.3 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="flex-start"
                    gap={1}
                    maxWidth="80%"
                    sx={{
                      flexDirection: message.sender_type === 'user' ? 'row-reverse' : 'row'
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getMessageColor(message.sender_type),
                        width: 32,
                        height: 32
                      }}
                    >
                      {getMessageIcon(message.sender_type)}
                    </Avatar>
                    
                    <Box
                      sx={{
                        backgroundColor: message.sender_type === 'user' ? 'primary.main' : 'white',
                        color: message.sender_type === 'user' ? 'white' : 'text.primary',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                        maxWidth: '100%',
                        border: message.feedback ? '2px solid' : 'none',
                        borderColor: getFeedbackColor(message.feedback?.feedback_type || 'default')
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" fontWeight="bold">
                          {message.sender_name || (message.sender_type === 'ai' ? 'IA Assistente' : 'Sistema')}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(message.created_at)}
                        </Typography>
                        
                        {message.feedback && (
                          <Chip
                            icon={getFeedbackIcon(message.feedback.feedback_type)}
                            label={message.feedback.feedback_type}
                            size="small"
                            color={getFeedbackColor(message.feedback.feedback_type) as any}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      
                      {message.feedback && (
                        <Box mt={1}>
                          <Rating value={message.feedback.rating} readOnly size="small" />
                          {message.feedback.comments && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {message.feedback.comments}
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {!readOnly && message.sender_type === 'ai' && (
                        <Box display="flex" gap={0.5} mt={1}>
                          <Tooltip title="Marcar como útil">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedMessage(message)
                                setFeedbackData({ rating: 5, feedback_type: 'useful', comments: '' })
                                setShowFeedbackDialog(true)
                              }}
                            >
                              <ThumbUp />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Marcar como erro">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedMessage(message)
                                setFeedbackData({ rating: 1, feedback_type: 'error', comments: '' })
                                setShowFeedbackDialog(true)
                              }}
                            >
                              <ThumbDown />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Necessita revisão">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedMessage(message)
                                setFeedbackData({ rating: 3, feedback_type: 'needs_review', comments: '' })
                                setShowFeedbackDialog(true)
                              }}
                            >
                              <Flag />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de Feedback */}
      <Dialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Avaliar Resposta da IA
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Avaliação (1-5):
              </Typography>
              <Rating
                value={feedbackData.rating}
                onChange={(_, value) => setFeedbackData(prev => ({ ...prev, rating: value || 0 }))}
                size="large"
              />
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Tipo de Feedback</InputLabel>
              <Select
                value={feedbackData.feedback_type}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback_type: e.target.value as any }))}
                label="Tipo de Feedback"
              >
                <MenuItem value="useful">Útil</MenuItem>
                <MenuItem value="error">Erro</MenuItem>
                <MenuItem value="needs_review">Necessita Revisão</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Comentários (opcional)"
              value={feedbackData.comments}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={saveFeedback}
            variant="contained"
            disabled={feedbackData.rating === 0}
          >
            Salvar Avaliação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 