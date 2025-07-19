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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Badge,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
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
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material'
import {
  Security,
  Gavel,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Download,
  Visibility,
  Edit,
  Delete,
  Add,
  ExpandMore,
  Timeline,
  Analytics,
  Business,
  VerifiedUser,
  Lock,
  DataUsage,
  PrivacyTip,
  Compliance,
  Audit,
  Report,
  Schedule,
  TrendingUp,
  TrendingDown,
  PriorityHigh,
  LowPriority,
  FilterList,
  Settings,
  History,
  Assignment,
  BugReport,
  SecurityUpdate,
  DataProtection,
  Policy,
  DocumentScanner
} from '@mui/icons-material'
import { complianceAuditService } from '../../services/audit/ComplianceAuditService'
import { DynamicChart } from '../../components/Reports/DynamicChart'

interface ComplianceFramework {
  name: string
  code: string
  score: number
  status: 'compliant' | 'non_compliant' | 'warning'
  violations: number
  rules: number
  lastAudit: string
  icon: React.ReactNode
  color: string
}

interface ComplianceViolation {
  id: string
  ruleId: string
  ruleName: string
  framework: string
  severity: string
  status: string
  description: string
  remediation: string
  violationDate: string
}

interface AuditEvent {
  id: string
  action: string
  user: string
  resource: string
  severity: string
  timestamp: string
  category: string
}

