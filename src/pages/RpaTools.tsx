import { Box, Typography, Card, CardContent, Grid } from '@mui/material'
import { SmartToy } from '@mui/icons-material'

const RpaTools = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SmartToy sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Ferramentas RPA
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recomendação de Ferramentas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Análise inteligente para recomendar a melhor ferramenta RPA.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Matriz de Decisão
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critérios para seleção de ferramentas baseados no projeto.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default RpaTools 