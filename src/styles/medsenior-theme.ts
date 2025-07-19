import { createTheme } from '@mui/material/styles'

export const medSeniorTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#327746', // Verde primário MedSênior
      light: '#4aa455',
      dark: '#20463c',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#95c11f', // Verde claro MedSênior
      light: '#bfcf52',
      dark: '#74a455',
      contrastText: '#ffffff'
    },
    success: {
      main: '#4aa455',
      light: '#95c11f',
      dark: '#327746'
    },
    warning: {
      main: '#e69732',
      light: '#e7e365',
      dark: '#c86c46'
    },
    error: {
      main: '#c32f26',
      light: '#703987',
      dark: '#5d3f1d'
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    },
    text: {
      primary: '#20463c',
      secondary: '#327746'
    }
  },
  typography: {
    fontFamily: '"Darker Grotesque", "Antique Olive", "Inter", "Roboto", sans-serif',
    h1: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 700,
      color: '#327746',
      fontSize: '2.5rem',
      lineHeight: 1.2
    },
    h2: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 600,
      color: '#327746',
      fontSize: '2rem',
      lineHeight: 1.3
    },
    h3: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 600,
      color: '#327746',
      fontSize: '1.75rem',
      lineHeight: 1.3
    },
    h4: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 600,
      color: '#327746',
      fontSize: '1.5rem',
      lineHeight: 1.4
    },
    h5: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 500,
      color: '#327746',
      fontSize: '1.25rem',
      lineHeight: 1.4
    },
    h6: {
      fontFamily: '"Darker Grotesque", sans-serif',
      fontWeight: 500,
      color: '#327746',
      fontSize: '1.125rem',
      lineHeight: 1.4
    },
    body1: {
      fontFamily: '"Antique Olive", sans-serif',
      fontWeight: 400,
      color: '#20463c',
      lineHeight: 1.6,
      fontSize: '1.125rem'
    },
    body2: {
      fontFamily: '"Antique Olive", sans-serif',
      fontWeight: 400,
      color: '#327746',
      lineHeight: 1.5,
      fontSize: '1rem'
    },
    button: {
      fontFamily: '"Antique Olive", sans-serif',
      fontWeight: 500,
      textTransform: 'none',
      fontSize: '1rem'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
          padding: '14px 28px',
          fontSize: '1rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(50, 119, 70, 0.3)',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        contained: {
          backgroundColor: '#327746',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#4aa455'
          }
        },
        outlined: {
          borderColor: '#327746',
          color: '#327746',
          '&:hover': {
            backgroundColor: 'rgba(50, 119, 70, 0.1)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(50, 119, 70, 0.1)',
          border: '1px solid rgba(50, 119, 70, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 24px rgba(50, 119, 70, 0.15)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#327746',
          boxShadow: '0 2px 8px rgba(50, 119, 70, 0.1)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(50, 119, 70, 0.1)'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#327746'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#327746'
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontFamily: '"Antique Olive", sans-serif',
          fontWeight: 500
        }
      }
    }
  },
  shape: {
    borderRadius: 12
  },
  spacing: 8
})

// Tema escuro para acessibilidade
export const medSeniorDarkTheme = createTheme({
  ...medSeniorTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4aa455',
      light: '#95c11f',
      dark: '#327746',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#bfcf52',
      light: '#e7e365',
      dark: '#95c11f',
      contrastText: '#20463c'
    },
    background: {
      default: '#20463c',
      paper: '#2a5a4a'
    },
    text: {
      primary: '#ffffff',
      secondary: '#e7e365'
    }
  }
}) 