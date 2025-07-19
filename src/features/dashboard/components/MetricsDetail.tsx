import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material'
import { 
  TrendingUp, TrendingDown, Speed, People, 
  Assignment, CheckCircle, Warning, Error 
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const projectStatusData = [
  { name: 'Em Desenvolvimento', value: 12, color: '#95c11f' },
  { name: 'Em Teste', value: 8, color: '#4aa455' },
  { name: 'Em Produção', value: 47, color: '#327746' },
  { name: 'Pausado', value: 3, color: '#e69732' }
]

const automationTypeData = [
  { tipo: 'Processamento de Dados', quantidade: 18, economia: 450000 },
  { tipo: 'Validação de Documentos', quantidade: 12, economia: 320000 },
  { tipo: 'Relatórios Automatizados', quantidade: 8, economia: 280000 },
  { tipo: 'Integração de Sistemas', quantidade: 6, economia: 150000 },
  { tipo: 'Monitoramento', quantidade: 3, economia: 80000 }
]

export function MetricsDetail() {
  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {/* Project Status Chart */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Card className="card-medsenior">
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  color: 'primary.main',
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                Status dos Projetos
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(50, 119, 70, 0.2)',
                      borderRadius: '8px',
                      fontFamily: '"Antique Olive", sans-serif'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {projectStatusData.map((item, index) => (
                  <Chip
                    key={index}
                    label={`${item.name}: ${item.value}`}
                    size="small"
                    sx={{
                      bgcolor: item.color,
                      color: 'white',
                      fontFamily: '"Antique Olive", sans-serif',
                      fontSize: '11px'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Automation Types Chart */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <Card className="card-medsenior">
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  color: 'primary.main',
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                Tipos de Automação
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={automationTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="tipo" 
                    stroke="#327746"
                    fontSize={10}
                    fontFamily="Antique Olive, sans-serif"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#327746"
                    fontSize={10}
                    fontFamily="Antique Olive, sans-serif"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(50, 119, 70, 0.2)',
                      borderRadius: '8px',
                      fontFamily: '"Antique Olive", sans-serif'
                    }}
                  />
                  <Bar 
                    dataKey="quantidade" 
                    fill="#327746"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Performance Metrics */}
      <Grid item xs={12}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <Card className="card-medsenior">
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  color: 'primary.main',
                  fontFamily: '"Darker Grotesque", sans-serif',
                  fontWeight: 600
                }}
              >
                Métricas de Performance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Speed sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      98.5%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uptime Médio
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                      <Typography variant="caption" color="success.main">
                        +2.3%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <People sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      156
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usuários Ativos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                      <Typography variant="caption" color="success.main">
                        +12 este mês
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Assignment sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                      23
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projetos Ativos
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                      <Typography variant="caption" color="success.main">
                        No prazo
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      3
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alertas
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                      <TrendingDown sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                      <Typography variant="caption" color="warning.main">
                        -2 esta semana
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  )
} 