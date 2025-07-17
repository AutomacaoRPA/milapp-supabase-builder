
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Download, Upload, Code, TestTube, GitBranch } from "lucide-react";
import { useProjectFiles, ProjectFile } from "@/hooks/useProjectFiles";
import { useForm } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentFormData } from "@/types/forms";

interface DocumentManagementProps {
  projectId: string;
}

const DocumentManagement = ({ projectId }: DocumentManagementProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { files, loading, createFile } = useProjectFiles(projectId);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fileTypes = [
    { value: "pdd", label: "PDD - Documento de Definição do Projeto", icon: FileText, color: "bg-blue-100 text-blue-800" },
    { value: "sdd", label: "SDD - Documento de Design da Solução", icon: Code, color: "bg-green-100 text-green-800" },
    { value: "bpmn", label: "BPMN - Fluxo de Processo", icon: GitBranch, color: "bg-purple-100 text-purple-800" },
    { value: "test", label: "Casos de Teste", icon: TestTube, color: "bg-orange-100 text-orange-800" },
    { value: "code", label: "Código Fonte", icon: Code, color: "bg-gray-100 text-gray-800" },
    { value: "other", label: "Outros Documentos", icon: FileText, color: "bg-yellow-100 text-yellow-800" }
  ];

  const onSubmit = async (data: any) => {
    try {
      await createFile({
        ...data,
        project_id: projectId,
        uploaded_by: "demo-user-id", // Usando ID demo para desenvolvimento
        file_path: `/projects/${projectId}/${data.name}`, // Path simulado
        file_size: null
      });
      reset();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Erro ao registrar arquivo:", error);
    }
  };

  const getFileTypeConfig = (type: string) => {
    return fileTypes.find(t => t.value === type) || fileTypes[fileTypes.length - 1];
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Tamanho não definido";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedFiles = fileTypes.map(type => ({
    ...type,
    files: files.filter(f => f.file_type === type.value)
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Documentos</h3>
          <p className="text-sm text-muted-foreground">
            {files.length} arquivos • PDD, SDD, BPMN e outros documentos
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Registrar Novo Documento</DialogTitle>
                <DialogDescription>
                  Adicione um novo documento ao projeto
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Arquivo*</Label>
                    <Input 
                      id="name" 
                      {...register("name", { required: true })}
                      placeholder="documento.pdf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_type">Tipo de Documento*</Label>
                    <Select onValueChange={(value) => setValue("file_type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {fileTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    {...register("description")}
                    placeholder="Descreva o conteúdo do documento"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Versão</Label>
                    <Input 
                      id="version" 
                      {...register("version")}
                      placeholder="1.0"
                      defaultValue="1.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_size">Tamanho (bytes)</Label>
                    <Input 
                      id="file_size" 
                      type="number"
                      {...register("file_size")}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Upload de Arquivo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Funcionalidade de upload será implementada em breve. Por enquanto, registre apenas as informações do documento.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Documento</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Arquivos Agrupados por Tipo */}
      <div className="space-y-6">
        {groupedFiles.map((group) => {
          if (group.files.length === 0) return null;
          
          const Icon = group.icon;
          
          return (
            <div key={group.value} className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium">{group.label}</h4>
                <Badge variant="outline">{group.files.length}</Badge>
              </div>
              
              <div className="grid gap-3 pl-8">
                {group.files.map((file) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {file.name}
                            <Badge className={group.color} variant="outline">
                              v{file.version}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span>Criado em {formatDate(file.created_at)}</span>
                            {file.file_size && (
                              <span>{formatFileSize(file.file_size)}</span>
                            )}
                          </CardDescription>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {file.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{file.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {files.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece registrando os documentos técnicos do projeto
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeiro Documento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentManagement;
