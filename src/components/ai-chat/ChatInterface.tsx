import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: File[];
  workItems?: WorkItemSuggestion[];
}

interface WorkItemSuggestion {
  title: string;
  description: string;
  type: 'user_story' | 'bug' | 'task' | 'epic' | 'spike';
  priority: 'low' | 'medium' | 'high' | 'critical';
  storyPoints?: number;
}

interface ChatInterfaceProps {
  projectId?: string;
  onWorkItemsCreated?: (workItems: WorkItemSuggestion[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  projectId, 
  onWorkItemsCreated 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
      attachments: [...attachments],
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Preparar dados para envio
      const formData = new FormData();
      formData.append('message', JSON.stringify({
        content: inputValue,
        role: 'user',
        project_id: projectId,
      }));

      // Adicionar arquivos
      attachments.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Enviar para backend
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com IA');
      }

      const data = await response.json();

      // Criar mensagem da IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        workItems: data.work_items || [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Notificar work items criados
      if (data.work_items && data.work_items.length > 0) {
        onWorkItemsCreated?.(data.work_items);
        toast({
          title: "Work Items Criados",
          description: `${data.work_items.length} work items foram criados baseados na conversa`,
        });
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gravar áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      // Implementar gravação de áudio
      // const mediaRecorder = new MediaRecorder(stream);
      // const chunks: Blob[] = [];
      
      // mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      // mediaRecorder.onstop = async () => {
      //   const audioBlob = new Blob(chunks, { type: 'audio/wav' });
      //   const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
      //   setAttachments(prev => [...prev, audioFile]);
      // };
      
      // mediaRecorder.start();
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Implementar parada da gravação
  };

  // Função para selecionar arquivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setFileDialogOpen(true);
  };

  const confirmFileSelection = () => {
    setAttachments(prev => [...prev, ...selectedFiles]);
    setSelectedFiles([]);
    setFileDialogOpen(false);
  };

  // Função para remover anexo
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Função para criar work item
  const createWorkItem = async (suggestion: WorkItemSuggestion) => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/work-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(suggestion),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Work item criado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao criar work item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o work item",
        variant: "destructive",
      });
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold">
          Discovery IA - Chat Multimodal
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Analise requisitos, faça upload de arquivos e gere work items automaticamente
        </Typography>
      </Paper>

      {/* Mensagens */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '70%',
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    AI
                  </Avatar>
                )}
                
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>

                  {/* Anexos */}
                  {message.attachments && message.attachments.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {message.attachments.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Work Items Sugeridos */}
                  {message.workItems && message.workItems.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
                        Work Items Sugeridos:
                      </Typography>
                      {message.workItems.map((item, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 1,
                            mb: 1,
                            border: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.description}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={item.type}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={item.priority}
                              size="small"
                              color={item.priority === 'high' ? 'error' : 'default'}
                            />
                            {item.storyPoints && (
                              <Chip
                                label={`${item.storyPoints} SP`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => createWorkItem(item)}
                            >
                              Criar
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}

                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>

                {message.role === 'user' && (
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                    U
                  </Avatar>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              IA está analisando...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Anexos */}
      {attachments.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight="bold" mb={1}>
            Anexos:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => removeAttachment(index)}
                deleteIcon={<CloseIcon />}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Descreva seus requisitos, faça perguntas ou analise documentos..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          
          <IconButton
            color="primary"
            onClick={sendMessage}
            disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
          >
            <SendIcon />
          </IconButton>
        </Box>

        {/* Botões de ação */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.png,.jpg,.jpeg,.mp3,.wav"
            style={{ display: 'none' }}
            id="file-input"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-input">
            <IconButton component="span" color="primary">
              <AttachFileIcon />
            </IconButton>
          </label>

          <IconButton
            color={isRecording ? 'error' : 'primary'}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
        </Box>
      </Paper>

      {/* Dialog para seleção de arquivos */}
      <Dialog open={fileDialogOpen} onClose={() => setFileDialogOpen(false)}>
        <DialogTitle>Selecionar Arquivos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Arquivos selecionados:
          </Typography>
          {selectedFiles.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmFileSelection} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatInterface; 