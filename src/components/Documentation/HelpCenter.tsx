import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Rating,
  Fab
} from '@mui/material'
import {
  Search,
  Help,
  Book,
  VideoLibrary,
  School,
  QuestionAnswer,
  ExpandMore,
  Close,
  ThumbUp,
  ThumbDown,
  Share,
  Bookmark,
  BookmarkBorder,
  SmartToy,
  TrendingUp,
  Star
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface DocumentationItem {
  id: string
  title: string
  slug: string
  category: string
  summary: string
  content: string
  difficulty_level: string
  tags: string[]
  view_count: number
  helpful_count: number
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful_count: number
}

interface TutorialItem {
  id: string
  title: string
  description: string
  category: string
  target_role: string
  estimated_duration_minutes: number
  difficulty_level: string
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  
  // Estados dos dados
  const [documentation, setDocumentation] = useState<DocumentationItem[]>([])
  const [faq, setFAQ] = useState<FAQItem[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [searchResults, setSearchResults] = useState<DocumentationItem[]>([])
  const [contextualHelp, setContextualHelp] = useState<DocumentationItem[]>([])
  
  // Estados de UI
  const [selectedDoc, setSelectedDoc] = useState<DocumentationItem | null>(null)
  const [showDocDialog, setShowDocDialog] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')

  useEffect(() => {
    loadHelpData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadHelpData = async () => {
    try {
      setLoading(true)

      // Carregar documentação
      const { data: docData } = await supabase
        .from('documentation')
        .select('*')
        .eq('is_published', true)
        .order('view_count', { ascending: false })

      // Carregar FAQ
      const { data: faqData } = await supabase
        .from('faq_entries')
        .select('*')
        .eq('is_active', true)
        .order('helpful_count', { ascending: false })

      // Carregar tutoriais
      const { data: tutorialData } = await supabase
        .from('interactive_tutorials')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })

      // Carregar ajuda contextual
      const { data: contextualData } = await supabase.rpc('get_contextual_help', {
        p_context: 'general',
        p_user_role: 'user'
      })

      setDocumentation(docData || [])
      setFAQ(faqData || [])
      setTutorials(tutorialData || [])
      setContextualHelp(contextualData || [])
    } catch (error) {
      console.error('❌ Erro ao carregar dados de ajuda:', error)
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    try {
      const { data } = await supabase.rpc('search_documentation', {
        p_query: searchQuery,
        p_category: selectedCategory === 'all' ? null : selectedCategory,
        p_difficulty_level: selectedDifficulty === 'all' ? null : selectedDifficulty,
        p_limit: 10
      })

      setSearchResults(data || [])
    } catch (error) {
      console.error('❌ Erro na busca:', error)
    }
  }

  const handleDocClick = async (doc: DocumentationItem) => {
    setSelectedDoc(doc)
    setShowDocDialog(true)

    // Registrar visualização
    try {
      await supabase.rpc('track_documentation_view', {
        p_doc_id: doc.id
      })
    } catch (error) {
      console.error('❌ Erro ao registrar visualização:', error)
    }
  }

  const handleFeedback = async (isHelpful: boolean) => {
    if (!selectedDoc) return

    try {
      if (isHelpful) {
        await supabase
          .from('documentation')
          .update({ helpful_count: selectedDoc.helpful_count + 1 })
          .eq('id', selectedDoc.id)
      } else {
        await supabase
          .from('documentation')
          .update({ not_helpful_count: (selectedDoc as any).not_helpful_count + 1 })
          .eq('id', selectedDoc.id)
      }

      setShowFeedback(true)
    } catch (error) {
      console.error('❌ Erro ao enviar feedback:', error)
    }
  }

  const submitFeedback = async () => {
    if (!selectedDoc || feedbackRating === 0) return

    try {
      // Aqui você pode implementar o envio do feedback detalhado
      console.log('Feedback enviado:', {
        doc_id: selectedDoc.id,
        rating: feedbackRating,
        comment: feedbackComment
      })

      setShowFeedback(false)
      setFeedbackRating(0)
      setFeedbackComment('')
    } catch (error) {
      console.error('❌ Erro ao enviar feedback:', error)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'error'
      default: return 'default'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onboarding': return <School />
      case 'workflows': return <TrendingUp />
      case 'qualidade': return <Book />
      case 'ia': return <SmartToy />
      default: return <Help />
    }
  }

  const filteredDocumentation = documentation.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false
    if (selectedDifficulty !== 'all' && doc.difficulty_level !== selectedDifficulty) return false
    return true
  })

  const filteredFAQ = faq.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
    return true
  })

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Centro de Ajuda
        </Typography>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Categoria"
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="onboarding">Primeiros Passos</MenuItem>
              <MenuItem value="workflows">Workflows</MenuItem>
              <MenuItem value="qualidade">Qualidade</MenuItem>
              <MenuItem value="ia">IA</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Dificuldade</InputLabel>
            <Select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              label="Dificuldade"
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="beginner">Iniciante</MenuItem>
              <MenuItem value="intermediate">Intermediário</MenuItem>
              <MenuItem value="advanced">Avançado</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Barra de Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar na documentação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Resultados de Busca */}
      {searchQuery && searchResults.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resultados da Busca
            </Typography>
            <List>
              {searchResults.map((doc) => (
                <ListItem key={doc.id} disablePadding>
                  <ListItemButton onClick={() => handleDocClick(doc)}>
                    <ListItemIcon>
                      {getCategoryIcon(doc.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.title}
                      secondary={doc.summary}
                    />
                    <Chip
                      label={doc.difficulty_level}
                      color={getDifficultyColor(doc.difficulty_level) as any}
                      size="small"
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Documentação" icon={<Book />} />
          <Tab label="FAQ" icon={<QuestionAnswer />} />
          <Tab label="Tutoriais" icon={<VideoLibrary />} />
          <Tab label="Ajuda Contextual" icon={<SmartToy />} />
        </Tabs>
      </Box>

      {/* Documentação Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {filteredDocumentation.map((doc) => (
            <Grid item xs={12} md={6} key={doc.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getCategoryIcon(doc.category)}
                    <Typography variant="h6">
                      {doc.title}
                    </Typography>
                  </Box>
                  
                  <Typography color="textSecondary" paragraph>
                    {doc.summary}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={doc.difficulty_level}
                      color={getDifficultyColor(doc.difficulty_level) as any}
                      size="small"
                    />
                    <Chip
                      label={`${doc.view_count} visualizações`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={() => handleDocClick(doc)}
                    startIcon={<Visibility />}
                  >
                    Ler Documentação
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* FAQ Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {filteredFAQ.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography paragraph>
                    {item.answer}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={item.category}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${item.helpful_count} úteis`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tutoriais Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {tutorials.map((tutorial) => (
            <Grid item xs={12} md={6} key={tutorial.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <VideoLibrary color="primary" />
                    <Typography variant="h6">
                      {tutorial.title}
                    </Typography>
                  </Box>
                  
                  <Typography color="textSecondary" paragraph>
                    {tutorial.description}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={tutorial.difficulty_level}
                      color={getDifficultyColor(tutorial.difficulty_level) as any}
                      size="small"
                    />
                    <Chip
                      label={`${tutorial.estimated_duration_minutes}min`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={tutorial.target_role}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<School />}
                  >
                    Iniciar Tutorial
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Ajuda Contextual Tab */}
      <TabPanel value={tabValue} index={3}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            A IA analisa seu contexto e sugere a documentação mais relevante para você.
          </Typography>
        </Alert>
        
        <Grid container spacing={3}>
          {contextualHelp.map((doc) => (
            <Grid item xs={12} md={6} key={doc.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SmartToy color="primary" />
                    <Typography variant="h6">
                      {doc.title}
                    </Typography>
                    <Chip
                      label={`${Math.round(doc.relevance_score * 100)}% relevante`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  
                  <Typography color="textSecondary" paragraph>
                    {doc.content_preview}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={() => handleDocClick(doc)}
                    startIcon={<Visibility />}
                  >
                    Ler Documentação
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Dialog de Documentação */}
      <Dialog
        open={showDocDialog}
        onClose={() => setShowDocDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedDoc?.title}
            </Typography>
            <IconButton onClick={() => setShowDocDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedDoc && (
            <Box>
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={selectedDoc.difficulty_level}
                  color={getDifficultyColor(selectedDoc.difficulty_level) as any}
                  size="small"
                />
                <Chip
                  label={`${selectedDoc.view_count} visualizações`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`${selectedDoc.helpful_count} úteis`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                {selectedDoc.content}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Esta documentação foi útil?
              </Typography>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<ThumbUp />}
                  onClick={() => handleFeedback(true)}
                >
                  Sim
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ThumbDown />}
                  onClick={() => handleFeedback(false)}
                >
                  Não
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDocDialog(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Feedback */}
      <Dialog
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Avalie esta documentação
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>Classificação:</Typography>
              <Rating
                value={feedbackRating}
                onChange={(e, newValue) => setFeedbackRating(newValue || 0)}
              />
            </Box>
            
            <TextField
              label="Comentário (opcional)"
              multiline
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowFeedback(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submitFeedback}
            disabled={feedbackRating === 0}
          >
            Enviar Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB de Ajuda Rápida */}
      <Fab
        color="primary"
        aria-label="ajuda rápida"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setTabValue(3)} // Ir para ajuda contextual
      >
        <Help />
      </Fab>
    </Box>
  )
} 