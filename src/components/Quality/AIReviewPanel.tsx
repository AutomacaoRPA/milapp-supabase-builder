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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Paper
} from '@mui/material'
import {
  SmartToy,
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
  Refresh,
  Visibility,
  Edit,
  ThumbUp,
  ThumbDown,
  Assessment,
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material'
import { qualityAIService, AIDocumentReview } from '../../services/ai/QualityAIService'

interface AIReviewPanelProps {
  documentContent: string
  documentType: string
  projectId: string
  onReviewComplete?: (review: AIDocumentReview) => void
  onApplySuggestions?: (suggestions: string[]) => void
}

export function AIReviewPanel({
  documentContent,
  documentType,
  projectId,
  onReviewComplete,
  onApplySuggestions
}: AIReviewPanelProps) {
  const [review, setReview] = useState<AIDocumentReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [logId, setLogId] = useState<string | null>(null)

  const handleReview = async () => {
    try {
      setLoading(true)
      setError(null)

      const reviewResult = await qualityAIService.reviewDocument(
        documentContent,
        documentType,
        projectId
      )

      setReview(reviewResult)
      onReviewComplete?.(reviewResult)

      // Simular logId (em produção viria do serviço)
      setLogId('log-' + Date.now())
    } catch (error) {
      console.error('❌ Erro na revisão IA:', error)
      setError('Erro ao realizar revisão com IA')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async () => {
    if (!logId || !feedback || !rating) return

    try {
      await qualityAIService.provideFeedback(logId, feedback, rating)
      setShowFeedback(false)
      setFeedback('')
      setRating(null)
    } catch (error) {
      console.error('❌ Erro ao enviar feedback:', error)
      setError('Erro ao enviar feedback')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'error'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle color="success" />
    if (score >= 6) return <Warning color="warning" />
    return <Error color="error" />
  }

  const getTrendIcon = (score: number) => {
    if (score >= 8) return <TrendingUp color="success" />
    if (score >= 6) return <TrendingFlat color="info" />
    return <TrendingDown color="error" />
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <SmartToy color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Revisão com IA
            </Typography>
            
            {!review && (
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} /> : <Assessment />}
                onClick={handleReview}
                disabled={loading}
              >
                {loading ? 'Analisando...' : 'Revisar Documento'}
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {review && (
            <Box>
              {/* Score Geral */}
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getScoreIcon(review.overall_score)}
                  <Box flex={1}>
                    <Typography variant="h5" fontWeight="bold" color={`${getScoreColor(review.overall_score)}.main`}>
                      {review.overall_score}/10
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pontuação Geral
                    </Typography>
                  </Box>
                  {getTrendIcon(review.overall_score)}
                </Box>
              </Paper>

              {/* Verificação de Conformidade */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircle color={review.compliance_check.is_compliant ? 'success' : 'error'} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Verificação de Conformidade
                    </Typography>
                    <Chip
                      label={review.compliance_check.is_compliant ? 'Conforme' : 'Não Conforme'}
                      color={review.compliance_check.is_compliant ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {review.compliance_check.missing_elements.length > 0 && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          Elementos Faltantes:
                        </Typography>
                        <List dense>
                          {review.compliance_check.missing_elements.map((element, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Error color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={element} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {review.compliance_check.recommendations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Recomendações:
                        </Typography>
                        <List dense>
                          {review.compliance_check.recommendations.map((rec, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircle color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={rec} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Problemas Identificados */}
              {review.issues.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Warning color="warning" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Problemas Identificados ({review.issues.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {review.issues.map((issue, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemIcon>
                              <Error color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {issue.description}
                                  </Typography>
                                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                    <strong>Sugestão:</strong> {issue.suggestion}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < review.issues.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Melhorias Sugeridas */}
              {review.improvements.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <TrendingUp color="success" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Melhorias Sugeridas ({review.improvements.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {review.improvements.map((improvement, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={improvement} />
                        </ListItem>
                      ))}
                    </List>
                    
                    {onApplySuggestions && (
                      <Box mt={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => onApplySuggestions(review.improvements)}
                        >
                          Aplicar Melhorias
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Documentos Similares */}
              {review.similar_documents && review.similar_documents.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Visibility />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Documentos Similares ({review.similar_documents.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {review.similar_documents.map((doc, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={doc.title}
                            secondary={doc.content}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Ações */}
              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReview}
                  disabled={loading}
                >
                  Revisar Novamente
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ThumbUp />}
                  onClick={() => setShowFeedback(true)}
                >
                  Avaliar Revisão
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Feedback */}
      <Dialog
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Avaliar Revisão da IA
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Como você avalia esta revisão?
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
              />
            </Box>
            
            <TextField
              label="Comentários (opcional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowFeedback(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleFeedback}
            variant="contained"
            disabled={!rating}
          >
            Enviar Avaliação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 