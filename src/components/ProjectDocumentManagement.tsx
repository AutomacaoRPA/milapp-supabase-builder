import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Eye,
  Upload,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  Calendar,
  User
} from "lucide-react";
import { ProjectDocument } from "@/types/project-lifecycle";

interface ProjectDocumentManagementProps {
  projectId: string;
}

const ProjectDocumentManagement: React.FC<ProjectDocumentManagementProps> = ({ projectId }) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ProjectDocument | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "requirements" as "requirements" | "design" | "technical" | "testing" | "deployment" | "other",
    version: "1.0",
    file_url: ""
  });

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // TODO: Implementar busca no backend
      // Mock data para demonstração
      const mockDocuments: ProjectDocument[] = [
        {
          id: "1",
          project_id: projectId,
          title: "Documento de Requisitos",
          description: "Especificação completa dos requisitos funcionais e não funcionais",
          category: "requirements",
          version: "1.0",
          file_url: "/documents/requirements.pdf",
          file_size: 2048576,
          file_type: "pdf",
          created_by: "João Silva",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          project_id: projectId,
          title: "Wireframes do Sistema",
          description: "Protótipos visuais das telas principais",
          category: "design",
          version: "2.1",
          file_url: "/documents/wireframes.figma",
          file_size: 1048576,
          file_type: "figma",
          created_by: "Maria Santos",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          project_id: projectId,
          title: "Arquitetura Técnica",
          description: "Documentação da arquitetura e decisões técnicas",
          category: "technical",
          version: "1.2",
          file_url: "/documents/architecture.md",
          file_size: 512000,
          file_type: "md",
          created_by: "Pedro Costa",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setDocuments(mockDocuments);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "requirements": return "bg-blue-100 text-blue-800";
      case "design": return "bg-purple-100 text-purple-800";
      case "technical": return "bg-green-100 text-green-800";
      case "testing": return "bg-orange-100 text-orange-800";
      case "deployment": return "bg-red-100 text-red-800";
      case "other": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "requirements": return <FileText className="h-4 w-4" />;
      case "design": return <FileImage className="h-4 w-4" />;
      case "technical": return <File className="h-4 w-4" />;
      case "testing": return <FileText className="h-4 w-4" />;
      case "deployment": return <FileArchive className="h-4 w-4" />;
      case "other": return <File className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf": return <FileText className="h-4 w-4" />;
      case "doc":
      case "docx": return <FileText className="h-4 w-4" />;
      case "xls":
      case "xlsx": return <FileText className="h-4 w-4" />;
      case "ppt":
      case "pptx": return <FileText className="h-4 w-4" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif": return <FileImage className="h-4 w-4" />;
      case "mp4":
      case "avi":
      case "mov": return <FileVideo className="h-4 w-4" />;
      case "zip":
      case "rar":
      case "7z": return <FileArchive className="h-4 w-4" />;
      case "figma": return <FileImage className="h-4 w-4" />;
      case "md": return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const newDocument: ProjectDocument = {
      id: editingDocument?.id || Date.now().toString(),
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      version: formData.version,
      file_url: formData.file_url,
      file_size: 0,
      file_type: "pdf",
      created_by: "Usuário Atual",
      created_at: editingDocument?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingDocument) {
      setDocuments(prev => prev.map(doc => 
        doc.id === editingDocument.id ? newDocument : doc
      ));
    } else {
      setDocuments(prev => [...prev, newDocument]);
    }

    // TODO: Salvar no backend
    console.log('Documento salvo:', newDocument);

    setShowAddForm(false);
    setEditingDocument(null);
    setFormData({
      title: "",
      description: "",
      category: "requirements",
      version: "1.0",
      file_url: ""
    });
  };

  const handleEdit = (document: ProjectDocument) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description,
      category: document.category,
      version: document.version,
      file_url: document.file_url
    });
    setShowAddForm(true);
  };

  const handleDelete = async (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    // TODO: Remover do backend
    console.log('Documento removido:', documentId);
  };

  const handleDownload = (document: ProjectDocument) => {
    // TODO: Implementar download real
    console.log('Downloading:', document.file_url);
    window.open(document.file_url, '_blank');
  };

  const documentCounts = {
    requirements: documents.filter(d => d.category === "requirements").length,
    design: documents.filter(d => d.category === "design").length,
    technical: documents.filter(d => d.category === "technical").length,
    testing: documents.filter(d => d.category === "testing").length,
    deployment: documents.filter(d => d.category === "deployment").length,
    other: documents.filter(d => d.category === "other").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Documentos</h2>
          <p className="text-muted-foreground">
            Organize e gerencie todos os documentos do projeto
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Document Summary */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requisitos</p>
                <p className="text-2xl font-bold text-blue-600">{documentCounts.requirements}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileImage className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Design</p>
                <p className="text-2xl font-bold text-purple-600">{documentCounts.design}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <File className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Técnico</p>
                <p className="text-2xl font-bold text-green-600">{documentCounts.technical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Testes</p>
                <p className="text-2xl font-bold text-orange-600">{documentCounts.testing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <FileArchive className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deploy</p>
                <p className="text-2xl font-bold text-red-600">{documentCounts.deployment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <File className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outros</p>
                <p className="text-2xl font-bold text-gray-600">{documentCounts.other}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingDocument ? "Editar Documento" : "Novo Documento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Documento *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Documento de Requisitos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requirements">Requisitos</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="testing">Testes</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="Ex: 1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_url">URL do Arquivo</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                  placeholder="Ex: /documents/arquivo.pdf"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o documento..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingDocument ? "Atualizar" : "Adicionar"} Documento
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDocument(null);
                  setFormData({
                    title: "",
                    description: "",
                    category: "requirements",
                    version: "1.0",
                    file_url: ""
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Documentos do Projeto</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-muted-foreground">Nenhum documento adicionado</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Documento" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getFileIcon(document.file_type)}
                          <h4 className="font-medium">{document.title}</h4>
                        </div>
                        <Badge className={getCategoryColor(document.category)}>
                          {getCategoryIcon(document.category)}
                          <span className="ml-1">
                            {document.category === "requirements" ? "Requisitos" :
                             document.category === "design" ? "Design" :
                             document.category === "technical" ? "Técnico" :
                             document.category === "testing" ? "Testes" :
                             document.category === "deployment" ? "Deployment" : "Outros"}
                          </span>
                        </Badge>
                        <Badge variant="outline">v{document.version}</Badge>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {document.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(document.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {document.created_by}
                        </div>
                        {document.file_size > 0 && (
                          <div>
                            {formatFileSize(document.file_size)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(document)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDocumentManagement; 