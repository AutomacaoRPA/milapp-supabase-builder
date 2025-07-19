import { AppBar, Toolbar, Typography, IconButton, Box, Avatar } from '@mui/material'
import { Menu, AccountCircle, Brightness4 } from '@mui/icons-material'
import { motion } from 'framer-motion'

interface MedSeniorHeaderProps {
  onMenuClick: () => void
  onProfileClick: () => void
}

export function MedSeniorHeader({ onMenuClick, onProfileClick }: MedSeniorHeaderProps) {
  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '2px solid rgba(50, 119, 70, 0.1)',
        boxShadow: '0 2px 8px rgba(50, 119, 70, 0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: '72px', px: 3 }}>
        <IconButton 
          onClick={onMenuClick}
          sx={{ 
            mr: 2,
            color: 'primary.main',
            '&:hover': { 
              bgcolor: 'primary.light', 
              color: 'white',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <Menu />
        </IconButton>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Logo MedSênior */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              borderRadius: 2,
              color: 'white',
              fontWeight: 700,
              fontFamily: '"Darker Grotesque", sans-serif',
              fontSize: '1.25rem'
            }}>
              MS
            </Box>
            
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600,
                  color: 'primary.main',
                  lineHeight: 1.2,
                  fontSize: '1.5rem'
                }}
              >
                MILAPP
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'primary.dark',
                  fontFamily: '"Antique Olive", sans-serif',
                  display: 'block',
                  lineHeight: 1,
                  fontSize: '0.875rem'
                }}
              >
                Centro de Excelência
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'primary.main',
              fontFamily: '"Antique Olive", sans-serif',
              mr: 2,
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.875rem',
              fontStyle: 'italic'
            }}
          >
            Faz bem envelhecer bem
          </Typography>
          
          <IconButton 
            onClick={onProfileClick}
            sx={{ 
              color: 'primary.main',
              '&:hover': { 
                bgcolor: 'secondary.light',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <AccountCircle sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
} 