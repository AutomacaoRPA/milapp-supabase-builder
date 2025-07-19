import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
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
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab
} from '@mui/material'
import {
  Settings,
  Security,
  Key,
  Webhook,
  People,
  Lock,
  Visibility,
  VisibilityOff,
  Refresh,
  Save,
  Delete,
  Add,
  Edit,
  CheckCircle,
  Warning,
  Error,
  Info,
  History,
  ExpandMore,
  MoreVert,
  Share,
  Bookmark,
  BookmarkBorder,
  Code,
  Description,
  FileDownload,
  PictureAsPdf,
  TableView,
  ShowChart,
  Notifications,
  NotificationsOff,
  AccessTime,
  CalendarToday,
  Group,
  Person,
  Business,
  Security as SecurityIcon,
  Speed,
  Visibility as VisibilityIcon,
  AutoAwesome,
  Timeline,
  Analytics,
  Business as BusinessIcon,
  AttachMoney,
  People as PeopleIcon,
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
  Chat as ChatIcon,
  QrCode,
  Smartphone,
  VpnKey,
  AdminPanelSettings,
  SupervisedUserCircle,
  VerifiedUser,
  Block,
  Unblock
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import QRCode from 'qrcode'

interface ApiConfig {
  id: string
  name: string
  type: 'openai' | 'twilio' | 'teams' | 'email' | 'other'
  apiKey: string
  endpoint?: string
  isActive: boolean
  lastTested: string
  created_at: string
}

interface UserSecurity {
  id: string
  email: string
  is_2fa_enabled: boolean
  last_login: string
  failed_attempts: number
  is_locked: boolean
  permissions: string[]
}

interface SecurityLog {
  id: string
  user_email: string
  action: string
  ip_address: string
  success: boolean
  timestamp: string
  details: string
}

interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  isActive: boolean
}

