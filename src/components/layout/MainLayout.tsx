import { Box, Drawer, Toolbar } from '@mui/material'
import { useAppStore } from '@/store/app'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const DRAWER_WIDTH = 280

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={toggleSidebar} />

      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid rgba(50, 119, 70, 0.1)'
          },
        }}
      >
        <Toolbar />
        <Sidebar />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          backgroundColor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Box className="fade-in">
          {children}
        </Box>
      </Box>
    </Box>
  )
} 