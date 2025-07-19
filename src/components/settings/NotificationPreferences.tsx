import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  ExpandMore,
  Email,
  Chat,
  WhatsApp,
  Notifications,
  Schedule,
  Save,
  Refresh,
  NotificationsActive,
  NotificationsOff,
  Settings
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface NotificationPreferencesProps {
  projectId?: string
  onSave?: () => void
}

interface NotificationSettings {
  email_enabled: boolean
  teams_enabled: boolean
  whatsapp_enabled: boolean
  push_enabled: boolean
  new_request_notifications: {
    email: boolean
    teams: boolean
    whatsapp: boolean
    push: boolean
  }
  status_change_notifications: {
    email: boolean
    teams: boolean
    whatsapp: boolean
    push: boolean
  }
  ai_response_notifications: {
    email: boolean
    teams: boolean
    whatsapp: boolean
    push: boolean
  }
  approval_required_notifications: {
    email: boolean
    teams: boolean
    whatsapp: boolean
    push: boolean
  }
  completion_notifications: {
    email: boolean
    teams: boolean
    whatsapp: boolean
    push: boolean
  }
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  digest_enabled: boolean
  digest_frequency: 'hourly' | 'daily' | 'weekly'
}

const defaultSettings: NotificationSettings = {
  email_enabled: true,
  teams_enabled: true,
  whatsapp_enabled: false,
  push_enabled: true,
  new_request_notifications: {
    email: true,
    teams: true,
    whatsapp: false,
    push: true
  },
  status_change_notifications: {
    email: true,
    teams: true,
    whatsapp: false,
    push: true
  },
  ai_response_notifications: {
    email: false,
    teams: false,
    whatsapp: false,
    push: true
  },
  approval_required_notifications: {
    email: true,
    teams: true,
    whatsapp: true,
    push: true
  },
  completion_notifications: {
    email: true,
    teams: true,
    whatsapp: true,
    push: true
  },
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: 'America/Sao_Paulo',
  digest_enabled: false,
  digest_frequency: 'daily'
}