export function Configuracoes() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de abas
  const [activeTab, setActiveTab] = useState(0)
  
  // Estados de APIs
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([])
  const [apiDialogOpen, setApiDialogOpen] = useState(false)
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null)
  
  // Estados de usuários
  const [users, setUsers] = useState<UserSecurity[]>([])
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserSecurity | null>(null)
  
  // Estados de 2FA
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [twoFASecret, setTwoFASecret] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false)
  
  // Estados de logs
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados
      const mockApiConfigs: ApiConfig[] = [
        {
          id: '1',
          name: 'OpenAI GPT-4',
          type: 'openai',
          apiKey: 'sk-***hidden***',
          endpoint: 'https://api.openai.com/v1',
          isActive: true,
          lastTested: '2024-01-15T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Twilio WhatsApp',
          type: 'twilio',
          apiKey: 'AC***hidden***',
          endpoint: 'https://api.twilio.com',
          isActive: true,
          lastTested: '2024-01-15T09:15:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Microsoft Teams',
          type: 'teams',
          apiKey: 'webhook***hidden***',
          endpoint: 'https://webhook.office.com',
          isActive: false,
          lastTested: '2024-01-10T14:20:00Z',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      const mockUsers: UserSecurity[] = [
        {
          id: '1',
          email: 'admin@empresa.com',
          is_2fa_enabled: true,
          last_login: '2024-01-15T10:30:00Z',
          failed_attempts: 0,
          is_locked: false,
          permissions: ['admin', 'security', 'reports']
        },
        {
          id: '2',
          email: 'user1@empresa.com',
          is_2fa_enabled: false,
          last_login: '2024-01-15T09:15:00Z',
          failed_attempts: 2,
          is_locked: false,
          permissions: ['reports', 'projects']
        },
        {
          id: '3',
          email: 'user2@empresa.com',
          is_2fa_enabled: true,
          last_login: '2024-01-14T16:45:00Z',
          failed_attempts: 5,
          is_locked: true,
          permissions: ['basic']
        }
      ]

      const mockSecurityLogs: SecurityLog[] = [
        {
          id: '1',
          user_email: 'admin@empresa.com',
          action: 'login',
          ip_address: '192.168.1.100',
          success: true,
          timestamp: '2024-01-15T10:30:00Z',
          details: 'Login bem-sucedido com 2FA'
        },
        {
          id: '2',
          user_email: 'user1@empresa.com',
          action: 'login_failed',
          ip_address: '192.168.1.101',
          success: false,
          timestamp: '2024-01-15T09:15:00Z',
          details: 'Senha incorreta'
        },
        {
          id: '3',
          user_email: 'user2@empresa.com',
          action: '2fa_enabled',
          ip_address: '192.168.1.102',
          success: true,
          timestamp: '2024-01-14T16:45:00Z',
          details: '2FA ativado com sucesso'
        }
      ]

      const mockPermissions: Permission[] = [
        {
          id: '1',
          name: 'Administrador',
          description: 'Acesso completo ao sistema',
          resource: 'all',
          action: 'all',
          isActive: true
        },
        {
          id: '2',
          name: 'Relatórios',
          description: 'Visualizar e gerar relatórios',
          resource: 'reports',
          action: 'read',
          isActive: true
        },
        {
          id: '3',
          name: 'Segurança',
          description: 'Gerenciar configurações de segurança',
          resource: 'security',
          action: 'admin',
          isActive: true
        },
        {
          id: '4',
          name: 'Projetos',
          description: 'Gerenciar projetos',
          resource: 'projects',
          action: 'write',
          isActive: true
        }
      ]

      setApiConfigs(mockApiConfigs)
      setUsers(mockUsers)
      setSecurityLogs(mockSecurityLogs)
      setPermissions(mockPermissions)

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const saveApiConfig = async (config: Partial<ApiConfig>) => {
    try {
      setLoading(true)
      
      if (editingApi) {
        // Atualizar API existente
        const updated = apiConfigs.map(api => 
          api.id === editingApi.id ? { ...api, ...config } : api
        )
        setApiConfigs(updated)
        setSuccess('API atualizada com sucesso!')
      } else {
        // Adicionar nova API
        const newApi: ApiConfig = {
          id: Date.now().toString(),
          name: config.name || '',
          type: config.type as any,
          apiKey: config.apiKey || '',
          endpoint: config.endpoint,
          isActive: config.isActive || false,
          lastTested: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
        setApiConfigs([...apiConfigs, newApi])
        setSuccess('API adicionada com sucesso!')
      }
      
      setApiDialogOpen(false)
      setEditingApi(null)
    } catch (error) {
      console.error('❌ Erro ao salvar API:', error)
      setError('Erro ao salvar configuração da API')
    } finally {
      setLoading(false)
    }
  }

  const testApiConnection = async (apiId: string) => {
    try {
      setLoading(true)
      
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const updated = apiConfigs.map(api => 
        api.id === apiId 
          ? { ...api, lastTested: new Date().toISOString() }
          : api
      )
      setApiConfigs(updated)
      
      setSuccess('Teste de conexão realizado com sucesso!')
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error)
      setError('Erro no teste de conexão')
    } finally {
      setLoading(false)
    }
  }

  const deleteApiConfig = async (apiId: string) => {
    try {
      const updated = apiConfigs.filter(api => api.id !== apiId)
      setApiConfigs(updated)
      setSuccess('API removida com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao remover API:', error)
      setError('Erro ao remover API')
    }
  }

  const enable2FA = async (userId: string) => {
    try {
      setLoading(true)
      
      // Simular geração de secret 2FA
      const secret = 'JBSWY3DPEHPK3PXP' // Secret de exemplo
      setTwoFASecret(secret)
      
      // Gerar QR Code
      const qrCodeData = `otpauth://totp/MILAPP:${users.find(u => u.id === userId)?.email}?secret=${secret}&issuer=MILAPP`
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData)
      setQrCodeUrl(qrCodeUrl)
      
      setSelectedUser(users.find(u => u.id === userId) || null)
      setTwoFADialogOpen(true)
      
    } catch (error) {
      console.error('❌ Erro ao ativar 2FA:', error)
      setError('Erro ao ativar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const verify2FACode = async () => {
    try {
      setLoading(true)
      
      // Simular verificação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (twoFACode === '123456') { // Código de exemplo
        const updated = users.map(user => 
          user.id === selectedUser?.id 
            ? { ...user, is_2fa_enabled: true }
            : user
        )
        setUsers(updated)
        setTwoFADialogOpen(false)
        setSuccess('2FA ativado com sucesso!')
      } else {
        setError('Código 2FA inválido')
      }
    } catch (error) {
      console.error('❌ Erro na verificação 2FA:', error)
      setError('Erro na verificação 2FA')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserLock = async (userId: string) => {
    try {
      const updated = users.map(user => 
        user.id === userId 
          ? { ...user, is_locked: !user.is_locked, failed_attempts: 0 }
          : user
      )
      setUsers(updated)
      setSuccess('Status do usuário atualizado!')
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error)
      setError('Erro ao alterar status do usuário')
    }
  }

  const resetUserPassword = async (userId: string) => {
    try {
      setLoading(true)
      
      // Simular reset de senha
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Senha resetada com sucesso! Email enviado para o usuário.')
    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error)
      setError('Erro ao resetar senha')
    } finally {
      setLoading(false)
    }
  }

  const getApiIcon = (type: string) => {
    switch (type) {
      case 'openai': return <AutoAwesome />
      case 'twilio': return <PhoneIcon />
      case 'teams': return <ChatIcon />
      case 'email': return <EmailIcon />
      default: return <Code />
    }
  }

  const getApiColor = (type: string) => {
    switch (type) {
      case 'openai': return '#10a37f'
      case 'twilio': return '#f22f46'
      case 'teams': return '#6264a7'
      case 'email': return '#1976d2'
      default: return '#666'
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle color="success" /> : <Error color="error" />
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <AdminPanelSettings sx={{ mr: 1, verticalAlign: 'middle' }} />
          Configurações Administrativas
        </Typography>
        
        <Box display="flex" gap={2}>
          <Tooltip title="Recarregar">
            <IconButton onClick={loadData}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="APIs e Integrações" icon={<Key />} />
          <Tab label="Usuários e Segurança" icon={<People />} />
          <Tab label="Logs de Segurança" icon={<Security />} />
          <Tab label="Permissões" icon={<Policy />} />
        </Tabs>
      </Box>

      {/* Tab APIs e Integrações */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Configurações de APIs
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingApi(null)
                setApiDialogOpen(true)
              }}
            >
              Adicionar API
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {apiConfigs.map((api) => (
              <Grid item xs={12} md={6} lg={4} key={api.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: getApiColor(api.type) }}>
                          {getApiIcon(api.type)}
                        </Box>
                        <Typography variant="h6">
                          {api.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={api.isActive ? 'Ativo' : 'Inativo'}
                        color={api.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {api.endpoint}
                    </Typography>
                    
                    <Typography variant="caption" color="textSecondary">
                      Último teste: {new Date(api.lastTested).toLocaleString()}
                    </Typography>
                    
                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => testApiConnection(api.id)}
                        disabled={loading}
                      >
                        Testar
                      </Button>
                      
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditingApi(api)
                          setApiDialogOpen(true)
                        }}
                      >
                        Editar
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => deleteApiConfig(api.id)}
                      >
                        Remover
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab Usuários e Segurança */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Gerenciamento de Usuários
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Último Login</TableCell>
                  <TableCell>Tentativas Falhadas</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Permissões</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_2fa_enabled ? 'Ativo' : 'Inativo'}
                        color={user.is_2fa_enabled ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.last_login).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.failed_attempts}
                        color={user.failed_attempts > 3 ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_locked ? 'Bloqueado' : 'Ativo'}
                        color={user.is_locked ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {user.permissions.map((perm) => (
                          <Chip
                            key={perm}
                            label={perm}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {!user.is_2fa_enabled && (
                          <Tooltip title="Ativar 2FA">
                            <IconButton
                              size="small"
                              onClick={() => enable2FA(user.id)}
                            >
                              <VpnKey />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title={user.is_locked ? 'Desbloquear' : 'Bloquear'}>
                          <IconButton
                            size="small"
                            onClick={() => toggleUserLock(user.id)}
                          >
                            {user.is_locked ? <Unblock /> : <Block />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Resetar Senha">
                          <IconButton
                            size="small"
                            onClick={() => resetUserPassword(user.id)}
                          >
                            <Lock />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab Logs de Segurança */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Logs de Segurança
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Ação</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {log.user_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {log.ip_address}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(log.success)}
                        <Typography variant="body2">
                          {log.success ? 'Sucesso' : 'Falha'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {log.details}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab Permissões */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Gerenciamento de Permissões
          </Typography>
          
          <Grid container spacing={3}>
            {permissions.map((permission) => (
              <Grid item xs={12} md={6} lg={4} key={permission.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {permission.name}
                      </Typography>
                      <Switch
                        checked={permission.isActive}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {permission.description}
                    </Typography>
                    
                    <Box display="flex" gap={1}>
                      <Chip
                        label={permission.resource}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={permission.action}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Dialog de API */}
      <Dialog
        open={apiDialogOpen}
        onClose={() => setApiDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingApi ? 'Editar API' : 'Adicionar API'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da API"
                defaultValue={editingApi?.name}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  defaultValue={editingApi?.type || 'other'}
                  label="Tipo"
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="twilio">Twilio</MenuItem>
                  <MenuItem value="teams">Microsoft Teams</MenuItem>
                  <MenuItem value="email">Email SMTP</MenuItem>
                  <MenuItem value="other">Outro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                defaultValue={editingApi?.apiKey}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endpoint (Opcional)"
                defaultValue={editingApi?.endpoint}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={editingApi?.isActive || false}
                  />
                }
                label="API Ativa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => saveApiConfig({})}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de 2FA */}
      <Dialog
        open={twoFADialogOpen}
        onClose={() => setTwoFADialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ativar Autenticação em Dois Fatores
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <Typography variant="body1" gutterBottom>
              Escaneie o QR Code com seu aplicativo de autenticação:
            </Typography>
            
            {qrCodeUrl && (
              <Box my={2}>
                <img src={qrCodeUrl} alt="QR Code 2FA" style={{ maxWidth: '200px' }} />
              </Box>
            )}
            
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Ou digite manualmente: <code>{twoFASecret}</code>
            </Typography>
            
            <TextField
              fullWidth
              label="Código de Verificação"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              placeholder="123456"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFADialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={verify2FACode}
            disabled={loading || !twoFACode}
          >
            {loading ? 'Verificando...' : 'Verificar e Ativar'}
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