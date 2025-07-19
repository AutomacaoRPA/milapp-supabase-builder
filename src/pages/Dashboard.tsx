import { Box } from '@mui/material'
import { MedSeniorDashboard } from '../features/dashboard/pages/MedSeniorDashboard'
import { MetricsDetail } from '../features/dashboard/components/MetricsDetail'
import { RecentActivities } from '../features/dashboard/components/RecentActivities'

export function DashboardPage() {
  return (
    <Box sx={{ p: 3 }}>
      <MedSeniorDashboard />
      <MetricsDetail />
      <RecentActivities />
    </Box>
  )
}