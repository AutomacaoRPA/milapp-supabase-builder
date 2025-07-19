import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Drawer } from '@mui/material'
import { MedSeniorHeader } from './MedSeniorHeader'
import { MedSeniorSidebar } from './MedSeniorSidebar'

interface MedSeniorLayoutProps {
  children: React.ReactNode
}

export function MedSeniorLayout({ children }: MedSeniorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (item: any) => {
    navigate(item.path)
  }

  const handleProfileClick = () => {
    // TODO: Implementar menu de perfil
    console.log('Profile menu clicked')
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <MedSeniorHeader 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={handleProfileClick}
      />
      
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: '280px',
            top: '72px',
            height: 'calc(100vh - 72px)',
            borderRight: '2px solid rgba(50, 119, 70, 0.1)',
            bgcolor: 'background.paper'
          }
        }}
      >
        <MedSeniorSidebar 
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '72px',
          ml: sidebarOpen ? '280px' : 0,
          transition: 'margin 0.3s ease',
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 72px)'
        }}
      >
        <Box className="fade-in">
          {children}
        </Box>
      </Box>
    </Box>
  )
} 