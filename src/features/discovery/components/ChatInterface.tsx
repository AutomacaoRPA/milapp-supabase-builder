import { useState } from 'react'
import { 
  Box, Typography, Avatar, Paper, TextField, IconButton 
} from '@mui/material'
import { Person, Psychology, Send } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente para descobrir oportunidades de automação. Conte-me sobre os processos que você gostaria de automatizar ou envie documentos para análise.',
      timestamp: new Date(),
    }
  ])
  
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Entendi! Vou analisar seu processo e identificar oportunidades de automação. Posso ajudar com recomendações específicas de ferramentas e estimativas de ROI.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }
  
  return (
    <Box sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto',
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 2,
          border: '1px solid rgba(50, 119, 70, 0.1)',
          mb: 2
        }}
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                mb: 3,
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: message.role === 'user' ? 'secondary.main' : 'primary.main',
                  mr: message.role === 'user' ? 0 : 2,
                  ml: message.role === 'user' ? 2 : 0,
                  width: 40,
                  height: 40
                }}
              >
                {message.role === 'user' ? <Person /> : <Psychology />}
              </Avatar>
              <Paper 
                sx={{ 
                  p: 2, 
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? 'secondary.light' : 'white',
                  color: message.role === 'user' ? 'primary.dark' : 'text.primary',
                  borderRadius: 3,
                  border: '1px solid rgba(50, 119, 70, 0.1)',
                  boxShadow: '0 2px 8px rgba(50, 119, 70, 0.1)'
                }}
              >
                <Typography 
                  sx={{ 
                    fontFamily: '"Antique Olive", sans-serif',
                    lineHeight: 1.6,
                    fontSize: '15px'
                  }}
                >
                  {message.content}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    display: 'block',
                    opacity: 0.7,
                    fontSize: '12px'
                  }}
                >
                  {format(message.timestamp, 'HH:mm')}
                </Typography>
              </Paper>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Descreva seu processo ou faça uma pergunta..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '15px',
              fontFamily: '"Antique Olive", sans-serif',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }
          }}
        />
        <IconButton 
          size="large"
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { 
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)'
            },
            '&:disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  )
} 