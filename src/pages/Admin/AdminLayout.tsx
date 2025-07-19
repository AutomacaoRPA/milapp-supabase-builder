import React, { useState, useEffect } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Menu as MenuIcon,
  Settings,
  People,
  Security,
  Notifications,
  Assessment,
  Build,
  Dashboard,
  AdminPanelSettings,
  ChevronRight,
  AccountCircle,
  Logout,
  Warning
} from '@mui/icons-material'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useCurrentRole } from '../../hooks/useCurrentRole'
import { supabase } from '../../services/supabase/client'

const drawerWidth = 280

interface AdminMenuItem {
  title: string
  path: string
  icon: React.ReactNode
  description: string
  requiredRole: 'superadmin' | 'gestor_global' | 'gestor'
  badge?: string
}

const adminMenuItems: AdminMenuItem[] = [
  {
    title: 'Dashboard',
    path: '/admin',
    icon: <Dashboard />,
    description: 'Visão geral do sistema',
    requiredRole: 'gestor'
  },
  {
    title: 'Configurações',
    path: '/admin/settings',
    icon: <Settings />,
    description: 'Parâmetros globais e integrações',
    requiredRole: 'gestor_global'
  },
  {
    title: 'Usuários',
    path: '/admin/users',
    icon: <People />,
    description: 'Gestão de usuários e convites',
    requiredRole: 'gestor_global'
  },
  {
    title: 'Permissões',
    path: '/admin/rbac',
    icon: <Security />,
    description: 'Controle de acesso e papéis',
    requiredRole: 'superadmin'
  },
  {
    title: 'Notificações',
    path: '/admin/notifications',
    icon: <Notifications />,
    description: 'Canais e preferências',
    requiredRole: 'gestor_global'
  },
  {
    title: 'Auditoria',
    path: '/admin/audit',
    icon: <Assessment />,
    description: 'Logs e rastreabilidade',
    requiredRole: 'gestor_global'
  },
  {
    title: 'Ambientes',
    path: '/admin/environments',
    icon: <Build />,
    description: 'Pipelines e deploys',
    requiredRole: 'superadmin'
  }
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentRole, hasPermission } = useCurrentRole()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Verificar se usuário tem papel administrativo
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['superadmin', 'gestor_global', 'gestor'])

      if (!userRoles || userRoles.length === 0) {
        navigate('/dashboard')
        return
      }

      setUser(user)
    } catch (error) {
      console.error('❌ Erro ao verificar acesso admin:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const path = '/' + pathSegments.slice(0, i + 1).join('/')
      
      if (segment === 'admin') {
        breadcrumbs.push({ label: 'Administração', path })
      } else {
        const menuItem = adminMenuItems.find(item => item.path.includes(segment))
        breadcrumbs.push({ 
          label: menuItem?.title || segment.charAt(0).toUpperCase() + segment.slice(1), 
          path 
        })
      }
    }
    
    return breadcrumbs
  }

  const canAccessMenuItem = (item: AdminMenuItem) => {
    if (item.requiredRole === 'superadmin') {
      return currentRole === 'superadmin'
    }
    if (item.requiredRole === 'gestor_global') {
      return ['superadmin', 'gestor_global'].includes(currentRole)
    }
    return ['superadmin', 'gestor_global', 'gestor'].includes(currentRole)
  }

  const filteredMenuItems = adminMenuItems.filter(canAccessMenuItem)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={1}>
          <AdminPanelSettings color="primary" />
          <Typography variant="h6" fontWeight="bold">
            MILAPP Admin
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                secondary={item.description}
              />
              {item.badge && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  color="error" 
                  sx={{ ml: 1 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box p={2}>
        <Typography variant="caption" color="text.secondary">
          Papel atual: {currentRole}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Breadcrumbs separator={<ChevronRight fontSize="small" />}>
              {getBreadcrumbs().map((breadcrumb, index) => (
                <Link
                  key={breadcrumb.path}
                  color="inherit"
                  href={breadcrumb.path}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(breadcrumb.path)
                  }}
                  sx={{ 
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {breadcrumb.label}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<Warning />}
              label="Admin Mode"
              color="warning"
              size="small"
            />
            
            <IconButton
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Modo Administrativo:</strong> Você está no painel de administração do sistema. 
            Todas as ações são registradas para auditoria.
          </Typography>
        </Alert>
        
        <Outlet />
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => navigate('/dashboard')}>
          <ListItemIcon>
            <Dashboard fontSize="small" />
          </ListItemIcon>
          Voltar ao Dashboard
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </Box>
  )
} 