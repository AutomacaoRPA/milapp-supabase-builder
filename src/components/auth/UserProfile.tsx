import { useState } from 'react'
import { 
  Box, Card, CardContent, Typography, Avatar, Chip, 
  Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, Switch, FormControlLabel, 
  Select, MenuItem, FormControl, InputLabel 
} from '@mui/material'
import { 
  Person, Settings, Accessibility, Logout, 
  Business, Security, CheckCircle 
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { RBACService } from '../../services/auth/RBACService'

export function UserProfile() {
  const { user, signOut, updateAccessibilitySettings } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [accessibilitySettings, setAccessibilitySettings] = useState(
    user?.accessibility || {
      highContrast: false,
      fontSize: 'normal',
      reducedMotion: false
    }
  )

  if (!user) return null

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  const handleAccessibilityChange = async () => {
    try {
      await updateAccessibilitySettings(accessibilitySettings)
      setIsSettingsOpen(false)
    } catch (error) {
      console.error('Erro ao atualizar acessibilidade:', error)
    }
  }

  const getRoleColor = () => RBACService.getRoleColor(user.role)
  const getRoleDescription = () => RBACService.getRoleDescription(user.role)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="card-medsenior">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={user.avatar}
                sx={{ 
                  width: 64, 
                  height: 64, 
                  mr: 2,
                  bgcolor: 'primary.main'
                }}
              >
                <Person />
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: '"Darker Grotesque", sans-serif',
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  {user.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontFamily: '"Antique Olive", sans-serif'
                  }}
                >
                  {user.email}
                </Typography>
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: getRoleColor(),
                    color: 'white',
                    fontFamily: '"Antique Olive", sans-serif'
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1,
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                <Business sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                Informações do Perfil
              </Typography>
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontFamily: '"Antique Olive", sans-serif' }}>
                  <strong>Departamento:</strong> {user.department}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontFamily: '"Antique Olive", sans-serif' }}>
                  <strong>Empresa:</strong> {user.company}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontFamily: '"Antique Olive", sans-serif' }}>
                  <strong>Função:</strong> {getRoleDescription()}
                </Typography>
                {user.lastLogin && (
                  <Typography variant="body2" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                    <strong>Último acesso:</strong> {new Date(user.lastLogin).toLocaleString('pt-BR')}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1,
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                <Security sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                Permissões Ativas
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(user.permissions).map(([module, permissions]) => (
                  <Chip
                    key={module}
                    label={module}
                    size="small"
                    variant="outlined"
                    icon={<CheckCircle />}
                    sx={{ fontFamily: '"Antique Olive", sans-serif' }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Accessibility />}
                onClick={() => setIsSettingsOpen(true)}
                sx={{
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                Acessibilidade
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                Sair
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de Configurações de Acessibilidade */}
      <Dialog 
        open={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Darker Grotesque", sans-serif', fontWeight: 600 }}>
          <Accessibility sx={{ mr: 1, verticalAlign: 'middle' }} />
          Configurações de Acessibilidade
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={accessibilitySettings.highContrast}
                  onChange={(e) => setAccessibilitySettings(prev => ({
                    ...prev,
                    highContrast: e.target.checked
                  }))}
                />
              }
              label="Alto Contraste"
              sx={{ fontFamily: '"Antique Olive", sans-serif' }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={accessibilitySettings.reducedMotion}
                  onChange={(e) => setAccessibilitySettings(prev => ({
                    ...prev,
                    reducedMotion: e.target.checked
                  }))}
                />
              }
              label="Reduzir Animações"
              sx={{ fontFamily: '"Antique Olive", sans-serif' }}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                Tamanho da Fonte
              </InputLabel>
              <Select
                value={accessibilitySettings.fontSize}
                onChange={(e) => setAccessibilitySettings(prev => ({
                  ...prev,
                  fontSize: e.target.value as 'small' | 'normal' | 'large'
                }))}
                label="Tamanho da Fonte"
                sx={{ fontFamily: '"Antique Olive", sans-serif' }}
              >
                <MenuItem value="small" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                  Pequeno
                </MenuItem>
                <MenuItem value="normal" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                  Normal
                </MenuItem>
                <MenuItem value="large" sx={{ fontFamily: '"Antique Olive", sans-serif' }}>
                  Grande
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setIsSettingsOpen(false)}
            sx={{ fontFamily: '"Darker Grotesque", sans-serif' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAccessibilityChange}
            variant="contained"
            sx={{ fontFamily: '"Darker Grotesque", sans-serif' }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 