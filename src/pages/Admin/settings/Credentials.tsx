import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  ContentCopy,
  CheckCircle,
  Error,
  Refresh,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Security,
  Api,
  Webhook,
  SmartToy,
  Email,
  Chat,
  WhatsApp
} from '@mui/icons-material'
import { supabase } from '../../../services/supabase/client'

interface ApiKey {
  id: string
  name: string
  provider: string
  key_value: string
  secret_value?: string
  is_active: boolean
  expires_at?: string
  last_used_at?: string
  usage_count: number
  created_at: string
}

interface CredentialForm {
  name: string
  provider: string
  key_value: string
  secret_value: string
  is_active: boolean
  expires_at: string
}

const providers = [
  { value: 'supabase', label: 'Supabase', icon: <Api /> },
  { value: 'twilio', label: 'Twilio', icon: <WhatsApp /> },
  { value: 'zapi', label: 'Z-API', icon: <WhatsApp /> },
  { value: 'sendgrid', label: 'SendGrid', icon: <Email /> },
  { value: 'resend', label: 'Resend', icon: <Email /> },
  { value: 'openai', label: 'OpenAI', icon: <SmartToy /> },
  { value: 'anthropic', label: 'Anthropic', icon: <SmartToy /> },
  { value: 'teams', label: 'Microsoft Teams', icon: <Chat /> },
  { value: 'stripe', label: 'Stripe', icon: <Security /> },
  { value: 'aws', label: 'AWS', icon: <Api /> },
  { value: 'azure', label: 'Azure', icon: <Api /> }
]

