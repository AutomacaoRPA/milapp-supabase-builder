import { Box, Typography, Card, CardContent, Button, Grid } from '@mui/material'
import { Psychology, Upload, Chat } from '@mui/icons-material'
import { motion } from 'framer-motion'

export function DiscoveryPage() {
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
          Discovery IA
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
          Bem descobrir processos para automação com inteligência artificial
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="card-medsenior">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Psychology sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="primary.main">
                    Análise Inteligente
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Upload de documentos e análise automática de processos
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Upload />}
                  className="btn-medsenior"
                >
                  Upload de Documentos
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card className="card-medsenior">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chat sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" color="primary.main">
                    Chat IA
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Conversa inteligente para descoberta de oportunidades
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<Chat />}
                  className="btn-medsenior-secondary"
                >
                  Iniciar Conversa
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  )
} 