export function ComplianceDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [auditDialogOpen, setAuditDialogOpen] = useState(false)
  const [violationDialogOpen, setViolationDialogOpen] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null)
  
  // Estados de dados
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const [violations, setViolations] = useState<ComplianceViolation[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [overallScore, setOverallScore] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simular dados de compliance
      const mockFrameworks: ComplianceFramework[] = [
        {
          name: 'LGPD',
          code: 'lgpd',
          score: 87.5,
          status: 'warning',
          violations: 3,
          rules: 12,
          lastAudit: '2024-01-15',
          icon: <PrivacyTip />,
          color: '#1976d2'
        },
        {
          name: 'ISO 27001',
          code: 'iso27001',
          score: 92.3,
          status: 'compliant',
          violations: 1,
          rules: 15,
          lastAudit: '2024-01-10',
          icon: <Security />,
          color: '#2e7d32'
        },
        {
          name: 'SOX',
          code: 'sox',
          score: 95.8,
          status: 'compliant',
          violations: 0,
          rules: 8,
          lastAudit: '2024-01-12',
          icon: <Business />,
          color: '#ed6c02'
        },
        {
          name: 'PCI DSS',
          code: 'pci',
          score: 78.9,
          status: 'non_compliant',
          violations: 5,
          rules: 6,
          lastAudit: '2024-01-08',
          icon: <VerifiedUser />,
          color: '#d32f2f'
        }
      ]

      setFrameworks(mockFrameworks)
      setOverallScore(mockFrameworks.reduce((acc, f) => acc + f.score, 0) / mockFrameworks.length)

      // Simular violações
      const mockViolations: ComplianceViolation[] = [
        {
          id: 'v1',
          ruleId: 'lgpd_consent_required',
          ruleName: 'Consentimento LGPD Obrigatório',
          framework: 'lgpd',
          severity: 'critical',
          status: 'open',
          description: 'Dados pessoais sendo processados sem consentimento explícito',
          remediation: 'Implementar sistema de consentimento e obter autorização dos titulares',
          violationDate: '2024-01-14'
        },
        {
          id: 'v2',
          ruleId: 'iso_access_control',
          ruleName: 'Controle de Acesso ISO 27001',
          framework: 'iso27001',
          severity: 'high',
          status: 'in_progress',
          description: 'Controles de acesso inadequados em sistemas críticos',
          remediation: 'Implementar autenticação multifator e revisar permissões',
          violationDate: '2024-01-13'
        },
        {
          id: 'v3',
          ruleId: 'pci_card_data_protection',
          ruleName: 'Proteção de Dados de Cartão PCI',
          framework: 'pci',
          severity: 'critical',
          status: 'open',
          description: 'Dados de cartão não criptografados adequadamente',
          remediation: 'Implementar criptografia AES-256 e tokenização',
          violationDate: '2024-01-12'
        }
      ]

      setViolations(mockViolations)

      // Simular eventos de auditoria
      const mockAuditEvents: AuditEvent[] = [
        {
          id: 'e1',
          action: 'data_access_request',
          user: 'joao.silva@empresa.com',
          resource: 'personal_data',
          severity: 'medium',
          timestamp: '2024-01-15T10:30:00Z',
          category: 'data'
        },
        {
          id: 'e2',
          action: 'failed_login_attempt',
          user: 'unknown',
          resource: 'authentication',
          severity: 'high',
          timestamp: '2024-01-15T09:15:00Z',
          category: 'security'
        },
        {
          id: 'e3',
          action: 'data_export',
          user: 'maria.santos@empresa.com',
          resource: 'reports',
          severity: 'low',
          timestamp: '2024-01-15T08:45:00Z',
          category: 'data'
        }
      ]

      setAuditEvents(mockAuditEvents)

      // Dados para gráficos
      const mockChartData = [
        { name: 'Jan', LGPD: 85, 'ISO 27001': 90, SOX: 92, 'PCI DSS': 75 },
        { name: 'Fev', LGPD: 87, 'ISO 27001': 91, SOX: 93, 'PCI DSS': 78 },
        { name: 'Mar', LGPD: 86, 'ISO 27001': 89, SOX: 94, 'PCI DSS': 80 },
        { name: 'Abr', LGPD: 88, 'ISO 27001': 92, SOX: 95, 'PCI DSS': 82 },
        { name: 'Mai', LGPD: 87, 'ISO 27001': 93, SOX: 96, 'PCI DSS': 79 },
        { name: 'Jun', LGPD: 87.5, 'ISO 27001': 92.3, SOX: 95.8, 'PCI DSS': 78.9 }
      ]

      setChartData(mockChartData)

    } catch (error) {
      console.error('❌ Erro ao carregar dados de compliance:', error)
      setError('Erro ao carregar dados de compliance')
    } finally {
      setLoading(false)
    }
  }

  const runComplianceAudit = async () => {
    try {
      setAuditDialogOpen(true)
      setLoading(true)

      // Simular execução de auditoria
      await new Promise(resolve => setTimeout(resolve, 3000))

      const results = await complianceAuditService.runComplianceAudit()
      
      setSuccess('Auditoria de compliance concluída com sucesso')
      setAuditDialogOpen(false)
      
      // Recarregar dados
      await loadComplianceData()
    } catch (error) {
      console.error('❌ Erro na auditoria:', error)
      setError('Erro ao executar auditoria de compliance')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'success'
      case 'non_compliant': return 'error'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle color="success" />
      case 'non_compliant': return <Error color="error" />
      case 'warning': return <Warning color="warning" />
      default: return <Info color="info" />
    }
  }

  const exportComplianceReport = async (framework?: string) => {
    try {
      const report = await complianceAuditService.generateComplianceReport(framework, 'pdf')
      
      // Simular download
      const content = `
        Relatório de Compliance - ${framework || 'Todos os Frameworks'}
        Data: ${new Date().toLocaleDateString()}
        
        Score Geral: ${report.complianceScore}%
        Violações: ${report.violations}
        Eventos Recentes: ${report.recentEvents}
        
        Recomendações:
        ${report.recommendations.join('\n')}
      `
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${framework || 'all'}-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSuccess('Relatório exportado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao exportar relatório:', error)
      setError('Erro ao exportar relatório')
    }
  }

  if (loading && !auditDialogOpen) {
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
          <Compliance sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dashboard de Compliance & Auditoria
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportComplianceReport()}
          >
            Exportar Relatório
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={runComplianceAudit}
          >
            Executar Auditoria
          </Button>
        </Box>
      </Box>

      {/* Score Geral */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Score Geral de Compliance
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Box flex={1}>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                sx={{ height: 20, borderRadius: 10 }}
                color={overallScore >= 90 ? 'success' : overallScore >= 70 ? 'warning' : 'error'}
              />
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {overallScore.toFixed(1)}%
            </Typography>
          </Box>
          
          <Typography variant="body2" color="textSecondary" mt={1}>
            Baseado em {frameworks.length} frameworks de compliance
          </Typography>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Frameworks" icon={<Policy />} />
          <Tab label="Violações" icon={<BugReport />} />
          <Tab label="Auditoria" icon={<Audit />} />
          <Tab label="Tendências" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {/* Tab Frameworks */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {frameworks.map((framework) => (
            <Grid item xs={12} md={6} key={framework.code}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ color: framework.color }}>
                        {framework.icon}
                      </Box>
                      <Typography variant="h6">
                        {framework.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={framework.status}
                      color={getStatusColor(framework.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Box mb={2}>
                    <LinearProgress
                      variant="determinate"
                      value={framework.score}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={framework.score >= 90 ? 'success' : framework.score >= 70 ? 'warning' : 'error'}
                    />
                    <Typography variant="body2" color="textSecondary" mt={0.5}>
                      Score: {framework.score}%
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Regras
                      </Typography>
                      <Typography variant="h6">
                        {framework.rules}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Violações
                      </Typography>
                      <Typography variant="h6" color="error">
                        {framework.violations}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                    Última auditoria: {new Date(framework.lastAudit).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab Violações */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Violações de Compliance
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Framework</TableCell>
                    <TableCell>Regra</TableCell>
                    <TableCell>Severidade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {violations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell>
                        <Chip
                          label={violation.framework.toUpperCase()}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {violation.ruleName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {violation.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={violation.severity}
                          size="small"
                          color={getSeverityColor(violation.severity) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={violation.status}
                          size="small"
                          color={violation.status === 'open' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(violation.violationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedViolation(violation)
                            setViolationDialogOpen(true)
                          }}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Auditoria */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Eventos de Auditoria Recentes
                </Typography>
                
                <Timeline>
                  {auditEvents.map((event, index) => (
                    <TimelineItem key={event.id}>
                      <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getSeverityColor(event.severity) as any} />
                        {index < auditEvents.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="h6" component="span">
                          {event.action}
                        </Typography>
                        <Typography>
                          {event.user} - {event.resource}
                        </Typography>
                        <Chip
                          label={event.category}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas de Auditoria
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Eventos de Segurança"
                      secondary={`${auditEvents.filter(e => e.category === 'security').length} eventos`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <DataUsage />
                    </ListItemIcon>
                    <ListItemText
                      primary="Eventos de Dados"
                      secondary={`${auditEvents.filter(e => e.category === 'data').length} eventos`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PriorityHigh />
                    </ListItemIcon>
                    <ListItemText
                      primary="Eventos Críticos"
                      secondary={`${auditEvents.filter(e => e.severity === 'critical').length} eventos`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Tendências */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Evolução do Compliance (Últimos 6 meses)
            </Typography>
            
            <DynamicChart
              data={chartData}
              title="Tendências de Compliance"
              description="Evolução dos scores de compliance por framework"
              height={400}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog de Auditoria */}
      <Dialog
        open={auditDialogOpen}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Executando Auditoria de Compliance
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={3}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analisando Frameworks...
            </Typography>
            <Typography variant="body2" color="textSecondary" textAlign="center">
              Verificando conformidade com LGPD, ISO 27001, SOX e PCI DSS
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Violação */}
      <Dialog
        open={violationDialogOpen}
        onClose={() => setViolationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes da Violação
        </DialogTitle>
        <DialogContent>
          {selectedViolation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedViolation.ruleName}
              </Typography>
              
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Framework
                  </Typography>
                  <Chip
                    label={selectedViolation.framework.toUpperCase()}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Severidade
                  </Typography>
                  <Chip
                    label={selectedViolation.severity}
                    color={getSeverityColor(selectedViolation.severity) as any}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="body1" gutterBottom>
                <strong>Descrição:</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedViolation.description}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Remediação:</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedViolation.remediation}
              </Typography>
              
              <Typography variant="caption" color="textSecondary">
                Data da violação: {new Date(selectedViolation.violationDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViolationDialogOpen(false)}>
            Fechar
          </Button>
          <Button variant="contained">
            Marcar como Resolvida
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