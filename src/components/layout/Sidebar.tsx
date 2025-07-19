import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, Box } from '@mui/material'
import { 
  Dashboard, Psychology, FolderSpecial, Security, 
  SmartToy, Code, BugReport, Rocket, Analytics, 
  Settings 
} from '@mui/icons-material'
import { useAppStore } from '@/store/app'
import { useNavigate, useLocation } from 'react-router-dom'

const menuItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard Executivo', 
    icon: <Dashboard />, 
    path: '/',
    description: 'Visão geral do Centro de Excelência'
  },
  { 
    id: 'discovery', 
    label: 'Discovery IA', 
    icon: <Psychology />, 
    path: '/discovery',
    description: 'Análise inteligente de processos'
  },
  { 
    id: 'projects', 
    label: 'Projetos Bem Estruturados', 
    icon: <FolderSpecial />, 
    path: '/projects',
    description: 'Gestão completa de projetos'
  },
  { 
    id: 'quality-gates', 
    label: 'Qualidade Bem Executada', 
    icon: <Security />, 
    path: '/quality-gates',
    description: 'Controle de qualidade e aprovações'
  },
  { 
    id: 'rpa-tools', 
    label: 'Automação Bem Feita', 
    icon: <SmartToy />, 
    path: '/rpa-tools',
    description: 'Ferramentas e recomendações RPA'
  },
  { 
    id: 'development', 
    label: 'Desenvolvimento', 
    icon: <Code />, 
    path: '/development',
    description: 'Ambiente de desenvolvimento'
  },
  { 
    id: 'testing', 
    label: 'Testes', 
    icon: <BugReport />, 
    path: '/testing',
    description: 'Validação e testes'
  },
  { 
    id: 'deployment', 
    label: 'Deploy', 
    icon: <Rocket />, 
    path: '/deployment',
    description: 'Deploy e produção'
  },
  { 
    id: 'analytics', 
    label: 'Insights Bem Apresentados', 
    icon: <Analytics />, 
    path: '/analytics',
    description: 'Analytics e relatórios'
  },
]

export function Sidebar() {
  const { setCurrentModule } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (item: typeof menuItems[0]) => {
    setCurrentModule(item.id)
    navigate(item.path)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2,
          fontFamily: '"Darker Grotesque", sans-serif',
          fontWeight: 600,
          color: 'primary.main',
          textAlign: 'center'
        }}
      >
        Módulos
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 3,
          color: 'text.secondary',
          fontFamily: '"Antique Olive", sans-serif',
          textAlign: 'center',
          fontSize: '0.875rem'
        }}
      >
        Bem envelhecer bem com automação
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(50, 119, 70, 0.1)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'primary.contrastText' : 'primary.main',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontFamily: '"Antique Olive", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}
                secondaryTypographyProps={{
                  fontFamily: '"Antique Olive", sans-serif',
                  fontSize: '0.75rem',
                  color: location.pathname === item.path ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 3 }} />
      
      <ListItem disablePadding>
        <ListItemButton 
          onClick={() => navigate('/settings')}
          sx={{
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(50, 119, 70, 0.1)',
            }
          }}
        >
          <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
            <Settings />
          </ListItemIcon>
          <ListItemText 
            primary="Configurações"
            primaryTypographyProps={{
              fontFamily: '"Antique Olive", sans-serif',
              fontWeight: 500
            }}
          />
        </ListItemButton>
      </ListItem>
    </Box>
  )
} 