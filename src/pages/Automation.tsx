import { Box, Typography, Card, CardContent } from '@mui/material'
import { SmartToy } from '@mui/icons-material'
import { motion } from 'framer-motion'

export function AutomationPage() {
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
          Automação RPA
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
          Bem automatizar processos com ferramentas RPA
        </Typography>

        <Card className="card-medsenior">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SmartToy sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" color="primary.main">
                Ferramentas RPA
              </Typography>
            </Box>
            <Typography variant="body2">
              Recomendações e matriz de decisão para automação
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  )
} 