export function NotificationPreferences({ projectId, onSave }: NotificationPreferencesProps) {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [projectId])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase.rpc('get_user_notification_preferences', {
        p_user_id: user.id,
        p_project_id: projectId
      })

      if (error) throw error

      if (data && data.length > 0) {
        const prefs = data[0]
        setSettings({
          email_enabled: prefs.email_enabled,
          teams_enabled: prefs.teams_enabled,
          whatsapp_enabled: prefs.whatsapp_enabled,
          push_enabled: prefs.push_enabled,
          new_request_notifications: prefs.new_request_notifications,
          status_change_notifications: prefs.status_change_notifications,
          ai_response_notifications: prefs.ai_response_notifications,
          approval_required_notifications: prefs.approval_required_notifications,
          completion_notifications: prefs.completion_notifications,
          quiet_hours_enabled: prefs.quiet_hours_enabled,
          quiet_hours_start: prefs.quiet_hours_start,
          quiet_hours_end: prefs.quiet_hours_end,
          timezone: prefs.timezone,
          digest_enabled: prefs.digest_enabled,
          digest_frequency: prefs.digest_frequency
        })
      }
    } catch (error) {
      console.error('❌ Erro ao carregar preferências:', error)
      setError('Erro ao carregar preferências de notificação')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase.rpc('update_notification_preferences', {
        p_user_id: user.id,
        p_project_id: projectId,
        p_preferences: settings
      })

      if (error) throw error

      setSuccess(true)
      onSave?.()

      // Limpar sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar preferências:', error)
      setError('Erro ao salvar preferências de notificação')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNotificationType = (type: keyof Omit<NotificationSettings, 'email_enabled' | 'teams_enabled' | 'whatsapp_enabled' | 'push_enabled' | 'quiet_hours_enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone' | 'digest_enabled' | 'digest_frequency'>, channel: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value
      }
    }))
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Email />
      case 'teams':
        return <Chat />
      case 'whatsapp':
        return <WhatsApp />
      case 'push':
        return <Notifications />
      default:
        return <Notifications />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return '#3B82F6'
      case 'teams':
        return '#6366F1'
      case 'whatsapp':
        return '#10B981'
      case 'push':
        return '#F59E0B'
      default:
        return '#6B7280'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Preferências de Notificação
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Preferências salvas com sucesso!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Canais Principais */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Canais de Comunicação
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email_enabled}
                      onChange={(e) => updateSetting('email_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Email color="primary" />
                      <Typography>E-mail</Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.teams_enabled}
                      onChange={(e) => updateSetting('teams_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chat color="primary" />
                      <Typography>Microsoft Teams</Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.whatsapp_enabled}
                      onChange={(e) => updateSetting('whatsapp_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <WhatsApp color="primary" />
                      <Typography>WhatsApp</Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.push_enabled}
                      onChange={(e) => updateSetting('push_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Notifications color="primary" />
                      <Typography>Notificações Push</Typography>
                    </Box>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Configurações Avançadas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configurações Avançadas
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.quiet_hours_enabled}
                      onChange={(e) => updateSetting('quiet_hours_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule />
                      <Typography>Horário Silencioso</Typography>
                    </Box>
                  }
                />
                
                {settings.quiet_hours_enabled && (
                  <Box display="flex" gap={2} ml={4}>
                    <TextField
                      label="Início"
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                      size="small"
                    />
                    <TextField
                      label="Fim"
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                      size="small"
                    />
                  </Box>
                )}
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.digest_enabled}
                      onChange={(e) => updateSetting('digest_enabled', e.target.checked)}
                    />
                  }
                  label="Resumo Diário"
                />
                
                {settings.digest_enabled && (
                  <FormControl size="small" sx={{ ml: 4, minWidth: 200 }}>
                    <InputLabel>Frequência</InputLabel>
                    <Select
                      value={settings.digest_frequency}
                      onChange={(e) => updateSetting('digest_frequency', e.target.value)}
                      label="Frequência"
                    >
                      <MenuItem value="hourly">A cada hora</MenuItem>
                      <MenuItem value="daily">Diário</MenuItem>
                      <MenuItem value="weekly">Semanal</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                <FormControl size="small">
                  <InputLabel>Fuso Horário</InputLabel>
                  <Select
                    value={settings.timezone}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    label="Fuso Horário"
                  >
                    <MenuItem value="America/Sao_Paulo">São Paulo (GMT-3)</MenuItem>
                    <MenuItem value="America/New_York">Nova York (GMT-5)</MenuItem>
                    <MenuItem value="Europe/London">Londres (GMT+0)</MenuItem>
                    <MenuItem value="Asia/Tokyo">Tóquio (GMT+9)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tipos de Notificação */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tipos de Notificação
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Nova Solicitação */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Nova Solicitação
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {Object.entries(settings.new_request_notifications).map(([channel, enabled]) => (
                          <Chip
                            key={channel}
                            icon={getChannelIcon(channel)}
                            label={channel}
                            size="small"
                            color={enabled ? 'primary' : 'default'}
                            variant={enabled ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(settings.new_request_notifications).map(([channel, enabled]) => (
                        <Grid item xs={6} sm={3} key={channel}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => updateNotificationType('new_request_notifications', channel, e.target.checked)}
                                disabled={!settings[`${channel}_enabled` as keyof NotificationSettings]}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getChannelIcon(channel)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {channel}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Mudança de Status */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Mudança de Status
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {Object.entries(settings.status_change_notifications).map(([channel, enabled]) => (
                          <Chip
                            key={channel}
                            icon={getChannelIcon(channel)}
                            label={channel}
                            size="small"
                            color={enabled ? 'primary' : 'default'}
                            variant={enabled ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(settings.status_change_notifications).map(([channel, enabled]) => (
                        <Grid item xs={6} sm={3} key={channel}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => updateNotificationType('status_change_notifications', channel, e.target.checked)}
                                disabled={!settings[`${channel}_enabled` as keyof NotificationSettings]}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getChannelIcon(channel)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {channel}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Resposta da IA */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Resposta da IA
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {Object.entries(settings.ai_response_notifications).map(([channel, enabled]) => (
                          <Chip
                            key={channel}
                            icon={getChannelIcon(channel)}
                            label={channel}
                            size="small"
                            color={enabled ? 'primary' : 'default'}
                            variant={enabled ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(settings.ai_response_notifications).map(([channel, enabled]) => (
                        <Grid item xs={6} sm={3} key={channel}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => updateNotificationType('ai_response_notifications', channel, e.target.checked)}
                                disabled={!settings[`${channel}_enabled` as keyof NotificationSettings]}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getChannelIcon(channel)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {channel}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Aprovação Necessária */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Aprovação Necessária
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {Object.entries(settings.approval_required_notifications).map(([channel, enabled]) => (
                          <Chip
                            key={channel}
                            icon={getChannelIcon(channel)}
                            label={channel}
                            size="small"
                            color={enabled ? 'primary' : 'default'}
                            variant={enabled ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(settings.approval_required_notifications).map(([channel, enabled]) => (
                        <Grid item xs={6} sm={3} key={channel}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => updateNotificationType('approval_required_notifications', channel, e.target.checked)}
                                disabled={!settings[`${channel}_enabled` as keyof NotificationSettings]}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getChannelIcon(channel)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {channel}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Conclusão */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Conclusão/Entrega
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {Object.entries(settings.completion_notifications).map(([channel, enabled]) => (
                          <Chip
                            key={channel}
                            icon={getChannelIcon(channel)}
                            label={channel}
                            size="small"
                            color={enabled ? 'primary' : 'default'}
                            variant={enabled ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {Object.entries(settings.completion_notifications).map(([channel, enabled]) => (
                        <Grid item xs={6} sm={3} key={channel}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={enabled}
                                onChange={(e) => updateNotificationType('completion_notifications', channel, e.target.checked)}
                                disabled={!settings[`${channel}_enabled` as keyof NotificationSettings]}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                {getChannelIcon(channel)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {channel}
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ações */}
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={resetToDefaults}
          disabled={saving}
        >
          Restaurar Padrões
        </Button>
      </Box>
    </Box>
  )
} 