import { Card, CardContent, Typography, Box, Avatar, Chip } from '@mui/material'
import { 
  CheckCircle, Schedule, Warning, Error, 
  TrendingUp, Assignment, People 
} from '@mui/icons-material'
import { motion } from 'framer-motion'

interface Activity {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  user: string
  timestamp: string
  icon: React.ReactNode
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'success',
    title: 'Automação de Validação de Documentos',
    description: 'Deploy realizado com sucesso em produção',
    user: 'Maria Silva',
    timestamp: '2 horas atrás',
    icon: <CheckCircle />
  },
  {
    id: '2',
    type: 'info',
    title: 'Novo Projeto Aprovado',
    description: 'Projeto de integração de sistemas aprovado no G2',
    user: 'João Santos',
    timestamp: '4 horas atrás',
    icon: <Assignment />
  },
  {
    id: '3',
    type: 'warning',
    title: 'Alerta de Performance',
    description: 'Automação de relatórios com latência aumentada',
    user: 'Sistema',
    timestamp: '6 horas atrás',
    icon: <Warning />
  },
  {
    id: '4',
    type: 'success',
    title: 'ROI Atualizado',
    description: 'ROI médio aumentou para 420%',
    user: 'Ana Costa',
    timestamp: '1 dia atrás',
    icon: <TrendingUp />
  },
  {
    id: '5',
    type: 'info',
    title: 'Nova Usuária Adicionada',
    description: 'Dr. Carla Oliveira adicionada ao sistema',
    user: 'Admin',
    timestamp: '1 dia atrás',
    icon: <People />
  },
  {
    id: '6',
    type: 'success',
    title: 'Testes Concluídos',
    description: 'Bateria de testes automatizados concluída',
    user: 'Pedro Lima',
    timestamp: '2 dias atrás',
    icon: <CheckCircle />
  }
]

const getActivityColor = (type: string) => {
  switch (type) {
    case 'success': return 'success.main'
    case 'warning': return 'warning.main'
    case 'error': return 'error.main'
    case 'info': return 'primary.main'
    default: return 'grey.main'
  }
}

const getActivityBgColor = (type: string) => {
  switch (type) {
    case 'success': return 'success.light'
    case 'warning': return 'warning.light'
    case 'error': return 'error.light'
    case 'info': return 'primary.light'
    default: return 'grey.light'
  }
}

export function RecentActivities() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <Card className="card-medsenior">
        <CardContent>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              color: 'primary.main',
              fontFamily: '"Darker Grotesque", sans-serif',
              fontWeight: 600
            }}
          >
            Atividades Recentes
          </Typography>
          
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + (index * 0.1), duration: 0.5 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid rgba(50, 119, 70, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'grey.50',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: getActivityBgColor(activity.type),
                      color: getActivityColor(activity.type),
                      mr: 2,
                      width: 40,
                      height: 40
                    }}
                  >
                    {activity.icon}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontFamily: '"Darker Grotesque", sans-serif',
                          fontWeight: 600,
                          color: 'primary.main',
                          mr: 1
                        }}
                      >
                        {activity.title}
                      </Typography>
                      <Chip
                        label={activity.type}
                        size="small"
                        sx={{
                          bgcolor: getActivityBgColor(activity.type),
                          color: getActivityColor(activity.type),
                          fontSize: '10px',
                          height: 20
                        }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontFamily: '"Antique Olive", sans-serif',
                        mb: 1
                      }}
                    >
                      {activity.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontFamily: '"Antique Olive", sans-serif'
                        }}
                      >
                        Por: {activity.user}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontFamily: '"Antique Olive", sans-serif'
                        }}
                      >
                        {activity.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
} 