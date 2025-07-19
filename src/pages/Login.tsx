import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AzureADLogin } from '../components/auth/AzureADLogin'

export function LoginPage() {
  const { user, signIn, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Se já estiver autenticado, redirecionar para dashboard
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleLoginSuccess = (user: any) => {
    console.log('🎉 Login bem sucedido:', user.name)
    navigate('/dashboard')
  }

  const handleLoginError = (errorMessage: string) => {
    console.error('❌ Erro no login:', errorMessage)
  }

  return (
    <AzureADLogin 
      onLoginSuccess={handleLoginSuccess}
      onLoginError={handleLoginError}
    />
  )
} 