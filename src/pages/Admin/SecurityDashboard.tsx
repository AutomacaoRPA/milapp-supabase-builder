import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Avatar,
  Badge,
  AlertTitle,
  Snackbar
} from '@mui/material'
import {
  Security,
  Lock,
  Visibility,
  VisibilityOff,
  Refresh,
  Download,
  Warning,
  Error,
  Info,
  CheckCircle,
  Block,
  Person,
  Computer,
  LocationOn,
  Schedule,
  ExpandMore,
  QrCode,
  Key,
  Shield,
  BugReport,
  Timeline,
  Assessment,
  Settings,
  Delete,
  Edit,
  Add,
  Search,
  FilterList,
  Notifications,
  NotificationsActive,
  NotificationsOff
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface SecurityData {
  statistics: any
  activeAlerts: any[]
  suspiciousLogins: any[]
  activeSessions: any[]
  securityLogs: any[]
  user2FA: any[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export function SecurityDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SecurityData | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState('24')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any })

  // Estados para diálogos
  const [force2FADialog, setForce2FADialog] = useState(false)
  const [revokeSessionDialog, setRevokeSessionDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<any>(null)

  useEffect(() => {
    loadSecurityData()
  }, [selectedPeriod])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      setError(null)

      const periodHours = parseInt(selectedPeriod)

      // Carregar estatísticas de segurança
      const { data: statistics } = await supabase
        .from('security_statistics')
        .select('*')
        .single()

      // Carregar alertas ativos
      const { data: activeAlerts } = await supabase
        .from('active_security_alerts')
        .select('*')
        .order('created_at', { ascending: false })

      // Carregar tentativas suspeitas
      const { data: suspiciousLogins } = await supabase
        .from('suspicious_login_attempts')
        .select('*')
        .order('failed_attempts', { ascending: false })

      // Carregar sessões ativas
      const { data: activeSessions } = await supabase
        .from('active_sessions')
        .select('*')
        .order('last_activity_at', { ascending: false })

      // Carregar logs de segurança
      const { data: securityLogs } = await supabase
        .from('security_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      // Carregar usuários com 2FA
      const { data: user2FA } = await supabase
        .from('user_2fa')
        .select(`
          *,
          users (
            id,
            email,
            full_name
          )
        `)
        .eq('is_enabled', true)

      setData({
        statistics: statistics || {},
        activeAlerts: activeAlerts || [],
        suspiciousLogins: suspiciousLogins || [],
        activeSessions: activeSessions || [],
        securityLogs: securityLogs || [],
        user2FA: user2FA || []
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados de segurança:', error)
      setError('Erro ao carregar dados de segurança')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadSecurityData()
  }

  const handleForce2FA = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('user_2fa')
        .upsert({
          user_id: selectedUser.id,
          is_enabled: true,
          require_2fa_for_admin: true,
          require_2fa_for_sensitive_actions: true
        })

      if (error) throw error

      setSnackbar({
        open: true,
        message: '2FA forçado com sucesso',
        severity: 'success'
      })

      setForce2FADialog(false)
      loadSecurityData()
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao forçar 2FA',
        severity: 'error'
      })
    }
  }

  const handleRevokeSession = async () => {
    if (!selectedSession) return

    try {
      const { error } = await supabase.rpc('revoke_secure_session', {
        p_session_id: selectedSession.session_id,
        p_reason: 'Revogado pelo administrador'
      })

      if (error) throw error

      setSnackbar({
        open: true,
        message: 'Sessão revogada com sucesso',
        severity: 'success'
      })

      setRevokeSessionDialog(false)
      loadSecurityData()
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao revogar sessão',
        severity: 'error'
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getLogTypeIcon = (logType: string) => {
    switch (logType) {
      case 'login': return <CheckCircle color="success" />
      case 'login_failed': return <Error color="error" />
      case '2fa_verification': return <Lock color="primary" />
      case 'permission_denied': return <Block color="warning" />
      case 'session_created': return <Computer color="info" />
      case 'session_revoked': return <Delete color="error" />
      default: return <Info color="default" />
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard de Segurança
        </Typography>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="Período"
            >
              <MenuItem value="1">1 hora</MenuItem>
              <MenuItem value="24">24 horas</MenuItem>
              <MenuItem value="168">7 dias</MenuItem>
              <MenuItem value="720">30 dias</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => console.log('Exportar dados de segurança')}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Alertas Críticos */}
      {data?.activeAlerts.filter(alert => alert.severity === 'critical').length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Alertas Críticos</AlertTitle>
          {data.activeAlerts.filter(alert => alert.severity === 'critical').length} alerta(s) crítico(s) requerem atenção imediata.
        </Alert>
      )}

      {/* KPIs de Segurança */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" />
                <Typography variant="h6">
                  {data?.statistics.successful_logins || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Logins Bem-sucedidos
              </Typography>
              <Typography variant="caption">
                Últimas 24h
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Error color="error" />
                <Typography variant="h6">
                  {data?.statistics.failed_logins || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Logins Falhados
              </Typography>
              <Typography variant="caption">
                Últimas 24h
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Warning color="warning" />
                <Typography variant="h6">
                  {data?.activeAlerts.length || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Alertas Ativos
              </Typography>
              <Typography variant="caption">
                Requerem atenção
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Computer color="info" />
                <Typography variant="h6">
                  {data?.activeSessions.length || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Sessões Ativas
              </Typography>
              <Typography variant="caption">
                Usuários online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Visão Geral" icon={<Assessment />} />
          <Tab label="Alertas" icon={<Warning />} />
          <Tab label="Sessões" icon={<Computer />} />
          <Tab label="2FA" icon={<QrCode />} />
          <Tab label="Logs" icon={<Timeline />} />
          <Tab label="Configurações" icon={<Settings />} />
        </Tabs>
      </Box>

      {/* Visão Geral Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Gráfico de Atividade */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Atividade de Segurança
                </Typography>
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="textSecondary">
                    Gráfico de atividade (implementar com biblioteca de gráficos)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Alertas Recentes */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas Recentes
                </Typography>
                <List>
                  {data?.activeAlerts.slice(0, 5).map((alert, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color={getSeverityColor(alert.severity) as any} />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={alert.description}
                      />
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Tentativas Suspeitas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tentativas de Login Suspeitas
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>Tentativas Falhadas</TableCell>
                        <TableCell>Última Tentativa</TableCell>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.suspiciousLogins.map((login, index) => (
                        <TableRow key={index}>
                          <TableCell>{login.email}</TableCell>
                          <TableCell>{login.ip_address}</TableCell>
                          <TableCell>
                            <Chip
                              label={login.failed_attempts}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(login.last_attempt).toLocaleString()}
                          </TableCell>
                          <TableCell>{login.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedUser({ id: login.user_id, email: login.email })
                                setForce2FADialog(true)
                              }}
                            >
                              Forçar 2FA
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Alertas Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Lista de Alertas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas de Segurança
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Severidade</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.activeAlerts.map((alert, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={alert.alert_type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.severity}
                              color={getSeverityColor(alert.severity) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{alert.title}</TableCell>
                          <TableCell>{alert.user_email}</TableCell>
                          <TableCell>
                            {new Date(alert.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.status}
                              color={alert.status === 'open' ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => console.log('Investigar alerta:', alert.id)}
                            >
                              Investigar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Sessões Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Sessões Ativas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sessões Ativas
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuário</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>2FA Verificado</TableCell>
                        <TableCell>Criada</TableCell>
                        <TableCell>Última Atividade</TableCell>
                        <TableCell>Expira</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.activeSessions.map((session, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {session.email.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{session.full_name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {session.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{session.ip_address}</TableCell>
                          <TableCell>
                            <Chip
                              label={session.is_2fa_verified ? 'Sim' : 'Não'}
                              color={session.is_2fa_verified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(session.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(session.last_activity_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(session.expires_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => {
                                setSelectedSession(session)
                                setRevokeSessionDialog(true)
                              }}
                            >
                              Revogar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 2FA Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Usuários com 2FA */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usuários com 2FA Ativo
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Configurado em</TableCell>
                        <TableCell>Último Uso</TableCell>
                        <TableCell>Configurações</TableCell>
                        <TableCell>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.user2FA.map((user2fa, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {user2fa.users.email.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{user2fa.users.full_name}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {user2fa.users.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Ativo"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {user2fa.setup_completed_at ? 
                              new Date(user2fa.setup_completed_at).toLocaleString() : 
                              'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {user2fa.last_used_at ? 
                              new Date(user2fa.last_used_at).toLocaleString() : 
                              'Nunca usado'
                            }
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="caption" display="block">
                                Admin: {user2fa.require_2fa_for_admin ? 'Sim' : 'Não'}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Sensível: {user2fa.require_2fa_for_sensitive_actions ? 'Sim' : 'Não'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => console.log('Configurar 2FA:', user2fa.user_id)}
                            >
                              Configurar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {/* Logs de Segurança */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Logs de Segurança
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Severidade</TableCell>
                        <TableCell>Usuário</TableCell>
                        <TableCell>IP</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.securityLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getLogTypeIcon(log.log_type)}
                              <Typography variant="body2">
                                {log.log_type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.severity}
                              color={getSeverityColor(log.severity) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{log.user_id || 'Sistema'}</TableCell>
                          <TableCell>{log.ip_address}</TableCell>
                          <TableCell>{log.action_description}</TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.success ? 'Sucesso' : 'Falha'}
                              color={log.success ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Configurações Tab */}
      <TabPanel value={tabValue} index={5}>
        <Grid container spacing={3}>
          {/* Configurações Gerais */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Segurança
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Forçar 2FA para administradores"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Forçar 2FA para ações sensíveis"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Detectar login suspeito"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Log de todas as ações"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Restrição por IP"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Configurações de Sessão */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurações de Sessão
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Tempo de sessão (minutos)"
                    type="number"
                    defaultValue={15}
                    size="small"
                  />
                  <TextField
                    label="Tempo de refresh (dias)"
                    type="number"
                    defaultValue={7}
                    size="small"
                  />
                  <TextField
                    label="Máximo de sessões simultâneas"
                    type="number"
                    defaultValue={3}
                    size="small"
                  />
                  <TextField
                    label="Tempo de inatividade (minutos)"
                    type="number"
                    defaultValue={30}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Diálogo Forçar 2FA */}
      <Dialog open={force2FADialog} onClose={() => setForce2FADialog(false)}>
        <DialogTitle>Forçar 2FA</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja forçar a ativação de 2FA para o usuário {selectedUser?.email}?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            O usuário será obrigado a configurar 2FA no próximo login.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForce2FADialog(false)}>Cancelar</Button>
          <Button onClick={handleForce2FA} color="primary" variant="contained">
            Forçar 2FA
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Revogar Sessão */}
      <Dialog open={revokeSessionDialog} onClose={() => setRevokeSessionDialog(false)}>
        <DialogTitle>Revogar Sessão</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja revogar a sessão do usuário {selectedSession?.email}?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            O usuário será desconectado imediatamente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeSessionDialog(false)}>Cancelar</Button>
          <Button onClick={handleRevokeSession} color="error" variant="contained">
            Revogar Sessão
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 