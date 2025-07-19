import { Card, CardContent, Typography, Box, Avatar } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import { motion } from 'framer-motion'

interface MetricCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
}

export function MetricCard({ title, value, change, trend, icon, color }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
              {icon}
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          </Box>
          
          <Typography variant="h3" component="div" gutterBottom>
            {value}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {trend === 'up' ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={trend === 'up' ? 'success.main' : 'error.main'}
            >
              {change}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              vs. mês anterior
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
} 