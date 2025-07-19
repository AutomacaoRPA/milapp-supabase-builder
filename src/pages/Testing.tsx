import { Box, Typography, Card, CardContent } from '@mui/material'
import { BugReport } from '@mui/icons-material'
import { motion } from 'framer-motion'

export function TestingPage() {
  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 3,
            fontFamily: '"Darker Grotesque", sans-serif',
            color: 'primary.main',
            fontWeight: 600
          }}
        >
          Testes
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4,
            color: 'text.secondary',
            fontFamily: '"Antique Olive", sans-serif',
            fontSize: '1.125rem'
          }}
        >
          Bem validar automações antes da produção
        </Typography>

        <Card className="card-medsenior">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BugReport sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" color="primary.main">
                Validação e Testes
              </Typography>
            </Box>
            <Typography variant="body2">
              Testes automatizados e validação de qualidade
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  )
} 