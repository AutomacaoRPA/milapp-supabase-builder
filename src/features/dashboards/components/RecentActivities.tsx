import { List, ListItem, ListItemIcon, ListItemText, Avatar, Typography, Chip } from '@mui/material'
import { CheckCircle, Schedule, Warning, TrendingUp } from '@mui/icons-material'

const activities = [
  {
    id: 1,
    title: 'Projeto "Automação Financeiro" aprovado no G2',
    description: 'ROI estimado: 250% em 12 meses',
    time: '2 horas atrás',
    type: 'success',
    icon: <CheckCircle />
  },
  {
    id: 2,
    title: 'Quality Gate G3 pendente - Projeto CRM',
    description: 'Aguardando aprovação técnica',
    time: '4 horas atrás',
    type: 'warning',
    icon: <Warning />
  },
  {
    id: 3,
    title: 'Deploy realizado - Automação RH',
    description: '15 processos automatizados',
    time: '1 dia atrás',
    type: 'info',
    icon: <TrendingUp />
  },
  {
    id: 4,
    title: 'Novo projeto em Discovery',
    description: 'Análise de processo de compras',
    time: '2 dias atrás',
    type: 'primary',
    icon: <Schedule />
  },
]

export function RecentActivities() {
  return (
    <List>
      {activities.map((activity) => (
        <ListItem key={activity.id} alignItems="flex-start">
          <ListItemIcon>
            <Avatar 
              sx={{ 
                bgcolor: `${activity.type}.main`,
                width: 32,
                height: 32 
              }}
            >
              {activity.icon}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="subtitle2">
                {activity.title}
              </Typography>
            }
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {activity.description}
                </Typography>
                <Chip 
                  label={activity.time} 
                  size="small" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  )
} 