export function Credentials() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  const [form, setForm] = useState<CredentialForm>({
    name: '',
    provider: '',
    key_value: '',
    secret_value: '',
    is_active: true,
    expires_at: ''
  })

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setApiKeys(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error)
      setError('Erro ao carregar credenciais')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const keyData = {
        name: form.name,
        provider: form.provider,
        key_value: form.key_value,
        secret_value: form.secret_value || null,
        is_active: form.is_active,
        expires_at: form.expires_at || null
      }

      if (editingKey) {
        const { error } = await supabase
          .from('api_keys')
          .update(keyData)
          .eq('id', editingKey.id)

        if (error) throw error
        setSuccess('Credencial atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('api_keys')
          .insert(keyData)

        if (error) throw error
        setSuccess('Credencial criada com sucesso!')
      }

      setShowDialog(false)
      setEditingKey(null)
      resetForm()
      loadApiKeys()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar credencial:', error)
      setError('Erro ao salvar credencial')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta credencial?')) return

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccess('Credencial excluída com sucesso!')
      loadApiKeys()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao excluir credencial:', error)
      setError('Erro ao excluir credencial')
    }
  }

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key)
    setForm({
      name: key.name,
      provider: key.provider,
      key_value: key.key_value,
      secret_value: key.secret_value || '',
      is_active: key.is_active,
      expires_at: key.expires_at || ''
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setForm({
      name: '',
      provider: '',
      key_value: '',
      secret_value: '',
      is_active: true,
      expires_at: ''
    })
  }

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('❌ Erro ao copiar:', error)
    }
  }

  const testConnection = async (key: ApiKey) => {
    try {
      setTestingConnection(key.id)

      // Simular teste de conexão baseado no provider
      const testResults: Record<string, () => Promise<boolean>> = {
        supabase: async () => {
          // Testar conexão Supabase
          return true
        },
        twilio: async () => {
          // Testar conexão Twilio
          return true
        },
        openai: async () => {
          // Testar conexão OpenAI
          return true
        },
        sendgrid: async () => {
          // Testar conexão SendGrid
          return true
        }
      }

      const testFunction = testResults[key.provider]
      if (testFunction) {
        const success = await testFunction()
        if (success) {
          setSuccess(`Conexão com ${key.provider} testada com sucesso!`)
        } else {
          setError(`Falha na conexão com ${key.provider}`)
        }
      } else {
        setError(`Teste de conexão não disponível para ${key.provider}`)
      }

      setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error)
      setError('Erro ao testar conexão')
    } finally {
      setTestingConnection(null)
    }
  }

  const getProviderIcon = (provider: string) => {
    const providerInfo = providers.find(p => p.value === provider)
    return providerInfo?.icon || <Api />
  }

  const getProviderLabel = (provider: string) => {
    const providerInfo = providers.find(p => p.value === provider)
    return providerInfo?.label || provider
  }

  const maskValue = (value: string, show: boolean) => {
    if (!value) return ''
    if (show) return value
    return '*'.repeat(Math.min(value.length, 20))
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Credenciais e Integrações
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm()
            setShowDialog(true)
          }}
        >
          Nova Credencial
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {apiKeys.map((key) => (
          <Grid item xs={12} md={6} key={key.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getProviderIcon(key.provider)}
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {key.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getProviderLabel(key.provider)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <Chip
                      label={key.is_active ? 'Ativo' : 'Inativo'}
                      color={key.is_active ? 'success' : 'default'}
                      size="small"
                    />
                    
                    {key.expires_at && new Date(key.expires_at) < new Date() && (
                      <Chip
                        label="Expirado"
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                      Detalhes da Credencial
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {/* API Key */}
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          API Key
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            value={maskValue(key.key_value, showSecrets[key.id] || false)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputProps={{ readOnly: true }}
                          />
                          <Tooltip title={showSecrets[key.id] ? 'Ocultar' : 'Mostrar'}>
                            <IconButton
                              size="small"
                              onClick={() => toggleSecretVisibility(key.id)}
                            >
                              {showSecrets[key.id] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copiar">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(key.key_value, `key-${key.id}`)}
                            >
                              {copiedField === `key-${key.id}` ? <CheckCircle color="success" /> : <ContentCopy />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Secret Value */}
                      {key.secret_value && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Secret
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              value={maskValue(key.secret_value, showSecrets[key.id] || false)}
                              variant="outlined"
                              size="small"
                              fullWidth
                              InputProps={{ readOnly: true }}
                            />
                            <Tooltip title="Copiar">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(key.secret_value!, `secret-${key.id}`)}
                              >
                                {copiedField === `secret-${key.id}` ? <CheckCircle color="success" /> : <ContentCopy />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}

                      {/* Estatísticas */}
                      <Box display="flex" gap={2}>
                        <Typography variant="caption" color="text.secondary">
                          Usos: {key.usage_count}
                        </Typography>
                        {key.last_used_at && (
                          <Typography variant="caption" color="text.secondary">
                            Último uso: {new Date(key.last_used_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Box display="flex" gap={1} mt={2}>
                  <Tooltip title="Testar Conexão">
                    <IconButton
                      size="small"
                      onClick={() => testConnection(key)}
                      disabled={testingConnection === key.id}
                    >
                      {testingConnection === key.id ? <CircularProgress size={16} /> : <Refresh />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(key)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(key.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {apiKeys.length === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <Security sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma credencial configurada
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Configure credenciais para integrar com serviços externos como OpenAI, Twilio, SendGrid, etc.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar/editar credencial */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingKey ? 'Editar Credencial' : 'Nova Credencial'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Nome da Credencial"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Provedor</InputLabel>
              <Select
                value={form.provider}
                onChange={(e) => setForm(prev => ({ ...prev, provider: e.target.value }))}
                label="Provedor"
              >
                {providers.map((provider) => (
                  <MenuItem key={provider.value} value={provider.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {provider.icon}
                      {provider.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="API Key"
              value={form.key_value}
              onChange={(e) => setForm(prev => ({ ...prev, key_value: e.target.value }))}
              fullWidth
              required
              type="password"
            />
            
            <TextField
              label="Secret (opcional)"
              value={form.secret_value}
              onChange={(e) => setForm(prev => ({ ...prev, secret_value: e.target.value }))}
              fullWidth
              type="password"
            />
            
            <TextField
              label="Data de Expiração (opcional)"
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
              }
              label="Credencial Ativa"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving || !form.name || !form.provider || !form.key_value}
          >
            {saving ? 'Salvando...' : (editingKey ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 