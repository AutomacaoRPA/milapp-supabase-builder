import { Box, Typography, Card, CardContent } from '@mui/material'
import { Security } from '@mui/icons-material'
import { motion } from 'framer-motion'

export function QualityGatesPage() {
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
          Quality Gates
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
          Bem governar qualidade e aprovações de automações
        </Typography>

        <Card className="card-medsenior">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" color="primary.main">
                Controle de Qualidade
              </Typography>
            </Box>
            <Typography variant="body2">
              G1 - G2 - G3 - G4: Gates de aprovação para qualidade
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  )
} 