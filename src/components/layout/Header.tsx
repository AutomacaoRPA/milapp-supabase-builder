import { AppBar, Toolbar, Typography, Box, IconButton, Avatar } from '@mui/material'
import { Menu, Brightness4, Brightness7 } from '@mui/icons-material'
import { useAppStore } from '@/store/app'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useAppStore()

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 2px 8px rgba(50, 119, 70, 0.1)',
        borderBottom: '1px solid rgba(50, 119, 70, 0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{ 
            mr: 2,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(50, 119, 70, 0.1)'
            }
          }}
        >
          <Menu />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {/* Logo MedSênior */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 3,
            p: 1,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                fontFamily: '"Darker Grotesque", sans-serif',
                fontSize: '1.25rem'
              }}
            >
              MS
            </Typography>
          </Box>
          
          <Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                fontFamily: '"Darker Grotesque", sans-serif',
                color: 'primary.main',
                fontSize: '1.5rem',
                lineHeight: 1.2
              }}
            >
              MILAPP
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontFamily: '"Antique Olive", sans-serif',
                fontSize: '0.875rem'
              }}
            >
              Centro de Excelência em Automação
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            sx={{ 
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(50, 119, 70, 0.1)'
              }
            }}
          >
            {theme === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>

          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  )
} 