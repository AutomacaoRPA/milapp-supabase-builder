import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
import { TrendingUp, Schedule, CheckCircle, Warning } from '@mui/icons-material'
import { MetricCard } from '../components/MetricCard'
import { ProjectsChart } from '../components/ProjectsChart'
import { ROIChart } from '../components/ROIChart'
import { RecentActivities } from '../components/RecentActivities'
import { QualityGatesOverview } from '../components/QualityGatesOverview'

export function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Centro de Excelência - Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Projetos Ativos"
            value="24"
            change="+12%"
            trend="up"
            icon={<Schedule />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Automações em Produção"
            value="156"
            change="+8%"
            trend="up"
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="ROI Médio"
            value="340%"
            change="+15%"
            trend="up"
            icon={<TrendingUp />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Alertas Quality Gate"
            value="3"
            change="-2"
            trend="down"
            icon={<Warning />}
            color="warning"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline de Projetos
              </Typography>
              <ProjectsChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Gates G1-G4
              </Typography>
              <QualityGatesOverview />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ROI por Trimestre
              </Typography>
              <ROIChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Atividades Recentes
              </Typography>
              <RecentActivities />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 