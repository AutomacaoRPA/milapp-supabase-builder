import React, { useState, useEffect, useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  PlayArrow,
  Save,
  SmartToy,
  Add,
  Settings,
  Visibility,
  Download,
  Upload,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
  Person,
  SmartToy as RobotIcon,
  Webhook,
  Description,
  Schedule,
  Notifications,
  AccountTree
} from '@mui/icons-material'
import { workflowService, Workflow, WorkflowNode, WorkflowEdge } from '../../services/workflow/WorkflowService'

// Nós customizados
import { StartNode } from './nodes/StartNode'
import { EndNode } from './nodes/EndNode'
import { TaskHumanNode } from './nodes/TaskHumanNode'
import { TaskAutomationNode } from './nodes/TaskAutomationNode'
import { TaskAINode } from './nodes/TaskAINode'
import { GatewayNode } from './nodes/GatewayNode'
import { WebhookNode } from './nodes/WebhookNode'
import { DocumentNode } from './nodes/DocumentNode'

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  task_human: TaskHumanNode,
  task_automation: TaskAutomationNode,
  task_ai: TaskAINode,
  gateway: GatewayNode,
  webhook: WebhookNode,
  document: DocumentNode
}

interface WorkflowEditorProps {
  workflowId?: string
  projectId: string
  onSave?: (workflow: Workflow) => void
  onExecute?: (executionId: string) => void
}

