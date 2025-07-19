import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Chip,
  Avatar,
  Button
} from '@mui/material'
import {
  Person,
  Edit,
  Settings,
  Assignment,
  Schedule,
  CheckCircle,
  Warning
} from '@mui/icons-material'

interface TaskHumanData {
  label: string
  description?: string
  assigned_to?: string
  estimated_time?: number
  priority?: 'baixa' | 'normal' | 'alta' | 'urgente'
  form_fields?: string[]
  instructions?: string
}

const priorities = [
  { value: 'baixa', label: 'Baixa', color: 'success' },
  { value: 'normal', label: 'Normal', color: 'info' },
  { value: 'alta', label: 'Alta', color: 'warning' },
  { value: 'urgente', label: 'Urgente', color: 'error' }
]

export function TaskHumanNode({ data, selected }: NodeProps<TaskHumanData>) {
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState<TaskHumanData>({
    label: data.label,
    description: data.description || '',
    assigned_to: data.assigned_to || '',
    estimated_time: data.estimated_time || 30,
    priority: data.priority || 'normal',
    form_fields: data.form_fields || [],
    instructions: data.instructions || ''
  })

  const priorityColor = priorities.find(p => p.value === formData.priority)?.color || 'info'

  const handleSave = () => {
    // Atualizar dados do nó
    Object.assign(data, formData)
    setShowDialog(false)
  }

  return (
    <>
      <Card
        sx={{
          minWidth: 200,
          border: selected ? '2px solid #1976d2' : '1px solid #e0e0e0',
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Person color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              {formData.label}
            </Typography>
            
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => setShowDialog(true)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {formData.description && (
            <Typography variant="caption" color="text.secondary" display="block">
              {formData.description}
            </Typography>
          )}

          <Box display="flex" gap={1} mt={1}>
            {formData.assigned_to && (
              <Chip
                label={formData.assigned_to}
                size="small"
                icon={<Person />}
              />
            )}
            
            <Chip
              label={formData.priority}
              size="small"
              color={priorityColor as any}
            />
            
            {formData.estimated_time && (
              <Chip
                label={`${formData.estimated_time}min`}
                size="small"
                icon={<Schedule />}
              />
            )}
          </Box>

          {/* Handles para conexões */}
          <Handle
            type="target"
            position={Position.Left}
            style={{ background: '#555' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: '#555' }}
          />
        </CardContent>
      </Card>

      {/* Dialog de configuração */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configurar Tarefa Humana
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Nome da Tarefa"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              fullWidth
              required
            />
            
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
            
            <TextField
              label="Responsável"
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              fullWidth
              placeholder="Nome ou email do responsável"
            />
            
            <TextField
              label="Tempo Estimado (minutos)"
              type="number"
              value={formData.estimated_time}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                label="Prioridade"
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority.value} value={priority.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={priority.label}
                        size="small"
                        color={priority.color as any}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Instruções"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              multiline
              rows={4}
              fullWidth
              placeholder="Instruções detalhadas para execução da tarefa..."
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.label}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 