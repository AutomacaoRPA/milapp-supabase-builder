import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Image, 
  File, 
  Archive,
  Video,
  Music
} from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onUpload: (file: File) => void;
  onDelete: (attachmentId: string) => void;
  onDownload: (attachment: Attachment) => void;
  onView: (attachment: Attachment) => void;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onUpload,
  onDelete,
  onDownload,
  onView,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Arraste e solte arquivos aqui ou
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />
              <Button variant="outline" size="sm">
                Selecionar Arquivos
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Máximo 10MB por arquivo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-gray-500">
                      {getFileIcon(attachment.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {attachment.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(attachment.size)}</span>
                        <span>•</span>
                        <span>{attachment.uploaded_by}</span>
                        <span>•</span>
                        <span>{formatDate(attachment.uploaded_at)}</span>
                      </div>
                      {attachment.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(attachment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(attachment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {attachments.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{attachments.length} arquivo(s) anexado(s)</span>
          <span>
            Total: {formatFileSize(attachments.reduce((sum, a) => sum + a.size, 0))}
          </span>
        </div>
      )}
    </div>
  );
};

export default AttachmentManager; 