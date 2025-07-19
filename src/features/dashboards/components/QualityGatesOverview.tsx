import { Box, Typography, LinearProgress, Chip } from '@mui/material'

const qualityGates = [
  { name: 'G1 - Ideação', passed: 85, total: 100, color: '#1976d2' },
  { name: 'G2 - Aprovação', passed: 92, total: 100, color: '#42a5f5' },
  { name: 'G3 - Desenvolvimento', passed: 78, total: 100, color: '#90caf9' },
  { name: 'G4 - Produção', passed: 95, total: 100, color: '#bbdefb' },
]

export function QualityGatesOverview() {
  return (
    <Box>
      {qualityGates.map((gate) => (
        <Box key={gate.name} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {gate.name}
            </Typography>
            <Chip 
              label={`${gate.passed}%`}
              size="small"
              sx={{ 
                bgcolor: gate.passed >= 90 ? 'success.main' : 
                       gate.passed >= 75 ? 'warning.main' : 'error.main',
                color: 'white'
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={gate.passed}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: gate.color,
                borderRadius: 4,
              }
            }}
          />
        </Box>
      ))}
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Taxa de Aprovação Geral: 87.5%
        </Typography>
      </Box>
    </Box>
  )
} 