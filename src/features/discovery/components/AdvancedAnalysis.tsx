import { useState } from 'react'
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Chip, LinearProgress, Alert, Grid, Paper, Divider 
} from '@mui/material'
import { 
  Psychology, AutoAwesome, Timeline, TrendingUp, 
  Warning, CheckCircle, Schedule, Assessment 
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { ProcessAnalyzerService, ProcessAnalysis } from '../../../services/ai/ProcessAnalyzer'

interface AdvancedAnalysisProps {
  onAnalysisComplete: (analysis: ProcessAnalysis) => void
}

export function AdvancedAnalysis({ onAnalysisComplete }: AdvancedAnalysisProps) {
  const [processDescription, setProcessDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProcessAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pdd, setPdd] = useState<string>('')

  const analyzer = new ProcessAnalyzerService()

  const handleAnalyze = async () => {
    if (!processDescription.trim()) {
      setError('Por favor, descreva o processo para análise')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await analyzer.analyzeProcess(processDescription)
      setAnalysis(result)
      onAnalysisComplete(result)
    } catch (err) {
      setError('Erro ao analisar o processo. Tente novamente.')
      console.error('Erro na análise:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGeneratePDD = async () => {
    if (!analysis) return

    try {
      const pddResult = await analyzer.generatePDD(analysis, 'Processo Analisado')
      setPdd(pddResult)
    } catch (err) {
      setError('Erro ao gerar PDD. Tente novamente.')
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Baixa': return 'success'
      case 'Média': return 'warning'
      case 'Alta': return 'error'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Baixa': return 'default'
      case 'Média': return 'primary'
      case 'Alta': return 'warning'
      case 'Crítica': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3,
            color: 'primary.main',
            fontFamily: '"Darker Grotesque", sans-serif',
            fontWeight: 600
          }}
        >
          <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
          Análise Avançada de Processos
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="card-medsenior">
              <CardContent>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2,
                    color: 'primary.main',
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 600
                  }}
                >
                  Descreva o Processo
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  variant="outlined"
                  placeholder="Descreva detalhadamente o processo que deseja automatizar. Inclua informações sobre: tarefas realizadas, sistemas utilizados, frequência, volume de dados, etc."
                  value={processDescription}
                  onChange={(e) => setProcessDescription(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !processDescription.trim()}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <LinearProgress sx={{ width: 20, mr: 1 }} />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <AutoAwesome sx={{ mr: 1 }} />
                      Analisar Processo
                    </>
                  )}
                </Button>

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Analysis Results */}
        <Grid item xs={12} md={6}>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Card className="card-medsenior">
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2,
                      color: 'primary.main',
                      fontFamily: '"Darker Grotesque", sans-serif',
                      fontWeight: 600
                    }}
                  >
                    Resultado da Análise
                  </Typography>

                  {/* Summary */}
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {analysis.summary}
                    </Typography>
                  </Paper>

                  {/* KPIs */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <TrendingUp sx={{ fontSize: 24, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" color="success.main">
                          R$ {analysis.estimatedROI.toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="caption">ROI Estimado</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Schedule sx={{ fontSize: 24, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" color="primary.main">
                          {analysis.estimatedHours}h
                        </Typography>
                        <Typography variant="caption">Horas Estimadas</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Complexity & Priority */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`Complexidade: ${analysis.complexity}`}
                      color={getComplexityColor(analysis.complexity) as any}
                      size="small"
                    />
                    <Chip
                      label={`Prioridade: ${analysis.priority}`}
                      color={getPriorityColor(analysis.priority) as any}
                      size="small"
                    />
                  </Box>

                  {/* Timeline */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      <Timeline sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Cronograma: {analysis.timeline}
                    </Typography>
                  </Box>

                  {/* Generate PDD Button */}
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleGeneratePDD}
                    sx={{ mb: 2 }}
                  >
                    <Assessment sx={{ mr: 1 }} />
                    Gerar PDD Completo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </Grid>

        {/* Detailed Analysis */}
        {analysis && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Card className="card-medsenior">
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 3,
                      color: 'primary.main',
                      fontFamily: '"Darker Grotesque", sans-serif',
                      fontWeight: 600
                    }}
                  >
                    Análise Detalhada
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Opportunities */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                        <AutoAwesome sx={{ mr: 1, color: 'success.main' }} />
                        Oportunidades de Automação
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        {analysis.automationOpportunities.map((opportunity, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            • {opportunity}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>

                    {/* Tools */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                        <CheckCircle sx={{ mr: 1, color: 'primary.main' }} />
                        Ferramentas Recomendadas
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysis.recommendedTools.map((tool, index) => (
                          <Chip key={index} label={tool} size="small" />
                        ))}
                      </Box>
                    </Grid>

                    {/* Risks */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                        <Warning sx={{ mr: 1, color: 'warning.main' }} />
                        Riscos Identificados
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        {analysis.risks.map((risk, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            • {risk}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>

                    {/* Mitigations */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                        <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                        Estratégias de Mitigação
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        {analysis.mitigations.map((mitigation, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            • {mitigation}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}

        {/* PDD Document */}
        {pdd && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Card className="card-medsenior">
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2,
                      color: 'primary.main',
                      fontFamily: '"Darker Grotesque", sans-serif',
                      fontWeight: 600
                    }}
                  >
                    PDD - Process Definition Document
                  </Typography>
                  
                  <Paper 
                    sx={{ 
                      p: 3, 
                      bgcolor: 'grey.50',
                      maxHeight: 400,
                      overflowY: 'auto',
                      fontFamily: '"Antique Olive", sans-serif'
                    }}
                  >
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'inherit',
                      margin: 0
                    }}>
                      {pdd}
                    </pre>
                  </Paper>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}
      </Grid>
    </Box>
  )
} 