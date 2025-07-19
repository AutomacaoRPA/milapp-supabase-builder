import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
         Divider, Typography, Box } from '@mui/material'
import { 
  Psychology, FolderSpecial, Security, SmartToy, 
  Code, BugReport, Rocket, Analytics, Dashboard
} from '@mui/icons-material'
import { motion } from 'framer-motion'

interface ModuleItem {
  id: string
  label: string
  subtitle: string
  icon: React.ReactNode
  path: string
}

interface MedSeniorSidebarProps {
  currentPath: string
  onNavigate: (item: ModuleItem) => void
}

const moduleItems: ModuleItem[] = [
  { 
    id: 'dashboard', 
    label: 'Visão Geral', 
    subtitle: 'bem monitorar',
    icon: <Dashboard />, 
    path: '/' 
  },
  { 
    id: 'discovery', 
    label: 'Discovery IA', 
    subtitle: 'bem descobrir',
    icon: <Psychology />, 
    path: '/discovery' 
  },
  { 
    id: 'projects', 
    label: 'Projetos', 
    subtitle: 'bem gerenciar',
    icon: <FolderSpecial />, 
    path: '/projects' 
  },
  { 
    id: 'quality-gates', 
    label: 'Quality Gates', 
    subtitle: 'bem governar',
    icon: <Security />, 
    path: '/quality-gates' 
  },
  { 
    id: 'automation', 
    label: 'Automação RPA', 
    subtitle: 'bem automatizar',
    icon: <SmartToy />, 
    path: '/automation' 
  },
  { 
    id: 'development', 
    label: 'Desenvolvimento', 
    subtitle: 'bem desenvolver',
    icon: <Code />, 
    path: '/development' 
  },
  { 
    id: 'testing', 
    label: 'Testes', 
    subtitle: 'bem validar',
    icon: <BugReport />, 
    path: '/testing' 
  },
  { 
    id: 'deployment', 
    label: 'Deploy', 
    subtitle: 'bem entregar',
    icon: <Rocket />, 
    path: '/deployment' 
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    subtitle: 'bem analisar',
    icon: <Analytics />, 
    path: '/analytics' 
  }
]

export function MedSeniorSidebar({ currentPath, onNavigate }: MedSeniorSidebarProps) {
  return (
    <Box sx={{ 
      width: '280px', 
      height: '100%', 
      bgcolor: 'background.paper',
      borderRight: '2px solid rgba(50, 119, 70, 0.1)'
    }}>
      <Box sx={{ p: 3, pt: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: '"Darker Grotesque", sans-serif',
            color: 'primary.main',
            fontWeight: 600,
            mb: 1,
            fontSize: '1.25rem'
          }}
        >
          Módulos do Centro
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            fontFamily: '"Antique Olive", sans-serif',
            fontSize: '14px',
            fontStyle: 'italic'
          }}
        >
          Bem estruturados para bem envelhecer
        </Typography>
      </Box>

      <Divider sx={{ mx: 2, borderColor: 'primary.light' }} />

      <List sx={{ px: 2, py: 1 }}>
        {moduleItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={currentPath === item.path}
                onClick={() => onNavigate(item)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white'
                    },
                    '& .MuiListItemText-secondary': {
                      color: 'rgba(255,255,255,0.8)'
                    }
                  },
                  '&:hover': {
                    bgcolor: 'secondary.light',
                    color: 'primary.dark',
                    transform: 'translateX(4px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <ListItemIcon sx={{ 
                  color: currentPath === item.path ? 'white' : 'primary.main', 
                  minWidth: 40 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography 
                      sx={{ 
                        fontFamily: '"Antique Olive", sans-serif',
                        fontWeight: 500,
                        fontSize: '15px'
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      sx={{ 
                        fontFamily: '"Antique Olive", sans-serif',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        opacity: 0.8
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Box>
  )
} 