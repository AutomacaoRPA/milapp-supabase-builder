import { useState, useCallback } from 'react'
import { 
  Box, Typography, Button, Chip, LinearProgress,
  Alert, IconButton 
} from '@mui/material'
import { 
  CloudUpload, Description, Image, Audiotrack, 
  Close, CheckCircle 
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  progress: number
  status: 'uploading' | 'completed' | 'error'
}

export function FileUploadZone() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image />
    if (type.startsWith('audio/')) return <Audiotrack />
    return <Description />
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'success.main'
    if (type.startsWith('audio/')) return 'warning.main'
    return 'primary.main'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        progress: 0,
        status: 'uploading'
      }

      setUploadedFiles(prev => [...prev, newFile])

      // Simular upload progress
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        )
      }, 200)

      // Simular completion
      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, status: 'completed' as const }
              : f
          )
        )
      }, 2000)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }, [handleFileUpload])

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : 'grey.300',
            borderRadius: 3,
            p: 3,
            textAlign: 'center',
            bgcolor: isDragOver ? 'primary.light' : 'background.default',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.light'
            }
          }}
        >
          <CloudUpload 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main', 
              mb: 2 
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              fontFamily: '"Darker Grotesque", sans-serif',
              color: 'primary.main'
            }}
          >
            Arraste arquivos aqui
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2,
              color: 'text.secondary',
              fontFamily: '"Antique Olive", sans-serif'
            }}
          >
            ou clique para selecionar
          </Typography>
          <Button
            variant="contained"
            component="label"
            className="btn-medsenior"
            sx={{ mb: 2 }}
          >
            Selecionar Arquivos
            <input
              type="file"
              multiple
              hidden
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp3,.wav"
              onChange={handleFileInput}
            />
          </Button>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              color: 'text.secondary',
              fontSize: '12px'
            }}
          >
            Suporta: PDF, DOC, TXT, Imagens, Áudio
          </Typography>
        </Box>
      </motion.div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                border: '1px solid rgba(50, 119, 70, 0.1)',
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color: getFileTypeColor(file.type), mr: 1 }}>
                  {getFileIcon(file.type)}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1,
                    fontFamily: '"Antique Olive", sans-serif'
                  }}
                >
                  {file.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => removeFile(file.id)}
                  sx={{ color: 'error.main' }}
                >
                  <Close />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
                {file.status === 'completed' && (
                  <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                )}
              </Box>

              {file.status === 'uploading' && (
                <LinearProgress 
                  variant="determinate" 
                  value={file.progress}
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'primary.main'
                    }
                  }}
                />
              )}

              {file.status === 'completed' && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mt: 1,
                    '& .MuiAlert-message': {
                      fontFamily: '"Antique Olive", sans-serif'
                    }
                  }}
                >
                  Arquivo processado com sucesso!
                </Alert>
              )}
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  )
} 