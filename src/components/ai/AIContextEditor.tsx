import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  SmartToy,
  Psychology,
  Security,
  Business,
  Code,
  Description,
  ExpandMore,
  AutoAwesome,
  Lightbulb,
  Warning
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface AIContext {
  id?: string
  project_id: string
  type: 'policy' | 'scope' | 'role' | 'restriction' | 'custom'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface AIContextEditorProps {
  projectId: string
  onSave?: (contexts: AIContext[]) => void
  readOnly?: boolean
}

const CONTEXT_TEMPLATES = {
  policy: [
    'Respeitar políticas de segurança da MedSênior',
    'Manter compliance LGPD/GDPR',
    'Seguir padrões de qualidade estabelecidos',
    'Documentar todas as decisões importantes'
  ],
  scope: [
    'Foco em automação de processos operacionais',
    'Otimização de eficiência e redução de custos',
    'Integração com sistemas existentes',
    'Escalabilidade para crescimento futuro'
  ],
  role: [
    'Gestor: Aprova mudanças críticas',
    'Analista: Executa análises e implementações',
    'Desenvolvedor: Codifica e testa soluções',
    'QA: Valida qualidade e performance'
  ],
  restriction: [
    'Não acessar dados pessoais sem autorização',
    'Não modificar sistemas críticos sem aprovação',
    'Manter logs de todas as operações',
    'Respeitar horários de manutenção'
  ]
}

const PRIORITY_COLORS = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  critical: 'error'
}

export function AIContextEditor({ projectId, onSave, readOnly = false }: AIContextEditorProps) {
  const [contexts, setContexts] = useState<AIContext[]>([])
  const [editingContext, setEditingContext] = useState<AIContext | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContexts()
  }, [projectId])

  const loadContexts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ai_contexts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      setContexts(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar contexto IA:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveContext = async (context: AIContext) => {
    try {
      setSaving(true)
      
      if (context.id) {
        // Atualizar
        const { error } = await supabase
          .from('ai_contexts')
          .update({
            ...context,
            updated_at: new Date().toISOString()
          })
          .eq('id', context.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('ai_contexts')
          .insert({
            ...context,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      }

      await loadContexts()
      onSave?.(contexts)
      setShowDialog(false)
      setEditingContext(null)
    } catch (error) {
      console.error('❌ Erro ao salvar contexto IA:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteContext = async (contextId: string) => {
    try {
      const { error } = await supabase
        .from('ai_contexts')
        .update({ is_active: false })
        .eq('id', contextId)

      if (error) throw error
      await loadContexts()
    } catch (error) {
      console.error('❌ Erro ao deletar contexto IA:', error)
    }
  }

  const addTemplateContext = (type: string, content: string) => {
    const newContext: AIContext = {
      project_id: projectId,
      type: type as any,
      title: `Contexto ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content,
      priority: 'medium',
      is_active: true
    }
    setEditingContext(newContext)
    setShowDialog(true)
    setShowTemplates(false)
  }

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'policy': return <Security />
      case 'scope': return <Business />
      case 'role': return <Psychology />
      case 'restriction': return <Warning />
      default: return <Description />
    }
  }

  const getContextColor = (type: string) => {
    switch (type) {
      case 'policy': return 'primary'
      case 'scope': return 'secondary'
      case 'role': return 'success'
      case 'restriction': return 'warning'
      default: return 'default'
    }
  }

  const handleEdit = (context: AIContext) => {
    setEditingContext(context)
    setShowDialog(true)
  }

  const handleAdd = () => {
    setEditingContext({
      project_id: projectId,
      type: 'custom',
      title: '',
      content: '',
      priority: 'medium',
      is_active: true
    })
    setShowDialog(true)
  }

  const handleSave = () => {
    if (editingContext && editingContext.title && editingContext.content) {
      saveContext(editingContext)
    }
  }

  const handleCancel = () => {
    setShowDialog(false)
    setEditingContext(null)
  }

  const groupedContexts = contexts.reduce((acc, context) => {
    if (!acc[context.type]) {
      acc[context.type] = []
    }
    acc[context.type].push(context)
    return acc
  }, {} as Record<string, AIContext[]>)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography>Carregando contexto IA...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <SmartToy color="primary" />
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            Contexto IA do Projeto
          </Typography>
        </Box>
        
        {!readOnly && (
          <Box display="flex" gap={1}>
            <Tooltip title="Adicionar template">
              <Button
                variant="outlined"
                startIcon={<AutoAwesome />}
                onClick={() => setShowTemplates(true)}
              >
                Templates
              </Button>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              Adicionar Contexto
            </Button>
          </Box>
        )}
      </Box>

      {/* Alertas informativos */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Este contexto será usado pela IA assistente para entender as regras, escopo e restrições do projeto.
          Quanto mais detalhado, melhor será o suporte da IA.
        </Typography>
      </Alert>

      {/* Contextos agrupados */}
      {Object.entries(groupedContexts).map(([type, typeContexts]) => (
        <Accordion key={type} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              {getContextIcon(type)}
              <Typography variant="subtitle1" fontWeight="bold">
                {type.charAt(0).toUpperCase() + type.slice(1)} ({typeContexts.length})
              </Typography>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <List>
              {typeContexts.map((context) => (
                <ListItem
                  key={context.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {context.title}
                        </Typography>
                        <Chip
                          label={context.priority.toUpperCase()}
                          color={PRIORITY_COLORS[context.priority] as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {context.content}
                      </Typography>
                    }
                  />
                  
                  {!readOnly && (
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(context)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => context.id && deleteContext(context.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {contexts.length === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
              <Lightbulb color="action" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum contexto IA definido
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Adicione contextos para que a IA assistente possa entender melhor as regras e escopo do projeto.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog para editar/criar contexto */}
      <Dialog
        open={showDialog}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingContext?.id ? 'Editar Contexto IA' : 'Adicionar Contexto IA'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Contexto</InputLabel>
              <Select
                value={editingContext?.type || 'custom'}
                onChange={(e) => setEditingContext(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                label="Tipo de Contexto"
              >
                <MenuItem value="policy">Política</MenuItem>
                <MenuItem value="scope">Escopo</MenuItem>
                <MenuItem value="role">Papel/Função</MenuItem>
                <MenuItem value="restriction">Restrição</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Título"
              value={editingContext?.title || ''}
              onChange={(e) => setEditingContext(prev => prev ? { ...prev, title: e.target.value } : null)}
              fullWidth
              required
            />
            
            <TextField
              label="Conteúdo"
              value={editingContext?.content || ''}
              onChange={(e) => setEditingContext(prev => prev ? { ...prev, content: e.target.value } : null)}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Descreva o contexto que a IA deve considerar..."
            />
            
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={editingContext?.priority || 'medium'}
                onChange={(e) => setEditingContext(prev => prev ? { ...prev, priority: e.target.value as any } : null)}
                label="Prioridade"
              >
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="critical">Crítica</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!editingContext?.title || !editingContext?.content || saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de templates */}
      <Dialog
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesome color="primary" />
            Templates de Contexto IA
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Selecione um template para adicionar rapidamente contextos pré-definidos:
          </Typography>
          
          {Object.entries(CONTEXT_TEMPLATES).map(([type, templates]) => (
            <Accordion key={type}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getContextIcon(type)}
                  <Typography variant="subtitle1">
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({templates.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <List>
                  {templates.map((template, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => addTemplateContext(type, template)}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {template}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowTemplates(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 