export function WorkflowEditor({
  workflowId,
  projectId,
  onSave,
  onExecute
}: WorkflowEditorProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados do React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  // Estados de UI
  const [showAINodeDialog, setShowAINodeDialog] = useState(false)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  
  const { getNodes, getEdges, setViewport } = useReactFlow()

  // Carregar workflow existente
  useEffect(() => {
    if (workflowId) {
      loadWorkflow()
    }
  }, [workflowId])

  const loadWorkflow = async () => {
    if (!workflowId) return

    try {
      setLoading(true)
      setError(null)

      const [workflowData, nodesData, edgesData] = await Promise.all([
        workflowService.getWorkflow(workflowId),
        workflowService.getWorkflowNodes(workflowId),
        workflowService.getWorkflowEdges(workflowId)
      ])

      if (workflowData) {
        setWorkflow(workflowData)
      }

      // Converter nós para React Flow
      const reactFlowNodes: Node[] = nodesData.map(node => ({
        id: node.node_id,
        type: node.type,
        position: { x: node.position_x, y: node.position_y },
        data: {
          label: node.label,
          ...node.data
        },
        style: node.style
      }))

      // Converter conexões para React Flow
      const reactFlowEdges: Edge[] = edgesData.map(edge => ({
        id: edge.edge_id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        label: edge.label,
        data: {
          condition: edge.condition,
          condition_type: edge.condition_type
        },
        style: edge.style
      }))

      setNodes(reactFlowNodes)
      setEdges(reactFlowEdges)
    } catch (error) {
      console.error('❌ Erro ao carregar workflow:', error)
      setError('Erro ao carregar workflow')
    } finally {
      setLoading(false)
    }
  }

  // Salvar workflow
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const currentNodes = getNodes()
      const currentEdges = getEdges()

      // Converter nós para formato do banco
      const workflowNodes: WorkflowNode[] = currentNodes.map((node, index) => ({
        id: '',
        node_id: node.id,
        label: node.data.label,
        type: node.type as any,
        position_x: node.position.x,
        position_y: node.position.y,
        width: node.style?.width,
        height: node.style?.height,
        data: { ...node.data },
        style: node.style,
        execution_order: index + 1,
        is_valid: true
      }))

      // Converter conexões para formato do banco
      const workflowEdges: WorkflowEdge[] = currentEdges.map(edge => ({
        id: '',
        edge_id: edge.id,
        source_node_id: edge.source,
        target_node_id: edge.target,
        label: edge.label,
        condition: edge.data?.condition,
        condition_type: edge.data?.condition_type,
        style: edge.style,
        is_valid: true
      }))

      if (workflowId) {
        // Atualizar workflow existente
        await Promise.all([
          workflowService.saveWorkflowNodes(workflowId, workflowNodes),
          workflowService.saveWorkflowEdges(workflowId, workflowEdges)
        ])
      } else {
        // Criar novo workflow
        const newWorkflowId = await workflowService.createWorkflow(
          'Novo Workflow',
          projectId
        )
        await Promise.all([
          workflowService.saveWorkflowNodes(newWorkflowId, workflowNodes),
          workflowService.saveWorkflowEdges(newWorkflowId, workflowEdges)
        ])
      }

      setSuccess('Workflow salvo com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar workflow:', error)
      setError('Erro ao salvar workflow')
    } finally {
      setSaving(false)
    }
  }

  // Validar workflow
  const handleValidate = async () => {
    if (!workflowId) {
      setError('Salve o workflow antes de validar')
      return
    }

    try {
      const result = await workflowService.validateWorkflow(workflowId)
      setValidationResult(result)
      setShowValidationDialog(true)
    } catch (error) {
      console.error('❌ Erro ao validar workflow:', error)
      setError('Erro ao validar workflow')
    }
  }

  // Executar workflow
  const handleExecute = async () => {
    if (!workflowId) {
      setError('Salve o workflow antes de executar')
      return
    }

    try {
      const executionId = await workflowService.executeWorkflow(workflowId, {})
      setSuccess('Workflow iniciado com sucesso!')
      onExecute?.(executionId)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao executar workflow:', error)
      setError('Erro ao executar workflow')
    }
  }

  // Gerar workflow com IA
  const handleGenerateWithAI = async (description: string) => {
    try {
      const workflowData = await workflowService.generateWorkflowAI(
        description,
        projectId
      )

      // Aplicar workflow gerado
      if (workflowData.nodes) {
        const reactFlowNodes: Node[] = workflowData.nodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: { label: node.label, ...node.data }
        }))
        setNodes(reactFlowNodes)
      }

      if (workflowData.edges) {
        const reactFlowEdges: Edge[] = workflowData.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label
        }))
        setEdges(reactFlowEdges)
      }

      setSuccess('Workflow gerado com IA!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao gerar workflow com IA:', error)
      setError('Erro ao gerar workflow com IA')
    }
  }

  // Adicionar conexão
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Adicionar nó
  const addNode = (type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type: type as any,
      position,
      data: { label: `Novo ${type}` }
    }
    setNodes((nds) => nds.concat(newNode))
  }

  // Nós disponíveis para adicionar
  const availableNodes = [
    { type: 'task_human', label: 'Tarefa Humana', icon: <Person /> },
    { type: 'task_automation', label: 'Automação', icon: <RobotIcon /> },
    { type: 'task_ai', label: 'IA', icon: <SmartToy /> },
    { type: 'gateway', label: 'Gateway', icon: <AccountTree /> },
    { type: 'webhook', label: 'Webhook', icon: <Webhook /> },
    { type: 'document', label: 'Documento', icon: <Description /> },
    { type: 'delay', label: 'Delay', icon: <Schedule /> },
    { type: 'notification', label: 'Notificação', icon: <Notifications /> }
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de ferramentas */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h6" fontWeight="bold">
              {workflow?.name || 'Novo Workflow'}
            </Typography>
            
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<CheckCircle />}
                onClick={handleValidate}
              >
                Validar
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<PlayArrow />}
                onClick={handleExecute}
                color="success"
              >
                Executar
              </Button>
            </Box>
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

          {/* Nós disponíveis */}
          <Box display="flex" gap={1} flexWrap="wrap">
            {availableNodes.map((node) => (
              <Tooltip key={node.type} title={node.label}>
                <IconButton
                  size="small"
                  onClick={() => addNode(node.type, { x: 100, y: 100 })}
                >
                  {node.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Editor React Flow */}
      <Box sx={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap />
          
          {/* Painel de IA */}
          <Panel position="top-right">
            <Button
              variant="contained"
              startIcon={<SmartToy />}
              onClick={() => setShowAINodeDialog(true)}
              size="small"
            >
              Gerar com IA
            </Button>
          </Panel>
        </ReactFlow>
      </Box>

      {/* Dialog para geração com IA */}
      <Dialog
        open={showAINodeDialog}
        onClose={() => setShowAINodeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Gerar Workflow com IA
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Descreva o processo"
              multiline
              rows={4}
              fullWidth
              placeholder="Ex: Quero um processo que começa com um formulário, depois IA analisa a viabilidade, se sim vai para o bot, se não vai para revisão humana"
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAINodeDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Implementar geração com IA
              setShowAINodeDialog(false)
            }}
          >
            Gerar Workflow
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de validação */}
      <Dialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Validação do Workflow
        </DialogTitle>
        
        <DialogContent>
          {validationResult && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {validationResult.is_valid ? (
                  <CheckCircle color="success" />
                ) : (
                  <Error color="error" />
                )}
                <Typography variant="h6">
                  {validationResult.is_valid ? 'Workflow Válido' : 'Workflow Inválido'}
                </Typography>
              </Box>
              
              <Typography variant="body2" gutterBottom>
                <strong>Nós:</strong> {validationResult.node_count}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Conexões:</strong> {validationResult.edge_count}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Nós de início:</strong> {validationResult.start_nodes}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Nós de fim:</strong> {validationResult.end_nodes}
              </Typography>
              
              {validationResult.errors.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Erros encontrados:
                  </Typography>
                  <List dense>
                    {validationResult.errors.map((error: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Error color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowValidationDialog(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 