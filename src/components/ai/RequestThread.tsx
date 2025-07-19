import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment
} from '@mui/material'
import {
  Send,
  SmartToy,
  Person,
  Settings,
  Refresh,
  ExpandMore,
  ExpandLess,
  AttachFile,
  Download,
  Share
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
}

interface RequestThreadProps {
  requestId: string
  onMessageSent?: (message: ThreadMessage) => void
  readOnly?: boolean
}

export function RequestThread({ requestId, onMessageSent, readOnly = false }: RequestThreadProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [threadInfo, setThreadInfo] = useState<any>(null)
  const [showContext, setShowContext] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (requestId) {
      loadThread()
    }
  }, [requestId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadThread = async () => {
    try {
      setLoading(true)

      // Carregar informações do thread
      const { data: threadData, error: threadError } = await supabase
        .from('request_threads')
        .select('*')
        .eq('request_id', requestId)
        .single()

      if (threadError) throw threadError
      setThreadInfo(threadData)

      // Carregar mensagens
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
          users!inner(name)
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
        sender_name: msg.users?.name
      }))

      setMessages(transformedMessages)

    } catch (error) {
      console.error('❌ Erro ao carregar thread:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Adicionar mensagem do usuário
      const { data: messageData, error: messageError } = await supabase
        .from('thread_messages')
        .insert({
          thread_id: threadInfo.id,
          sender_id: user.id,
          sender_type: 'user',
          content: newMessage,
          message_type: 'text'
        })
        .select()
        .single()

      if (messageError) throw messageError

      const userMessage: ThreadMessage = {
        id: messageData.id,
        sender_type: 'user',
        content: newMessage,
        message_type: 'text',
        attachments: [],
        metadata: {},
        created_at: messageData.created_at,
        sender_name: user.email
      }

      setMessages(prev => [...prev, userMessage])
      setNewMessage('')
      onMessageSent?.(userMessage)

      // Simular resposta da IA
      setTimeout(() => {
        generateAIResponse(newMessage)
      }, 1000)

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error)
    } finally {
      setSending(false)
    }
  }

  const generateAIResponse = async (userMessage: string) => {
    try {
      // Simular resposta da IA baseada no contexto da solicitação
      const aiResponses = [
        "Entendi sua solicitação. Vou analisar os requisitos e propor uma solução.",
        "Baseado no contexto do projeto, sugiro implementarmos essa funcionalidade usando as melhores práticas.",
        "Excelente pergunta! Vou verificar a documentação e retornar com informações detalhadas.",
        "Posso ajudar você com isso. Deixe-me buscar informações relevantes no histórico do projeto.",
        "Essa é uma consideração importante. Vou revisar o escopo e ajustar conforme necessário."
      ]

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
      
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('thread_messages')
        .insert({
          thread_id: threadInfo.id,
          sender_id: '00000000-0000-0000-0000-000000000000', // IA system user
          sender_type: 'ai',
          content: randomResponse,
          message_type: 'text',
          metadata: {
            ai_model: 'gpt-4',
            context: 'request_thread',
            confidence: 0.85
          }
        })
        .select()
        .single()

      if (aiMessageError) throw aiMessageError

      const aiMessage: ThreadMessage = {
        id: aiMessageData.id,
        sender_type: 'ai',
        content: randomResponse,
        message_type: 'text',
        attachments: [],
        metadata: aiMessageData.metadata,
        created_at: aiMessageData.created_at,
        sender_name: 'IA Assistente'
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('❌ Erro ao gerar resposta da IA:', error)
    }
  }

  const getMessageAvatar = (senderType: string) => {
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

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'file':
        return <AttachFile />
      case 'decision':
        return <Download />
      case 'approval':
        return <Share />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardContent>
        {/* Cabeçalho do Thread */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Conversa com IA
            </Typography>
            <Chip
              label={`${messages.length} mensagens`}
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Mostrar contexto">
              <IconButton
                size="small"
                onClick={() => setShowContext(!showContext)}
              >
                {showContext ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Atualizar">
              <IconButton
                size="small"
                onClick={loadThread}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Contexto da Solicitação */}
        {showContext && threadInfo && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Contexto:</strong> {threadInfo.context || 'Thread de conversa para esta solicitação'}
            </Typography>
            <Typography variant="caption" display="block" mt={1}>
              Criado em: {new Date(threadInfo.created_at).toLocaleDateString('pt-BR')}
            </Typography>
          </Alert>
        )}

        {/* Área de Mensagens */}
        <Paper
          variant="outlined"
          sx={{
            height: '400px',
            overflow: 'auto',
            p: 2,
            mb: 2,
            backgroundColor: 'grey.50'
          }}
        >
          {messages.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
              <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma mensagem ainda
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Inicie uma conversa com a IA para obter ajuda com sua solicitação.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map((message, index) => (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.sender_type === 'user' ? 'flex-end' : 'flex-start',
                    p: 0,
                    mb: 2
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
                      {getMessageAvatar(message.sender_type)}
                    </Avatar>
                    
                    <Box
                      sx={{
                        backgroundColor: message.sender_type === 'user' ? 'primary.main' : 'white',
                        color: message.sender_type === 'user' ? 'white' : 'text.primary',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1,
                        maxWidth: '100%'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="caption" fontWeight="bold">
                          {message.sender_name || (message.sender_type === 'ai' ? 'IA Assistente' : 'Sistema')}
                        </Typography>
                        
                        {getMessageTypeIcon(message.message_type) && (
                          <Tooltip title={message.message_type}>
                            {getMessageTypeIcon(message.message_type)}
                          </Tooltip>
                        )}
                      </Box>
                      
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      
                      <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                        {formatMessageTime(message.created_at)}
                      </Typography>
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <Box mt={1}>
                          {message.attachments.map((attachment, idx) => (
                            <Chip
                              key={idx}
                              label={attachment.name}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Paper>

        {/* Área de Input */}
        {!readOnly && (
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              multiline
              maxRows={3}
              disabled={sending}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {sending && <CircularProgress size={20} />}
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <Send />
            </Button>
          </Box>
        )}

        {/* Dicas de uso */}
        {messages.length === 0 && !readOnly && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Dicas:</strong> Você pode perguntar sobre o status da solicitação, 
              solicitar alterações, ou pedir ajuda com qualquer aspecto do projeto.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 