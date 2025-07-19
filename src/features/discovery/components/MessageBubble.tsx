import { Box, Avatar, Typography, Paper, Chip } from '@mui/material'
import { Psychology, Person } from '@mui/icons-material'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ChatMessage } from '../services/aiService'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '70%' }}>
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <Psychology />
          </Avatar>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <Paper
            sx={{
              p: 2,
              bgcolor: isUser ? 'primary.main' : 'background.paper',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
            
            {message.attachments && message.attachments.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {message.attachments.map((attachment) => (
                  <Chip
                    key={attachment.id}
                    label={`${attachment.name} (${(attachment.size / 1024).toFixed(1)}KB)`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      bgcolor: isUser ? 'rgba(255,255,255,0.1)' : 'background.paper',
                      color: 'inherit',
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
          
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: '0.75rem' }}
          >
            {format(message.timestamp, 'HH:mm', { locale: ptBR })}
          </Typography>
        </Box>
        
        {isUser && (
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
            <Person />
          </Avatar>
        )}
      </Box>
    </Box>
  )
} 