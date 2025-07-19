import { useCallback } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { AttachFile } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function FileUpload({ onFilesSelected, disabled = false }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.csv'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
    },
    multiple: true,
    disabled,
  })

  return (
    <Tooltip title="Anexar arquivos">
      <IconButton
        {...getRootProps()}
        disabled={disabled}
        color="primary"
        sx={{
          border: isDragActive ? '2px dashed' : '1px solid',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'primary.light' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        <AttachFile />
      </IconButton>
    </Tooltip>
  )
} 