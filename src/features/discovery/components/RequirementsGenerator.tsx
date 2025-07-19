import { useState } from 'react'
import { 
  Box, Typography, Button, TextField, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import { 
  Description, Download, ContentCopy, 
  CheckCircle, Psychology 
} from '@mui/icons-material'
import { motion } from 'framer-motion'

interface Requirement {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
}

export function RequirementsGenerator() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [requirements, setRequirements] = useState<Requirement[]>([
    {
      id: '1',
      title: 'Automação de Validação de Documentos',
      description: 'Implementar sistema automatizado para validação de documentos médicos com OCR e regras de negócio configuráveis.',
      priority: 'high',
      category: 'Validação'
    },
    {
      id: '2',
      title: 'Integração de Sistemas',
      description: 'Desenvolver integração entre sistemas legados e plataforma principal para sincronização de dados em tempo real.',
      priority: 'medium',
      category: 'Integração'
    },
    {
      id: '3',
      title: 'Relatórios Automatizados',
      description: 'Criar sistema de geração automática de relatórios mensais com dados consolidados e gráficos interativos.',
      priority: 'low',
      category: 'Relatórios'
    }
  ])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error.main'
      case 'medium': return 'warning.main'
      case 'low': return 'success.main'
      default: return 'grey.main'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Não definida'
    }
  }

  const generateRequirements = () => {
    // Simular geração de requisitos baseada na análise
    const newRequirements: Requirement[] = [
      {
        id: Date.now().toString(),
        title: 'Processamento Automático de Formulários',
        description: 'Automatizar o processamento de formulários de admissão com validação de dados e integração com sistemas existentes.',
        priority: 'high',
        category: 'Processamento'
      },
      {
        id: (Date.now() + 1).toString(),
        title: 'Monitoramento de KPIs',
        description: 'Implementar dashboard automatizado para monitoramento de indicadores de performance em tempo real.',
        priority: 'medium',
        category: 'Monitoramento'
      }
    ]

    setRequirements(prev => [...prev, ...newRequirements])
    setIsDialogOpen(true)
  }

  const exportRequirements = () => {
    const content = requirements.map(req => 
      `## ${req.title}\n\n**Prioridade:** ${getPriorityLabel(req.priority)}\n**Categoria:** ${req.category}\n\n${req.description}\n\n---\n`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'requisitos-automacao.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    const content = requirements.map(req => 
      `${req.title} (${getPriorityLabel(req.priority)}) - ${req.description}`
    ).join('\n\n')

    navigator.clipboard.writeText(content)
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2,
            color: 'text.secondary',
            fontFamily: '"Antique Olive", sans-serif'
          }}
        >
          Gere requisitos de automação baseados na análise IA
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Psychology />}
          onClick={generateRequirements}
          className="btn-medsenior"
          fullWidth
          sx={{ mb: 2 }}
        >
          Gerar Requisitos
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportRequirements}
            className="btn-medsenior-secondary"
            size="small"
            sx={{ flex: 1 }}
          >
            Exportar
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={copyToClipboard}
            className="btn-medsenior-secondary"
            size="small"
            sx={{ flex: 1 }}
          >
            Copiar
          </Button>
        </Box>
      </Box>

      {/* Requirements List */}
      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
        {requirements.map((req, index) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Box 
              sx={{ 
                p: 2, 
                mb: 1, 
                border: '1px solid rgba(50, 119, 70, 0.1)',
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    flex: 1,
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 600
                  }}
                >
                  {req.title}
                </Typography>
                <Chip
                  label={getPriorityLabel(req.priority)}
                  size="small"
                  sx={{
                    bgcolor: getPriorityColor(req.priority),
                    color: 'white',
                    fontSize: '10px'
                  }}
                />
              </Box>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1,
                  color: 'text.secondary',
                  fontFamily: '"Antique Olive", sans-serif',
                  fontSize: '13px'
                }}
              >
                {req.description}
              </Typography>
              
              <Chip
                label={req.category}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontSize: '10px'
                }}
              />
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Dialog for new requirements */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Darker Grotesque", sans-serif' }}>
          Novos Requisitos Gerados
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            A IA analisou seus dados e gerou novos requisitos de automação:
          </Typography>
          {requirements.slice(-2).map((req) => (
            <Box key={req.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {req.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {req.description}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 