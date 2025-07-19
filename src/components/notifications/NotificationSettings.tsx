import { useState, useEffect } from 'react'
import { 
  Box, Card, CardContent, Typography, Switch, 
  FormControlLabel, Button, Alert, Chip,
  Divider, List, ListItem, ListItemIcon, 
  ListItemText, ListItemSecondaryAction 
} from '@mui/material'
import { 
  Notifications, NotificationsOff, CheckCircle, 
  Warning, Info, Settings, Refresh 
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useNotifications } from '../../hooks/useNotifications'

interface NotificationPreference {
  id: string
  title: string
  description: string
  enabled: boolean
  category: 'quality' | 'deployment' | 'metrics' | 'projects' | 'system'
}

export function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    isInitialized, 
    requestPermission,
    clearNotifications 
  } = useNotifications()

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'quality-gates',
      title: 'Quality Gates',
      description: 'Aprovações e rejeições de gates G1-G4',
      enabled: true,
      category: 'quality'
    },
    {
      id: 'deployments',
      title: 'Deployments',
      description: 'Automações implantadas em produção',
      enabled: true,
      category: 'deployment'
    },
    {
      id: 'roi-updates',
      title: 'Atualizações de ROI',
      description: 'Mudanças nos indicadores de retorno',
      enabled: true,
      category: 'metrics'
    },
    {
      id: 'project-creation',
      title: 'Novos Projetos',
      description: 'Projetos criados no sistema',
      enabled: false,
      category: 'projects'
    },
    {
      id: 'automation-completion',
      title: 'Conclusão de Automações',
      description: 'Execuções bem-sucedidas de automações',
      enabled: true,
      category: 'deployment'
    },
    {
      id: 'system-maintenance',
      title: 'Manutenção do Sistema',
      description: 'Alertas de manutenção programada',
      enabled: true,
      category: 'system'
    },
    {
      id: 'discovery-completion',
      title: 'Discovery IA',
      description: 'Análises de processos concluídas',
      enabled: true,
      category: 'projects'
    },
    {
      id: 'error-alerts',
      title: 'Alertas de Erro',
      description: 'Notificações de erros críticos',
      enabled: true,
      category: 'system'
    }
  ])

  const handlePermissionRequest = async () => {
    const granted = await requestPermission()
    if (granted) {
      console.log('✅ Permissão de notificação concedida')
    }
  }

  const handlePreferenceChange = (id: string, enabled: boolean) => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id ? { ...pref, enabled } : pref
      )
    )
    
    // Salvar preferência no localStorage
    localStorage.setItem(`notification_${id}`, enabled.toString())
  }

  const handleClearAllNotifications = async () => {
    await clearNotifications()
    console.log('🗑️ Todas as notificações limpas')
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { status: 'success', text: 'Permitido', icon: <CheckCircle /> }
      case 'denied':
        return { status: 'error', text: 'Negado', icon: <Warning /> }
      default:
        return { status: 'warning', text: 'Não solicitado', icon: <Info /> }
    }
  }

  const permissionStatus = getPermissionStatus()

  // Carregar preferências salvas
  useEffect(() => {
    preferences.forEach(pref => {
      const saved = localStorage.getItem(`notification_${pref.id}`)
      if (saved !== null) {
        handlePreferenceChange(pref.id, saved === 'true')
      }
    })
  }, [])

  if (!isSupported) {
    return (
      <Card className="card-medsenior">
        <CardContent>
          <Alert severity="warning" icon={<NotificationsOff />}>
            <Typography variant="body2" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
              Notificações não são suportadas neste navegador.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="card-medsenior">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Notifications sx={{ fontSize: 24, mr: 2, color: 'primary.main' }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 600,
                color: 'primary.main'
              }}
            >
              Configurações de Notificações
            </Typography>
          </Box>

          {/* Status da Permissão */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 1,
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 600
              }}
            >
              Status da Permissão
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                icon={permissionStatus.icon}
                label={permissionStatus.text}
                color={permissionStatus.status as any}
                sx={{ fontFamily: '"Antique Olive", sans-serif' }}
              />
              
              {permission === 'default' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePermissionRequest}
                  sx={{
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 600
                  }}
                >
                  Solicitar Permissão
                </Button>
              )}
            </Box>

            {permission === 'denied' && (
              <Alert severity="error" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                <Typography variant="body2">
                  Permissão negada. Para receber notificações, permita o acesso nas configurações do navegador.
                </Typography>
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Preferências de Notificação */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2,
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 600
              }}
            >
              Preferências de Notificação
            </Typography>

            <List>
              {preferences.map((preference, index) => (
                <ListItem 
                  key={preference.id}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    mb: 1,
                    fontFamily: '"Antique Olive", sans-serif'
                  }}
                >
                  <ListItemIcon>
                    <Settings sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={preference.title}
                    secondary={preference.description}
                    primaryTypographyProps={{
                      fontFamily: '"Darker Grotesque", sans-serif',
                      fontWeight: 600
                    }}
                    secondaryTypographyProps={{
                      fontFamily: '"Antique Olive", sans-serif'
                    }}
                  />
                  
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={preference.enabled}
                      onChange={(e) => handlePreferenceChange(preference.id, e.target.checked)}
                      disabled={permission !== 'granted'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Ações */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleClearAllNotifications}
              disabled={permission !== 'granted'}
              sx={{
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 600
              }}
            >
              Limpar Notificações
            </Button>
            
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              disabled={permission !== 'granted'}
              sx={{
                fontFamily: '"Darker Grotesque", sans-serif',
                fontWeight: 600
              }}
            >
              Salvar Preferências
            </Button>
          </Box>

          {/* Informações Adicionais */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontFamily: '"Antique Olive", sans-serif'
              }}
            >
              💡 As notificações MedSênior são otimizadas para manter você informado sobre 
              eventos importantes do Centro de Excelência. Configure suas preferências 
              para receber apenas as notificações relevantes.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
} 