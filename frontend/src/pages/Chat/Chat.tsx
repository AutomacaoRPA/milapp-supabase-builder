import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  CameraAlt as CameraIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  VideoCall as VideoIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useConversations } from '../../hooks/useConversations';
import { useProjects } from '../../hooks/useProjects';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'document' | 'audio' | 'video';
    name: string;
    url: string;
  }>;
  metadata?: {
    project_id?: string;
    requirements_extracted?: boolean;
    confidence_score?: number;
  };
}

interface ChatAnalysis {
  summary: string;
  requirements: Array<{
    type: string;
    name: string;
    description: string;
    complexity: string;
    priority: string;
  }>;
  recommended_tools: string[];
  estimated_roi: string;
  next_steps: string[];
}

const Chat: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { projects } = useProjects();
  const { createConversation, sendMessage, analyzeConversation } = useConversations();

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar conversa com mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Olá! Sou o assistente IA do MILAPP. Posso ajudar você com:

🤖 **Descoberta de Automações**
📋 **Levantamento de Requisitos**
📊 **Análise de Processos**
🛠️ **Recomendação de Ferramentas**
📈 **Estimativas de ROI**

Como posso ajudar você hoje?`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      attachments: attachments.map(file => ({
        type: getFileType(file),
        name: file.name,
        url: URL.createObjectURL(file),
      })),
      metadata: {
        project_id: selectedProject,
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Simular resposta da IA
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(inputValue, attachments),
          sender: 'ai',
          timestamp: new Date(),
          metadata: {
            project_id: selectedProject,
            requirements_extracted: attachments.length > 0,
            confidence_score: 0.85,
          },
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string, files: File[]): string => {
    const responses = [
      "Entendi sua solicitação! Vou analisar os requisitos e sugerir a melhor abordagem para automação.",
      "Excelente! Baseado no que você descreveu, posso identificar várias oportunidades de automação.",
      "Vou processar as informações fornecidas e extrair os requisitos técnicos necessários.",
      "Perfeito! Identifiquei alguns pontos importantes para o desenvolvimento da automação.",
    ];
    
    if (files.length > 0) {
      return `Processei ${files.length} arquivo(s) enviado(s). ${responses[Math.floor(Math.random() * responses.length)]}`;
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getFileType = (file: File): 'image' | 'document' | 'audio' | 'video' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleAnalyzeConversation = async () => {
    setIsLoading(true);
    try {
      // Simular análise da conversa
      setTimeout(() => {
        const mockAnalysis: ChatAnalysis = {
          summary: "Análise completa da conversa sobre automação de processos financeiros",
          requirements: [
            {
              type: "process",
              name: "Conciliação bancária",
              description: "Processo de conciliação de extratos bancários",
              complexity: "medium",
              priority: "high"
            },
            {
              type: "integration",
              name: "SAP ERP",
              description: "Integração com sistema SAP",
              complexity: "high",
              priority: "medium"
            }
          ],
          recommended_tools: ["n8n", "Python", "Selenium"],
          estimated_roi: "300%",
          next_steps: [
            "Criar PDD detalhado",
            "Definir escopo técnico",
            "Iniciar desenvolvimento"
          ]
        };
        setAnalysis(mockAnalysis);
        setShowAnalysis(true);
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao analisar conversa:', error);
      setIsLoading(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Implementar gravação de áudio
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Implementar parada da gravação
  };

  const renderMessage = (message: Message) => (
    <ListItem
      key={message.id}
      sx={{
        flexDirection: 'column',
        alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: '70%',
          flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          sx={{
            bgcolor: message.sender === 'ai' ? theme.palette.primary.main : theme.palette.secondary.main,
            mr: message.sender === 'user' ? 0 : 1,
            ml: message.sender === 'user' ? 1 : 0,
          }}
        >
          {message.sender === 'ai' ? <AIIcon /> : <PersonIcon />}
        </Avatar>
        
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: message.sender === 'user' ? theme.palette.primary.light : theme.palette.grey[100],
            color: message.sender === 'user' ? 'white' : 'inherit',
            borderRadius: 2,
            maxWidth: '100%',
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {message.attachments.map((attachment, index) => (
                <Chip
                  key={index}
                  icon={getAttachmentIcon(attachment.type)}
                  label={attachment.name}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          )}
          
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </Paper>
      </Box>
    </ListItem>
  );

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon />;
      case 'document': return <DocumentIcon />;
      case 'audio': return <MicIcon />;
      case 'video': return <VideoIcon />;
      default: return <AttachFileIcon />;
    }
  };

  const speedDialActions = [
    { icon: <AttachFileIcon />, name: 'Anexar Arquivo', action: () => fileInputRef.current?.click() },
    { icon: <CameraIcon />, name: 'Câmera', action: () => {/* Implementar câmera */} },
    { icon: <MicIcon />, name: 'Gravar Áudio', action: isRecording ? handleStopRecording : handleStartRecording },
    { icon: <RefreshIcon />, name: 'Analisar Conversa', action: handleAnalyzeConversation },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Chat IA - MILAPP</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAnalyzeConversation}
              disabled={messages.length <= 1}
            >
              Analisar Conversa
            </Button>
            
            <IconButton size="small">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List sx={{ p: 0 }}>
          {messages.map(renderMessage)}
          
          {isLoading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                IA está processando...
              </Typography>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Paper elevation={1} sx={{ p: 1, mx: 2, mb: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Arquivos anexados:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                size="small"
                onDelete={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Input Area */}
      <Paper elevation={2} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua mensagem ou descreva o processo que deseja automatizar..."
            variant="outlined"
            size="small"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Speed Dial for Mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Ações do chat"
          sx={{ position: 'absolute', bottom: 80, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.action}
            />
          ))}
        </SpeedDial>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp3,.mp4"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Analysis Dialog */}
      <Dialog
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Análise da Conversa</DialogTitle>
        <DialogContent>
          {analysis && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resumo
                    </Typography>
                    <Typography variant="body2">
                      {analysis.summary}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Requisitos Identificados
                    </Typography>
                    {analysis.requirements.map((req, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">{req.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {req.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip label={req.complexity} size="small" />
                          <Chip label={req.priority} size="small" />
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recomendações
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Ferramentas Recomendadas:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {analysis.recommended_tools.map((tool, index) => (
                        <Chip key={index} label={tool} size="small" />
                      ))}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      ROI Estimado: {analysis.estimated_roi}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Próximos Passos:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {analysis.next_steps.map((step, index) => (
                        <li key={index}>
                          <Typography variant="body2">{step}</Typography>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysis(false)}>Fechar</Button>
          <Button variant="contained" onClick={() => {/* Implementar criação de projeto */}}>
            Criar Projeto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat; 