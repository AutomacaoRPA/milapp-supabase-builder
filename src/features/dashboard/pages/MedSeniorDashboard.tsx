import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material'
import { TrendingUp, Assessment, CheckCircle, Schedule } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, BarChart, Bar, Tooltip, CartesianGrid } from 'recharts'

const roiData = [
  { mes: 'Jan', roi: 180, economia: 45000 },
  { mes: 'Fev', roi: 220, economia: 67000 },
  { mes: 'Mar', roi: 290, economia: 89000 },
  { mes: 'Abr', roi: 340, economia: 125000 },
  { mes: 'Mai', roi: 380, economia: 156000 },
  { mes: 'Jun', roi: 420, economia: 189000 }
]

const qualityGatesData = [
  { gate: 'G1 - Ideação', projetos: 15, progresso: 75, cor: '#327746' },
  { gate: 'G2 - Aprovação', projetos: 8, progresso: 60, cor: '#95c11f' },
  { gate: 'G3 - Desenvolvimento', projetos: 12, progresso: 85, cor: '#4aa455' },
  { gate: 'G4 - Produção', projetos: 47, progresso: 95, cor: '#e7e365' }
]

export function MedSeniorDashboard() {
  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontFamily: '"Darker Grotesque", sans-serif',
              fontWeight: 700,
              color: 'primary.main',
              mb: 1
            }}
          >
            Centro de Excelência
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
            bem monitorar bem
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              maxWidth: '600px',
              fontSize: '16px',
              lineHeight: 1.7
            }}
          >
            Acompanhe o desempenho das suas automações, projetos em andamento e 
            impacto gerado. Métricas que fazem bem para sua organização.
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #327746 0%, #4aa455 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(50, 119, 70, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(50, 119, 70, 0.4)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      47
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Automações Ativas
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="caption">
                    +8 este mês
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #95c11f 0%, #bfcf52 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(149, 193, 31, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(149, 193, 31, 0.4)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      156h
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Horas Economizadas
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="caption">
                    +23h esta semana
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #4aa455 0%, #74a455 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(74, 164, 85, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(74, 164, 85, 0.4)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assessment sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      420%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      ROI Médio
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="caption">
                    Crescimento constante
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #e7e365 0%, #bfcf52 100%)',
                color: '#20463c',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(231, 227, 101, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(231, 227, 101, 0.4)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      R$ 1.2M
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Economia Total
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="caption">
                    Meta: R$ 1.5M
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* ROI Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
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
                  Evolução ROI - Bem Envelhecer Bem
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={roiData}>
                    <defs>
                      <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#327746" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#327746" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#327746"
                      fontSize={12}
                      fontFamily="Antique Olive, sans-serif"
                    />
                    <YAxis 
                      stroke="#327746"
                      fontSize={12}
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
                    <Area 
                      type="monotone" 
                      dataKey="roi" 
                      stroke="#327746" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#roiGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quality Gates Status */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
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
                  Quality Gates G1-G4
                </Typography>
                {qualityGatesData.map((gate, index) => (
                  <motion.div
                    key={gate.gate}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: '"Antique Olive", sans-serif',
                            fontWeight: 500
                          }}
                        >
                          {gate.gate}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: gate.cor,
                            fontWeight: 600
                          }}
                        >
                          {gate.projetos}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={gate.progresso} 
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: gate.cor,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  )
} 