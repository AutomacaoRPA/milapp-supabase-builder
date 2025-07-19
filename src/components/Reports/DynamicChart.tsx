import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Paper
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts'
import {
  BarChart as BarIcon,
  ShowChart,
  PieChart as PieIcon,
  ScatterPlot,
  AreaChart as AreaIcon,
  Refresh,
  Download,
  Fullscreen,
  Settings
} from '@mui/icons-material'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface DynamicChartProps {
  data: ChartData[]
  title: string
  description?: string
  height?: number
  onExport?: (format: string) => void
}

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'composed'

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
  '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
]

export function DynamicChart({ 
  data, 
  title, 
  description, 
  height = 400,
  onExport 
}: DynamicChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [fullscreen, setFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Detectar tipo de dados automaticamente
  useEffect(() => {
    if (data.length > 0) {
      const keys = Object.keys(data[0]).filter(key => key !== 'name')
      if (keys.length === 1) {
        setChartType('bar')
      } else if (keys.length > 1) {
        setChartType('line')
      }
    }
  }, [data])

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
          <Bar 
            key={key} 
            dataKey={key} 
            fill={COLORS[index % COLORS.length]} 
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
          <Line 
            key={key} 
            type="monotone" 
            dataKey={key} 
            stroke={COLORS[index % COLORS.length]} 
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
          <Area 
            key={key} 
            type="monotone" 
            dataKey={key} 
            stackId="1"
            stroke={COLORS[index % COLORS.length]} 
            fill={COLORS[index % COLORS.length]} 
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" type="number" />
        <YAxis dataKey="y" type="number" />
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="Dados" data={data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  )

  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
          <Bar 
            key={key} 
            dataKey={key} 
            fill={COLORS[index % COLORS.length]} 
            fillOpacity={0.6}
          />
        ))}
        {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
          <Line 
            key={`line-${key}`} 
            type="monotone" 
            dataKey={key} 
            stroke={COLORS[index % COLORS.length]} 
            strokeWidth={2}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'pie':
        return renderPieChart()
      case 'area':
        return renderAreaChart()
      case 'scatter':
        return renderScatterChart()
      case 'composed':
        return renderComposedChart()
      default:
        return renderBarChart()
    }
  }

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'bar':
        return <BarIcon />
      case 'line':
        return <ShowChart />
      case 'pie':
        return <PieIcon />
      case 'area':
        return <AreaIcon />
      case 'scatter':
        return <ScatterPlot />
      case 'composed':
        return <BarIcon />
      default:
        return <BarIcon />
    }
  }

  const chartTypes: { value: ChartType; label: string; icon: React.ReactNode }[] = [
    { value: 'bar', label: 'Barras', icon: <BarIcon /> },
    { value: 'line', label: 'Linha', icon: <ShowChart /> },
    { value: 'pie', label: 'Pizza', icon: <PieIcon /> },
    { value: 'area', label: 'Área', icon: <AreaIcon /> },
    { value: 'scatter', label: 'Dispersão', icon: <ScatterPlot /> },
    { value: 'composed', label: 'Composto', icon: <BarIcon /> }
  ]

  return (
    <Card sx={{ height: fullscreen ? '100vh' : 'auto' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="textSecondary">
                {description}
              </Typography>
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                label="Tipo"
              >
                {chartTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Tooltip title="Configurações">
              <IconButton onClick={() => setShowSettings(!showSettings)}>
                <Settings />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Tela cheia">
              <IconButton onClick={() => setFullscreen(!fullscreen)}>
                <Fullscreen />
              </IconButton>
            </Tooltip>
            
            {onExport && (
              <Tooltip title="Exportar">
                <IconButton onClick={() => onExport('png')}>
                  <Download />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Configurações */}
        {showSettings && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configurações do Gráfico
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Total de registros: {data.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Colunas: {Object.keys(data[0] || {}).length}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Gráfico */}
        <Box sx={{ 
          height: fullscreen ? 'calc(100vh - 200px)' : height,
          width: '100%'
        }}>
          {data.length > 0 ? (
            renderChart()
          ) : (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
            >
              <Typography color="textSecondary">
                Nenhum dado disponível para exibição
              </Typography>
            </Box>
          )}
        </Box>

        {/* Legenda de dados */}
        {data.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Dados atualizados em: {new Date().toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
} 