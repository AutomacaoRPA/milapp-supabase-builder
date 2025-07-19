import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup
} from '@mui/material'
import {
  Email,
  Chat,
  Phone,
  PictureAsPdf,
  TableChart,
  Send,
  Schedule,
  History,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info,
  MoreVert,
  Share,
  Bookmark,
  BookmarkBorder,
  Code,
  Description,
  FileDownload,
  PictureAsPdf as PdfIcon,
  TableView,
  ShowChart,
  Notifications,
  NotificationsOff,
  AccessTime,
  CalendarToday,
  Group,
  Person,
  Business,
  Security,
  Speed,
  Visibility,
  AutoAwesome,
  Timeline,
  Analytics,
  Business as BusinessIcon,
  AttachMoney,
  People,
  Notifications as NotificationsIcon,
  Assessment,
  Policy,
  Compliance,
  Build,
  Support,
  Storage,
  NetworkCheck,
  Computer,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon
} from '@mui/icons-material'
import { multiChannelDeliveryService } from '../../services/delivery/MultiChannelDeliveryService'

interface DeliveryChannel {
  id: string
  name: string
  type: 'email' | 'teams' | 'whatsapp' | 'pdf' | 'csv'
  icon: React.ReactNode
  color: string
  description: string
}

interface DeliveryRequest {
  reportId: string
  channels: string[]
  format: 'pdf' | 'csv' | 'markdown' | 'html'
  recipients: string[]
  title: string
  content: string
  data?: any[]
  metadata?: any
  schedule?: {
    enabled: boolean
    date: string
    time: string
    frequency: 'once' | 'daily' | 'weekly' | 'monthly'
  }
}

interface DeliveryResult {
  success: boolean
  channel: string
  message: string
  timestamp: string
  error?: string
}

