import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Button, 
  IconButton, Chip, Alert 
} from '@mui/material'
import { 
  Download, Close, Phone, Computer, 
  CheckCircle, Info 
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent
  }
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Verificar se PWA é suportada
    const checkPWASupport = () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(isSupported)
      
      if (isSupported) {
        // Verificar se já está instalado
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        setIsInstalled(isStandalone)
        
        if (!isStandalone) {
          // Mostrar prompt após delay
          setTimeout(() => {
            setShowPrompt(true)
          }, 5000)
        }
      }
    }

    checkPWASupport()

    // Listener para beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      window.deferredPrompt = e
      setShowPrompt(true)
    }

    // Listener para appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      console.log('✅ MILAPP MedSênior instalado com sucesso')
    }

    // Listener para mudanças no display mode
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches)
      if (e.matches) {
        setShowPrompt(false)
      }
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const handleInstall = async () => {
    if (!window.deferredPrompt) {
      console.log('❌ Prompt de instalação não disponível')
      return
    }

    try {
      // Mostrar prompt de instalação
      await window.deferredPrompt.prompt()
      
      // Aguardar escolha do usuário
      const { outcome } = await window.deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalação MedSênior')
        setIsInstalled(true)
      } else {
        console.log('❌ Usuário rejeitou instalação MedSênior')
      }
      
      // Limpar prompt
      window.deferredPrompt = null
      setShowPrompt(false)
      
    } catch (error) {
      console.error('Erro na instalação:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Salvar preferência para não mostrar novamente
    localStorage.setItem('medsenior-pwa-dismissed', 'true')
  }

  const handleManualInstall = () => {
    // Instruções para instalação manual
    const instructions = `
      Para instalar o MILAPP MedSênior:
      
      📱 iOS (Safari):
      1. Toque no botão Compartilhar
      2. Selecione "Adicionar à Tela Inicial"
      3. Toque em "Adicionar"
      
      🤖 Android (Chrome):
      1. Toque no menu (3 pontos)
      2. Selecione "Adicionar à tela inicial"
      3. Toque em "Adicionar"
      
      💻 Desktop (Chrome):
      1. Clique no ícone de instalação na barra de endereços
      2. Clique em "Instalar"
    `
    
    alert(instructions)
  }

  if (!isSupported || isInstalled || !showPrompt) {
    return null
  }

  // Verificar se foi rejeitado anteriormente
  const wasDismissed = localStorage.getItem('medsenior-pwa-dismissed') === 'true'
  if (wasDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          maxWidth: 350
        }}
      >
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(50, 119, 70, 0.2)',
            border: '1px solid rgba(50, 119, 70, 0.1)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: 'primary.main', 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <Download sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  Instalar MILAPP
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontFamily: '"Antique Olive", sans-serif'
                  }}
                >
                  Centro de Excelência MedSênior
                </Typography>
              </Box>
              
              <IconButton 
                size="small" 
                onClick={handleDismiss}
                sx={{ color: 'text.secondary' }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Content */}
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2,
                fontFamily: '"Antique Olive", sans-serif',
                lineHeight: 1.5
              }}
            >
              Instale o MILAPP MedSênior no seu dispositivo para acesso rápido e 
              funcionalidades offline. Bem envelhecer bem com tecnologia!
            </Typography>

            {/* Benefits */}
            <Box sx={{ mb: 3 }}>
              <Chip 
                icon={<CheckCircle />} 
                label="Acesso Offline" 
                size="small" 
                sx={{ mr: 1, mb: 1, fontFamily: '"Antique Olive", sans-serif' }}
              />
              <Chip 
                icon={<Phone />} 
                label="App Nativo" 
                size="small" 
                sx={{ mr: 1, mb: 1, fontFamily: '"Antique Olive", sans-serif' }}
              />
              <Chip 
                icon={<Computer />} 
                label="Notificações" 
                size="small" 
                sx={{ fontFamily: '"Antique Olive", sans-serif' }}
              />
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Download />}
                onClick={handleInstall}
                sx={{
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                Instalar
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={handleManualInstall}
                sx={{
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                <Info />
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontFamily: '"Antique Olive", sans-serif',
                  fontStyle: 'italic'
                }}
              >
                Instalação gratuita e segura
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 