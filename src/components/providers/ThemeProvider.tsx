import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { useAppStore } from '@/store/app'
import { medSeniorTheme, medSeniorDarkTheme } from '@/styles/medsenior-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore()
  
  return (
    <MuiThemeProvider theme={theme === 'light' ? medSeniorTheme : medSeniorDarkTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
} 