export function RelatorioSendOptions({ 
  reportData, 
  reportTitle, 
  onDeliveryComplete 
}: {
  reportData: any[]
  reportTitle: string
  onDeliveryComplete?: (results: DeliveryResult[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de configuração
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf')
  const [recipients, setRecipients] = useState<string[]>([])
  const [deliveryTitle, setDeliveryTitle] = useState('')
  const [deliveryMessage, setDeliveryMessage] = useState('')
  
  // Estados de agendamento
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleFrequency, setScheduleFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once')
  
  // Estados de UI
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [deliveryResults, setDeliveryResults] = useState<DeliveryResult[]>([])

  const deliveryChannels: DeliveryChannel[] = [
    {
      id: 'email',
      name: 'Email',
      type: 'email',
      icon: <Email />,
      color: '#1976d2',
      description: 'Enviar relatório por email'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      type: 'teams',
      icon: <Chat />,
      color: '#6264a7',
      description: 'Enviar para canal do Teams'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      type: 'whatsapp',
      icon: <Phone />,
      color: '#25d366',
      description: 'Enviar via WhatsApp Business'
    },
    {
      id: 'pdf',
      name: 'PDF',
      type: 'pdf',
      icon: <PdfIcon />,
      color: '#f44336',
      description: 'Gerar e baixar PDF'
    },
    {
      id: 'csv',
      name: 'CSV',
      type: 'csv',
      icon: <TableView />,
      color: '#4caf50',
      description: 'Gerar e baixar CSV'
    }
  ]

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const handleRecipientChange = (value: string) => {
    const emails = value.split(',').map(email => email.trim()).filter(email => email)
    setRecipients(emails)
  }

  const sendDelivery = async () => {
    if (selectedChannels.length === 0) {
      setError('Selecione pelo menos um canal de entrega')
      return
    }

    if (selectedChannels.includes('email') && recipients.length === 0) {
      setError('Para envio por email, informe pelo menos um destinatário')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const deliveryRequest: DeliveryRequest = {
        reportId: `report_${Date.now()}`,
        channels: selectedChannels,
        format: exportFormat,
        recipients,
        title: deliveryTitle || reportTitle,
        content: deliveryMessage || `Relatório: ${reportTitle}`,
        data: reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalRecords: reportData.length
        },
        schedule: scheduleEnabled ? {
          enabled: true,
          date: scheduleDate,
          time: scheduleTime,
          frequency: scheduleFrequency
        } : undefined
      }

      const results = await multiChannelDeliveryService.processDelivery(deliveryRequest)
      setDeliveryResults(results)

      const successCount = results.filter(r => r.success).length
      const totalCount = results.length

      if (successCount === totalCount) {
        setSuccess(`Relatório enviado com sucesso por ${totalCount} canal(is)!`)
      } else if (successCount > 0) {
        setSuccess(`Relatório enviado com sucesso por ${successCount} de ${totalCount} canal(is)`)
      } else {
        setError('Falha no envio por todos os canais selecionados')
      }

      setDeliveryDialogOpen(false)
      onDeliveryComplete?.(results)

    } catch (error) {
      console.error('❌ Erro ao enviar relatório:', error)
      setError('Erro ao enviar relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (channelId: string) => {
    const channel = deliveryChannels.find(c => c.id === channelId)
    return channel?.icon || <Info />
  }

  const getChannelColor = (channelId: string) => {
    const channel = deliveryChannels.find(c => c.id === channelId)
    return channel?.color || '#666'
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle color="success" /> : <Error color="error" />
  }

  return (
    <Box>
      {/* Botão de Abertura */}
      <Button
        variant="contained"
        startIcon={<Send />}
        onClick={() => setDeliveryDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Enviar Relatório
      </Button>

      {/* Dialog de Configuração de Envio */}
      <Dialog
        open={deliveryDialogOpen}
        onClose={() => setDeliveryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Enviar Relatório
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Configure como e para onde enviar o relatório
          </Typography>
          
          {/* Canais de Entrega */}
          <Typography variant="h6" gutterBottom>
            Canais de Entrega
          </Typography>
          
          <Grid container spacing={2} mb={3}>
            {deliveryChannels.map((channel) => (
              <Grid item xs={12} sm={6} md={4} key={channel.id}>
                <Card
                  variant={selectedChannels.includes(channel.id) ? "elevation" : "outlined"}
                  sx={{
                    cursor: 'pointer',
                    borderColor: selectedChannels.includes(channel.id) ? channel.color : undefined,
                    '&:hover': { borderColor: channel.color }
                  }}
                  onClick={() => handleChannelToggle(channel.id)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ color: channel.color, mb: 1 }}>
                      {channel.icon}
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {channel.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {channel.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Configurações de Envio */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título do Relatório"
                value={deliveryTitle}
                onChange={(e) => setDeliveryTitle(e.target.value)}
                placeholder={reportTitle}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mensagem Acompanhante"
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
                placeholder="Descreva o conteúdo do relatório..."
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Formato de Exportação</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv')}
                  label="Formato de Exportação"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destinatários (separados por vírgula)"
                value={recipients.join(', ')}
                onChange={(e) => handleRecipientChange(e.target.value)}
                placeholder="email1@empresa.com, email2@empresa.com"
                variant="outlined"
                helperText="Obrigatório para envio por email"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Agendamento */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={2}>
                <Schedule />
                <Typography variant="h6">
                  Agendamento
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={scheduleEnabled}
                      onChange={(e) => setScheduleEnabled(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label="Agendar envio"
                />
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              {scheduleEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Hora"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Frequência</InputLabel>
                      <Select
                        value={scheduleFrequency}
                        onChange={(e) => setScheduleFrequency(e.target.value as any)}
                        label="Frequência"
                      >
                        <MenuItem value="once">Uma vez</MenuItem>
                        <MenuItem value="daily">Diário</MenuItem>
                        <MenuItem value="weekly">Semanal</MenuItem>
                        <MenuItem value="monthly">Mensal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDeliveryDialogOpen(false)}>
            Cancelar
          </Button>
          
          <Button
            variant="contained"
            onClick={sendDelivery}
            disabled={loading || selectedChannels.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Resultados */}
      {deliveryResults.length > 0 && (
        <Dialog
          open={deliveryResults.length > 0}
          onClose={() => setDeliveryResults([])}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Resultado do Envio
          </DialogTitle>
          <DialogContent>
            <List>
              {deliveryResults.map((result, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {getStatusIcon(result.success)}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.channel}
                    secondary={result.message}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeliveryResults([])}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      )}

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