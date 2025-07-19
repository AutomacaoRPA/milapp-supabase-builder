import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material'
import {
  Security,
  Save,
  Refresh,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Visibility,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  Warning,
  Error,
  Info
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface Policy {
  id?: string
  project_id: string
  role_name: string
  resource: string
  actions: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    approve: boolean
    export: boolean
  }
  conditions?: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface PolicyEditorProps {
  projectId: string
  onSave?: (policies: Policy[]) => void
  readOnly?: boolean
}

const RESOURCES = [
  { value: 'projects', label: 'Projetos', icon: '📋' },
  { value: 'tasks', label: 'Tarefas', icon: '✅' },
  { value: 'quality_gates', label: 'Quality Gates', icon: '🚪' },
  { value: 'analytics', label: 'Analytics', icon: '📊' },
  { value: 'users', label: 'Usuários', icon: '👥' },
  { value: 'audit', label: 'Auditoria', icon: '🔍' },
  { value: 'settings', label: 'Configurações', icon: '⚙️' },
  { value: 'ai', label: 'IA', icon: '🤖' }
]

const ACTIONS = [
  { key: 'create', label: 'Criar', icon: '➕' },
  { key: 'read', label: 'Ler', icon: '👁️' },
  { key: 'update', label: 'Editar', icon: '✏️' },
  { key: 'delete', label: 'Excluir', icon: '🗑️' },
  { key: 'approve', label: 'Aprovar', icon: '✅' },
  { key: 'export', label: 'Exportar', icon: '📤' }
]

const ROLE_TEMPLATES = {
  admin: {
    name: 'Administrador',
    color: 'error',
    description: 'Acesso total ao projeto'
  },
  gestor: {
    name: 'Gestor',
    color: 'warning',
    description: 'Gerencia projeto e equipe'
  },
  analista: {
    name: 'Analista',
    color: 'info',
    description: 'Trabalha com tarefas e análise'
  },
  ia: {
    name: 'Especialista IA',
    color: 'secondary',
    description: 'Acesso a funcionalidades de IA'
  },
  readonly: {
    name: 'Apenas Leitura',
    color: 'default',
    description: 'Visualização apenas'
  }
}

export function PolicyEditor({ projectId, onSave, readOnly = false }: PolicyEditorProps) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadPolicies()
    loadRoles()
  }, [projectId])

  const loadPolicies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('project_policies')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('role_name')
        .order('resource')

      if (error) throw error
      setPolicies(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar políticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('project_roles')
        .select('role_name')
        .eq('project_id', projectId)
        .eq('is_active', true)

      if (error) throw error
      setRoles(data?.map(r => r.role_name) || [])
    } catch (error) {
      console.error('❌ Erro ao carregar roles:', error)
    }
  }

  const savePolicy = async (policy: Policy) => {
    try {
      setSaving(true)
      
      if (policy.id) {
        // Atualizar
        const { error } = await supabase
          .from('project_policies')
          .update({
            ...policy,
            updated_at: new Date().toISOString()
          })
          .eq('id', policy.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('project_policies')
          .insert({
            ...policy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      }

      await loadPolicies()
      onSave?.(policies)
      setShowDialog(false)
      setEditingPolicy(null)
    } catch (error) {
      console.error('❌ Erro ao salvar política:', error)
    } finally {
      setSaving(false)
    }
  }

  const deletePolicy = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from('project_policies')
        .update({ is_active: false })
        .eq('id', policyId)

      if (error) throw error
      await loadPolicies()
    } catch (error) {
      console.error('❌ Erro ao deletar política:', error)
    }
  }

  const generatePolicyFromTemplate = (roleName: string) => {
    const template = ROLE_TEMPLATES[roleName as keyof typeof ROLE_TEMPLATES]
    if (!template) return

    const newPolicies: Policy[] = RESOURCES.map(resource => ({
      project_id: projectId,
      role_name: roleName,
      resource: resource.value,
      actions: {
        create: roleName === 'admin' || roleName === 'gestor',
        read: true,
        update: roleName === 'admin' || roleName === 'gestor' || roleName === 'analista',
        delete: roleName === 'admin',
        approve: roleName === 'admin' || roleName === 'gestor',
        export: roleName === 'admin' || roleName === 'gestor'
      },
      description: `Política ${template.name} para ${resource.label}`,
      is_active: true
    }))

    setPolicies(prev => [...prev, ...newPolicies])
  }

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy)
    setShowDialog(true)
  }

  const handleAdd = () => {
    setEditingPolicy({
      project_id: projectId,
      role_name: roles[0] || 'analista',
      resource: 'projects',
      actions: {
        create: false,
        read: true,
        update: false,
        delete: false,
        approve: false,
        export: false
      },
      is_active: true
    })
    setShowDialog(true)
  }

  const handleSave = () => {
    if (editingPolicy) {
      savePolicy(editingPolicy)
    }
  }

  const handleCancel = () => {
    setShowDialog(false)
    setEditingPolicy(null)
  }

  const getPolicyForRoleAndResource = (roleName: string, resource: string) => {
    return policies.find(p => p.role_name === roleName && p.resource === resource)
  }

  const getResourceLabel = (resource: string) => {
    return RESOURCES.find(r => r.value === resource)?.label || resource
  }

  const getRoleInfo = (roleName: string) => {
    return ROLE_TEMPLATES[roleName as keyof typeof ROLE_TEMPLATES]
  }

  const getActionIcon = (action: string) => {
    return ACTIONS.find(a => a.key === action)?.icon || '❓'
  }

  const getActionColor = (action: string, enabled: boolean) => {
    if (!enabled) return 'default'
    switch (action) {
      case 'create': return 'success'
      case 'read': return 'info'
      case 'update': return 'warning'
      case 'delete': return 'error'
      case 'approve': return 'primary'
      case 'export': return 'secondary'
      default: return 'default'
    }
  }

  const exportPolicies = () => {
    const policiesJson = {
      project_id: projectId,
      policies: policies,
      exported_at: new Date().toISOString(),
      version: '2.0.0'
    }
    
    const blob = new Blob([JSON.stringify(policiesJson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `policies-${projectId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography>Carregando políticas...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Security color="primary" />
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            Editor de Políticas RBAC
          </Typography>
        </Box>
        
        {!readOnly && (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Mostrar'} Preview
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadPolicies}
            >
              Atualizar
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Adicionar Política
            </Button>
          </Box>
        )}
      </Box>

      {/* Alertas informativos */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Configure as permissões de acesso para cada role e recurso do projeto. 
          As políticas definem quem pode fazer o quê em cada área do sistema.
        </Typography>
      </Alert>

      {/* Preview das políticas */}
      {showPreview && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preview das Políticas
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    {RESOURCES.map(resource => (
                      <TableCell key={resource.value} align="center">
                        {resource.icon} {resource.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map(roleName => {
                    const roleInfo = getRoleInfo(roleName)
                    return (
                      <TableRow key={roleName}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={roleInfo?.name || roleName}
                              color={roleInfo?.color as any}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        {RESOURCES.map(resource => {
                          const policy = getPolicyForRoleAndResource(roleName, resource.value)
                          return (
                            <TableCell key={resource.value} align="center">
                              {policy ? (
                                <Box display="flex" flexWrap="wrap" gap={0.5} justifyContent="center">
                                  {ACTIONS.map(action => (
                                    <Tooltip
                                      key={action.key}
                                      title={`${action.label}: ${policy.actions[action.key as keyof typeof policy.actions] ? 'Permitido' : 'Negado'}`}
                                    >
                                      <Chip
                                        icon={<span>{action.icon}</span>}
                                        size="small"
                                        color={getActionColor(action.key, policy.actions[action.key as keyof typeof policy.actions]) as any}
                                        variant={policy.actions[action.key as keyof typeof policy.actions] ? 'filled' : 'outlined'}
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Sem política
                                </Typography>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de políticas */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            Políticas Configuradas ({policies.length})
          </Typography>
        </AccordionSummary>
        
        <AccordionDetails>
          {policies.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
              <Security color="action" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma política configurada
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Adicione políticas para definir as permissões de acesso ao projeto.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>Recurso</TableCell>
                    <TableCell>Permissões</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Status</TableCell>
                    {!readOnly && <TableCell>Ações</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies.map((policy) => {
                    const roleInfo = getRoleInfo(policy.role_name)
                    return (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <Chip
                            label={roleInfo?.name || policy.role_name}
                            color={roleInfo?.color as any}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <span>{RESOURCES.find(r => r.value === policy.resource)?.icon}</span>
                            <Typography variant="body2">
                              {getResourceLabel(policy.resource)}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {ACTIONS.map(action => (
                              <Tooltip
                                key={action.key}
                                title={`${action.label}: ${policy.actions[action.key as keyof typeof policy.actions] ? 'Permitido' : 'Negado'}`}
                              >
                                <Chip
                                  icon={<span>{action.icon}</span>}
                                  size="small"
                                  color={getActionColor(action.key, policy.actions[action.key as keyof typeof policy.actions]) as any}
                                  variant={policy.actions[action.key as keyof typeof policy.actions] ? 'filled' : 'outlined'}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {policy.description || 'Sem descrição'}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={policy.is_active ? 'Ativo' : 'Inativo'}
                            color={policy.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        
                        {!readOnly && (
                          <TableCell>
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Editar política">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(policy)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Excluir política">
                                <IconButton
                                  size="small"
                                  onClick={() => policy.id && deletePolicy(policy.id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Ações em lote */}
      {!readOnly && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ações em Lote
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              {roles.map(roleName => (
                <Button
                  key={roleName}
                  variant="outlined"
                  size="small"
                  onClick={() => generatePolicyFromTemplate(roleName)}
                >
                  Gerar {getRoleInfo(roleName)?.name} Template
                </Button>
              ))}
              
              <Button
                variant="outlined"
                size="small"
                onClick={exportPolicies}
              >
                Exportar Políticas
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog para editar/criar política */}
      <Dialog
        open={showDialog}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPolicy?.id ? 'Editar Política' : 'Adicionar Política'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editingPolicy?.role_name || ''}
                onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, role_name: e.target.value } : null)}
                label="Role"
              >
                {roles.map(role => (
                  <MenuItem key={role} value={role}>
                    {getRoleInfo(role)?.name || role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Recurso</InputLabel>
              <Select
                value={editingPolicy?.resource || ''}
                onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, resource: e.target.value } : null)}
                label="Recurso"
              >
                {RESOURCES.map(resource => (
                  <MenuItem key={resource.value} value={resource.value}>
                    {resource.icon} {resource.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Divider />
            
            <Typography variant="subtitle1" fontWeight="bold">
              Permissões
            </Typography>
            
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
              {ACTIONS.map(action => (
                <FormControlLabel
                  key={action.key}
                  control={
                    <Switch
                      checked={editingPolicy?.actions[action.key as keyof typeof editingPolicy.actions] || false}
                      onChange={(e) => setEditingPolicy(prev => prev ? {
                        ...prev,
                        actions: {
                          ...prev.actions,
                          [action.key]: e.target.checked
                        }
                      } : null)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{action.icon}</span>
                      <Typography variant="body2">{action.label}</Typography>
                    </Box>
                  }
                />
              ))}
            </Box>
            
            <TextField
              label="Descrição"
              value={editingPolicy?.description || ''}
              onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, description: e.target.value } : null)}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={editingPolicy?.is_active || false}
                  onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                />
              }
              label="Política ativa"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!editingPolicy?.role_name || !editingPolicy?.resource || saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 