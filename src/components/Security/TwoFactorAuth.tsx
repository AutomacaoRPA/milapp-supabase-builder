import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material'
import {
  QrCode,
  Key,
  Security,
  CheckCircle,
  Error,
  Refresh,
  Download,
  Visibility,
  VisibilityOff,
  Smartphone,
  Email,
  Sms,
  Help,
  Info
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface TwoFactorAuthProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mode: 'setup' | 'verify' | 'manage'
  userId?: string
}

interface TwoFactorData {
  isEnabled: boolean
  secretKey?: string
  backupCodes?: string[]
  setupCompleted?: boolean
}

export function TwoFactorAuth({ open, onClose, onSuccess, mode, userId }: TwoFactorAuthProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [data, setData] = useState<TwoFactorData | null>(null)
  
  // Estados para setup
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  
  // Estados para verificação
  const [inputCode, setInputCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  
  // Estados para gerenciamento
  const [showSecret, setShowSecret] = useState(false)
  const [regenerateBackupCodes, setRegenerateBackupCodes] = useState(false)

  useEffect(() => {
    if (open) {
      loadTwoFactorData()
    }
  }, [open, mode])

  const loadTwoFactorData = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) {
        setError('Usuário não autenticado')
        return
      }

      const { data: twoFactorData, error } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', currentUserId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      setData(twoFactorData || { isEnabled: false })
    } catch (error) {
      console.error('❌ Erro ao carregar dados 2FA:', error)
      setError('Erro ao carregar configurações 2FA')
    } finally {
      setLoading(false)
    }
  }

  const generateTwoFactorSetup = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) {
        setError('Usuário não autenticado')
        return
      }

      // Gerar chave secreta
      const { data: secretData, error: secretError } = await supabase.rpc('generate_totp_secret')
      if (secretError) throw secretError

      // Gerar códigos de backup
      const backupCodes = generateBackupCodes()
      
      // Gerar QR Code URL
      const user = (await supabase.auth.getUser()).data.user
      const qrCodeData = `otpauth://totp/MILAPP:${user?.email}?secret=${secretData}&issuer=MILAPP&algorithm=SHA1&digits=6&period=30`
      
      setQrCodeUrl(qrCodeData)
      setBackupCodes(backupCodes)
      setData({
        ...data,
        secretKey: secretData,
        backupCodes: backupCodes
      })

    } catch (error) {
      console.error('❌ Erro ao gerar setup 2FA:', error)
      setError('Erro ao gerar configuração 2FA')
    } finally {
      setLoading(false)
    }
  }

  const generateBackupCodes = (): string[] => {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  const verifyAndEnable2FA = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) {
        setError('Usuário não autenticado')
        return
      }

      // Verificar código
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_2fa_code', {
        p_user_id: currentUserId,
        p_code: verificationCode
      })

      if (verifyError) throw verifyError

      if (!isValid) {
        setError('Código inválido. Tente novamente.')
        return
      }

      // Ativar 2FA
      const { error: enableError } = await supabase.rpc('enable_2fa', {
        p_user_id: currentUserId,
        p_secret_key: data?.secretKey,
        p_backup_codes: backupCodes
      })

      if (enableError) throw enableError

      setSuccess('2FA ativado com sucesso!')
      setData({ ...data, isEnabled: true, setupCompleted: true })
      
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('❌ Erro ao verificar 2FA:', error)
      setError('Erro ao verificar código 2FA')
    } finally {
      setLoading(false)
    }
  }

  const verify2FACode = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) {
        setError('Usuário não autenticado')
        return
      }

      const { data: isValid, error } = await supabase.rpc('verify_2fa_code', {
        p_user_id: currentUserId,
        p_code: inputCode
      })

      if (error) throw error

      if (!isValid) {
        setError('Código inválido. Tente novamente.')
        return
      }

      setSuccess('Verificação 2FA bem-sucedida!')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('❌ Erro ao verificar 2FA:', error)
      setError('Erro ao verificar código 2FA')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) {
        setError('Usuário não autenticado')
        return
      }

      const { error } = await supabase
        .from('user_2fa')
        .update({
          is_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId)

      if (error) throw error

      setSuccess('2FA desativado com sucesso!')
      setData({ ...data, isEnabled: false })
      
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('❌ Erro ao desativar 2FA:', error)
      setError('Erro ao desativar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const regenerateBackupCodesAction = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
      if (!currentUserId) {
        setError('Usuário não autenticado')
        return
      }

      const newBackupCodes = generateBackupCodes()

      const { error } = await supabase
        .from('user_2fa')
        .update({
          backup_codes: newBackupCodes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId)

      if (error) throw error

      setBackupCodes(newBackupCodes)
      setShowBackupCodes(true)
      setSuccess('Códigos de backup regenerados com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao regenerar códigos:', error)
      setError('Erro ao regenerar códigos de backup')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes-2fa.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderSetupMode = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configurar Autenticação em Dois Fatores
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        A autenticação em dois fatores adiciona uma camada extra de segurança à sua conta.
      </Typography>

      {!data?.secretKey ? (
        <Button
          variant="contained"
          startIcon={<QrCode />}
          onClick={generateTwoFactorSetup}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Gerar QR Code'}
        </Button>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  QR Code
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Escaneie este QR Code com seu aplicativo autenticador:
                </Typography>
                
                <Box display="flex" justifyContent="center" mb={2}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                    alt="QR Code 2FA"
                    style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </Box>

                <Typography variant="body2" color="textSecondary">
                  Aplicativos recomendados: Google Authenticator, Authy, Microsoft Authenticator
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chave Manual
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Se não conseguir escanear o QR Code, use esta chave:
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TextField
                    value={data.secretKey}
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowSecret(!showSecret)}
                          size="small"
                        >
                          {showSecret ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                    type={showSecret ? 'text' : 'password'}
                  />
                </Box>

                <Typography variant="body2" color="textSecondary">
                  Digite esta chave manualmente no seu aplicativo autenticador.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verificar Configuração
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Digite o código de 6 dígitos gerado pelo seu aplicativo:
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <TextField
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    variant="outlined"
                    size="small"
                    inputProps={{ maxLength: 6 }}
                  />
                  <Button
                    variant="contained"
                    onClick={verifyAndEnable2FA}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Verificar e Ativar'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {backupCodes.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Códigos de Backup
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Guarde estes códigos em um local seguro. Eles podem ser usados para acessar sua conta se você perder seu dispositivo.
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={downloadBackupCodes}
                    >
                      Baixar Códigos
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? 'Ocultar' : 'Mostrar'} Códigos
                    </Button>
                  </Box>

                  {showBackupCodes && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 1,
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1
                      }}
                    >
                      {backupCodes.map((code, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          fontFamily="monospace"
                          textAlign="center"
                          sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}
                        >
                          {code}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  )

  const renderVerifyMode = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Verificar Autenticação em Dois Fatores
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Digite o código de 6 dígitos do seu aplicativo autenticador.
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        <TextField
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="000000"
          variant="outlined"
          fullWidth
          inputProps={{ maxLength: 6 }}
          autoFocus
        />

        <FormControlLabel
          control={
            <Switch
              checked={useBackupCode}
              onChange={(e) => setUseBackupCode(e.target.checked)}
            />
          }
          label="Usar código de backup"
        />

        <Button
          variant="contained"
          onClick={verify2FACode}
          disabled={loading || inputCode.length !== 6}
          fullWidth
        >
          {loading ? <CircularProgress size={20} /> : 'Verificar'}
        </Button>

        <Typography variant="body2" color="textSecondary" textAlign="center">
          Não tem acesso ao seu aplicativo? Use um código de backup.
        </Typography>
      </Box>
    </Box>
  )

  const renderManageMode = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Gerenciar Autenticação em Dois Fatores
      </Typography>

      {data?.isEnabled ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="success" icon={<CheckCircle />}>
              2FA está ativo para sua conta
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Códigos de Backup
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Você tem {data.backupCodes?.length || 0} códigos de backup restantes.
                </Typography>
                
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={regenerateBackupCodesAction}
                    disabled={loading}
                  >
                    Regenerar Códigos
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? 'Ocultar' : 'Mostrar'} Códigos
                  </Button>
                </Box>

                {showBackupCodes && backupCodes.length > 0 && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: 1,
                      mt: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1
                    }}
                  >
                    {backupCodes.map((code, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        fontFamily="monospace"
                        textAlign="center"
                        sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}
                      >
                        {code}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Desativar 2FA
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Desativar 2FA reduzirá a segurança da sua conta. Tem certeza?
                </Typography>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={disable2FA}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Desativar 2FA'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info" icon={<Info />}>
          2FA não está ativo. Configure para aumentar a segurança da sua conta.
        </Alert>
      )}
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Security color="primary" />
          Autenticação em Dois Fatores
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!loading && (
          <>
            {mode === 'setup' && renderSetupMode()}
            {mode === 'verify' && renderVerifyMode()}
            {mode === 'manage' && renderManageMode()}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {mode === 'verify' ? 'Cancelar' : 'Fechar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 