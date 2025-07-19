import React, { useState, useEffect } from 'react'
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material'
import {
  SmartToy,
  Add,
  Edit,
  CheckCircle,
  Warning,
  ExpandMore,
  Refresh,
  ContentCopy,
  Download,
  TrendingUp
} from '@mui/icons-material'
import { qualityAIService, AIPOPGeneration } from '../../services/ai/QualityAIService'

interface AIPOPGeneratorProps {
  projectId: string
  onPOPGenerated?: (pop: AIPOPGeneration) => void
  onSavePOP?: (popContent: any) => void
}

export function AIPOPGenerator({
  projectId,
  onPOPGenerated,
  onSavePOP
}: AIPOPGeneratorProps) {
  const [form, setForm] = useState({
    title: '',
    objective: '',
    department: '',
    materials: '',
    steps: ''
  })
  
  const [generatedPOP, setGeneratedPOP] = useState<AIPOPGeneration | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const departments = [
    'Administrativo',
    'Financeiro',
    'Recursos Humanos',
    'TI',
    'Operacional',
    'Qualidade',
    'Comercial',
    'Atendimento'
  ]

  const handleGenerate = async () => {
    if (!form.title || !form.objective || !form.department) {
      setError('Preencha os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const popResult = await qualityAIService.generatePOP(
        form.title,
        form.objective,
        form.department,
        form.materials,
        form.steps,
        projectId
      )

      setGeneratedPOP(popResult)
      onPOPGenerated?.(popResult)
    } catch (error) {
      console.error('❌ Erro ao gerar POP:', error)
      setError('Erro ao gerar POP com IA')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (generatedPOP && onSavePOP) {
      onSavePOP(generatedPOP.pop_content)
    }
  }

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Mostrar feedback de sucesso
    } catch (error) {
      console.error('❌ Erro ao copiar:', error)
    }
  }

  const formatPOPContent = (content: any) => {
    return `
# ${form.title}

## 1. OBJETIVO
${content.objetivo}

## 2. ESCOPO
Este procedimento se aplica a ${form.department}.

## 3. RESPONSÁVEIS
${content.responsaveis}

## 4. MATERIAIS E EQUIPAMENTOS
${content.materiais || 'Não especificado'}

## 5. PROCEDIMENTO
${content.procedimento}

## 6. CONTROLES E VERIFICAÇÕES
- Verificar se todas as etapas foram executadas
- Confirmar resultados esperados
- Documentar desvios se houver

## 7. DOCUMENTAÇÃO
- Registrar execução do procedimento
- Manter evidências conforme necessário

## 8. REFERÊNCIAS
${content.referencias}

---
**Versão:** 1.0
**Data:** ${new Date().toLocaleDateString()}
**Aprovado por:** [Nome do Aprovador]
    `.trim()
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <SmartToy color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Gerador de POP com IA
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Formulário de Entrada */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <TextField
                label="Título do POP"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
                required
                placeholder="Ex: Procedimento para Atendimento ao Cliente"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Objetivo"
                value={form.objective}
                onChange={(e) => setForm(prev => ({ ...prev, objective: e.target.value }))}
                fullWidth
                required
                multiline
                rows={3}
                placeholder="Descreva o objetivo principal deste procedimento..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={form.department}
                  onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                  label="Departamento"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Materiais/Equipamentos"
                value={form.materials}
                onChange={(e) => setForm(prev => ({ ...prev, materials: e.target.value }))}
                fullWidth
                placeholder="Liste os materiais necessários..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Etapas Principais (opcional)"
                value={form.steps}
                onChange={(e) => setForm(prev => ({ ...prev, steps: e.target.value }))}
                fullWidth
                multiline
                rows={4}
                placeholder="Descreva as etapas principais do procedimento..."
              />
            </Grid>
          </Grid>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <SmartToy />}
              onClick={handleGenerate}
              disabled={loading || !form.title || !form.objective || !form.department}
            >
              {loading ? 'Gerando POP...' : 'Gerar POP com IA'}
            </Button>

            {generatedPOP && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  Regenerar
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setShowPreview(true)}
                >
                  Visualizar
                </Button>
              </>
            )}
          </Box>

          {/* POP Gerado */}
          {generatedPOP && (
            <Box mt={3}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CheckCircle color="success" />
                  <Typography variant="h6" fontWeight="bold">
                    POP Gerado
                  </Typography>
                  <Chip
                    label={`${Math.round(generatedPOP.confidence_score * 100)}% confiança`}
                    color="success"
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Conteúdo Gerado:
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {formatPOPContent(generatedPOP.pop_content)}
                    </Typography>
                  </Box>
                </Box>

                {/* Sugestões */}
                {generatedPOP.suggestions.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <TrendingUp color="primary" />
                        <Typography variant="subtitle2">
                          Sugestões de Melhoria ({generatedPOP.suggestions.length})
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {generatedPOP.suggestions.map((suggestion, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircle color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={suggestion} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Documentos Similares */}
                {generatedPOP.similar_pops && generatedPOP.similar_pops.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">
                        POPs Similares Encontrados ({generatedPOP.similar_pops.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {generatedPOP.similar_pops.map((pop, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={pop.title}
                              secondary={pop.content}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Ações */}
                <Box display="flex" gap={2} mt={2}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleSave}
                  >
                    Salvar POP
                  </Button>
                  
                  <Tooltip title="Copiar para área de transferência">
                    <IconButton
                      onClick={() => handleCopyToClipboard(formatPOPContent(generatedPOP.pop_content))}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Baixar como PDF">
                    <IconButton>
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Preview */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview do POP - {form.title}
        </DialogTitle>
        
        <DialogContent>
          {generatedPOP && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography
                variant="body1"
                component="pre"
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  lineHeight: 1.6
                }}
              >
                {formatPOPContent(generatedPOP.pop_content)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowPreview(false)
              handleSave()
            }}
          >
            Salvar POP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 