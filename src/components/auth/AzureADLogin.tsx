import { useState } from 'react'
import { 
  Box, Button, Card, CardContent, Typography, 
  Alert, CircularProgress, Paper 
} from '@mui/material'
import { 
  Microsoft, Security, Business, 
  CheckCircle, Error, Info 
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { AzureADService } from '../../services/auth/AzureADService'

interface AzureADLoginProps {
  onLoginSuccess: (user: any) => void
  onLoginError: (error: string) => void
}

export function AzureADLogin({ onLoginSuccess, onLoginError }: AzureADLoginProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const azureADService = new AzureADService()

  const handleMicrosoftLogin = async () => {
    setIsLoading(true)
    setError(null)
    setInfo('🏥 Conectando ao Azure AD MedSênior...')

    try {
      const user = await azureADService.signInWithMicrosoft()
      
      setInfo('✅ Autenticação bem sucedida!')
      
      setTimeout(() => {
        onLoginSuccess(user)
      }, 1000)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      onLoginError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      bgcolor: 'grey.50'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card 
          sx={{ 
            maxWidth: 400, 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(50, 119, 70, 0.15)',
            border: '1px solid rgba(50, 119, 70, 0.1)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 1
                }}
              >
                MILAPP MedSênior
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'secondary.main',
                  fontFamily: '"Antique Olive", sans-serif',
                  fontWeight: 500,
                  mb: 2
                }}
              >
                Centro de Excelência
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontFamily: '"Antique Olive", sans-serif'
                }}
              >
                Acesse com sua conta corporativa MedSênior
              </Typography>
            </Box>

            {/* Info Alert */}
            {info && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  icon={<Info />} 
                  severity="info" 
                  sx={{ mb: 3 }}
                >
                  {info}
                </Alert>
              </motion.div>
            )}

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  icon={<Error />} 
                  severity="error" 
                  sx={{ mb: 3 }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            {/* Login Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Microsoft />
                )
              }
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 2,
                fontSize: '16px',
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(50, 119, 70, 0.3)'
                },
                '&:disabled': {
                  bgcolor: 'grey.400'
                }
              }}
            >
              {isLoading ? 'Conectando...' : 'Entrar com Microsoft'}
            </Button>

            {/* Features */}
            <Box sx={{ mt: 4 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 2,
                  color: 'text.secondary',
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                Benefícios da autenticação corporativa:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Security sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                <Typography variant="body2" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                  Segurança empresarial
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Business sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                  Acesso unificado
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                <Typography variant="body2" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                  Controle de permissões
                </Typography>
              </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'grey.200' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontFamily: '"Antique Olive", sans-serif',
                  textAlign: 'center',
                  display: 'block'
                }}
              >
                © 2024 MedSênior - Centro de Excelência em Automação
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontFamily: '"Antique Olive", sans-serif',
                  textAlign: 'center',
                  display: 'block',
                  mt: 0.5
                }}
              >
                bem envelhecer bem
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  )
} 