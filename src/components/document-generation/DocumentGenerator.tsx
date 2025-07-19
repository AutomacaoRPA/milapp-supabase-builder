import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'requirements' | 'design' | 'test_plan' | 'user_story' | 'technical_spec' | 'deployment_guide';
  content: string;
  variables: string[];
  project_id?: string;
  created_at: Date;
  updated_at: Date;
}

interface GeneratedDocument {
  id: string;
  template_id: string;
  project_id: string;
  content: string;
  variables: Record<string, string>;
  status: 'draft' | 'review' | 'approved' | 'published';
  created_at: Date;
  updated_at: Date;
}

interface DocumentGeneratorProps {
  projectId: string;
  projectData?: any;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ 
  projectId, 
  projectData 
}) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const { toast } = useToast();

  // Templates padrão
  const defaultTemplates: DocumentTemplate[] = [
    {
      id: 'req-template',
      name: 'Documento de Requisitos',
      type: 'requirements',
      content: `# Documento de Requisitos - {{project_name}}

## 1. Visão Geral
**Projeto**: {{project_name}}
**Versão**: {{version}}
**Data**: {{date}}
**Responsável**: {{responsible}}

## 2. Objetivos
{{objectives}}

## 3. Requisitos Funcionais
{{functional_requirements}}

## 4. Requisitos Não Funcionais
{{non_functional_requirements}}

## 5. Stakeholders
{{stakeholders}}

## 6. Cronograma
{{timeline}}

## 7. Critérios de Aceitação
{{acceptance_criteria}}`,
      variables: ['project_name', 'version', 'date', 'responsible', 'objectives', 'functional_requirements', 'non_functional_requirements', 'stakeholders', 'timeline', 'acceptance_criteria'],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'design-template',
      name: 'Documento de Design',
      type: 'design',
      content: `# Documento de Design - {{project_name}}

## 1. Arquitetura
{{architecture_overview}}

## 2. Diagramas
{{diagrams}}

## 3. Tecnologias
{{technologies}}

## 4. Padrões de Design
{{design_patterns}}

## 5. APIs
{{api_specifications}}

## 6. Banco de Dados
{{database_design}}

## 7. Segurança
{{security_considerations}}`,
      variables: ['project_name', 'architecture_overview', 'diagrams', 'technologies', 'design_patterns', 'api_specifications', 'database_design', 'security_considerations'],
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'test-template',
      name: 'Plano de Testes',
      type: 'test_plan',
      content: `# Plano de Testes - {{project_name}}

## 1. Estratégia de Testes
{{test_strategy}}

## 2. Tipos de Teste
{{test_types}}

## 3. Cenários de Teste
{{test_scenarios}}

## 4. Critérios de Entrada
{{entry_criteria}}

## 5. Critérios de Saída
{{exit_criteria}}

## 6. Cronograma de Testes
{{test_schedule}}

## 7. Recursos Necessários
{{test_resources}}`,
      variables: ['project_name', 'test_strategy', 'test_types', 'test_scenarios', 'entry_criteria', 'exit_criteria', 'test_schedule', 'test_resources'],
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  useEffect(() => {
    loadTemplates();
    loadGeneratedDocuments();
  }, [projectId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      // Carregar templates do backend
      const response = await fetch(`/api/v1/projects/${projectId}/document-templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates([...defaultTemplates, ...data.templates]);
      } else {
        // Usar templates padrão se não houver templates salvos
        setTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates(defaultTemplates);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGeneratedDocuments = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedDocs(data.documents || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    // Preencher variáveis com dados do projeto
    const initialVariables: Record<string, string> = {};
    template.variables.forEach(variable => {
      if (projectData && projectData[variable]) {
        initialVariables[variable] = projectData[variable];
      } else {
        initialVariables[variable] = '';
      }
    });
    setVariables(initialVariables);
  };

  const generateDocument = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      // Substituir variáveis no template
      let content = selectedTemplate.content;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Adicionar data atual
      content = content.replace(/{{date}}/g, new Date().toLocaleDateString('pt-BR'));

      // Salvar documento gerado
      const response = await fetch(`/api/v1/projects/${projectId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          content,
          variables,
          status: 'draft',
        }),
      });

      if (response.ok) {
        const newDoc = await response.json();
        setGeneratedDocs(prev => [newDoc, ...prev]);
        toast({
          title: "Documento Gerado",
          description: "Documento criado com sucesso!",
        });
        setSelectedTemplate(null);
        setVariables({});
      }
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o documento",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const previewDocument = (content: string) => {
    setPreviewContent(content);
    setPreviewDialog(true);
  };

  const downloadDocument = async (document: GeneratedDocument) => {
    try {
      const blob = new Blob([document.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document.template_id}_${document.id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o documento",
        variant: "destructive",
      });
    }
  };

  const editTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setEditDialog(true);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/document-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(editingTemplate),
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
        toast({
          title: "Template Salvo",
          description: "Template atualizado com sucesso!",
        });
        setEditDialog(false);
        setEditingTemplate(null);
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o template",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'review': return 'warning';
      case 'approved': return 'success';
      case 'published': return 'primary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'requirements': return '📋';
      case 'design': return '🎨';
      case 'test_plan': return '🧪';
      case 'user_story': return '👤';
      case 'technical_spec': return '⚙️';
      case 'deployment_guide': return '🚀';
      default: return '📄';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Geração de Documentos
      </Typography>
      <Typography variant="body1" color="textSecondary" mb={3}>
        Crie documentos automaticamente usando templates personalizáveis
      </Typography>

      <Grid container spacing={3}>
        {/* Templates */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Templates Disponíveis
            </Typography>
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {templates.map((template) => (
                  <ListItem
                    key={template.id}
                    button
                    onClick={() => handleTemplateSelect(template)}
                    selected={selectedTemplate?.id === template.id}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <Typography variant="h6">{getTypeIcon(template.type)}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={template.name}
                      secondary={`${template.variables.length} variáveis`}
                    />
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        editTemplate(template);
                      }}
                    >
                      Editar
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Geração */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Gerar Documento
            </Typography>

            {selectedTemplate ? (
              <Box>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  Preencha as variáveis para gerar o documento:
                </Typography>

                {selectedTemplate.variables.map((variable) => (
                  <TextField
                    key={variable}
                    fullWidth
                    label={variable.replace(/_/g, ' ')}
                    value={variables[variable] || ''}
                    onChange={(e) => setVariables(prev => ({
                      ...prev,
                      [variable]: e.target.value
                    }))}
                    margin="normal"
                    multiline={variable.includes('requirements') || variable.includes('objectives')}
                    rows={variable.includes('requirements') || variable.includes('objectives') ? 3 : 1}
                  />
                ))}

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={generateDocument}
                    disabled={isGenerating}
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <DocumentIcon />}
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar Documento'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setVariables({});
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Selecione um template para começar
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Documentos Gerados */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Documentos Gerados
            </Typography>

            {generatedDocs.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                Nenhum documento gerado ainda
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {generatedDocs.map((doc) => (
                  <Grid item xs={12} sm={6} md={4} key={doc.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {templates.find(t => t.id === doc.template_id)?.name || 'Documento'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Criado em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </Typography>
                        <Chip
                          label={doc.status}
                          color={getStatusColor(doc.status) as any}
                          size="small"
                        />
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<PreviewIcon />}
                          onClick={() => previewDocument(doc.content)}
                        >
                          Visualizar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => downloadDocument(doc)}
                        >
                          Baixar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Preview */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Visualizar Documento</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '60vh',
              overflow: 'auto',
            }}
          >
            {previewContent}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição de Template */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Editar Template</DialogTitle>
        <DialogContent>
          {editingTemplate && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Nome do Template"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate(prev => prev ? {
                  ...prev,
                  name: e.target.value
                } : null)}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate(prev => prev ? {
                    ...prev,
                    type: e.target.value as any
                  } : null)}
                >
                  <MenuItem value="requirements">Requisitos</MenuItem>
                  <MenuItem value="design">Design</MenuItem>
                  <MenuItem value="test_plan">Plano de Testes</MenuItem>
                  <MenuItem value="user_story">User Story</MenuItem>
                  <MenuItem value="technical_spec">Especificação Técnica</MenuItem>
                  <MenuItem value="deployment_guide">Guia de Deploy</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Conteúdo do Template"
                value={editingTemplate.content}
                onChange={(e) => setEditingTemplate(prev => prev ? {
                  ...prev,
                  content: e.target.value
                } : null)}
                margin="normal"
                multiline
                rows={15}
                helperText="Use {{variavel}} para criar variáveis"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button onClick={saveTemplate} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentGenerator; 