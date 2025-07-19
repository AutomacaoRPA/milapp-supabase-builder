import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Add,
  Refresh,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  FilterList,
  BarChart,
  PieChart,
  Timeline
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface KPI {
  id: string
  name: string
  description: string
  kpi_type: 'quantidade' | 'percentual' | 'tempo' | 'financeiro' | 'satisfacao'
  unit: string
  target_value: number
  min_value: number
  max_value: number
  measurement_frequency: string
  is_active: boolean
  current_value?: number
  status?: 'acima_meta' | 'dentro_meta' | 'abaixo_meta' | 'critico'
  trend?: 'melhorando' | 'estavel' | 'piorando'
  last_measurement?: string
}

interface KPIForm {
  name: string
  description: string
  kpi_type: string
  unit: string
  target_value: string
  min_value: string
  max_value: string
  measurement_frequency: string
}

export function KPIs() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null)
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const [form, setForm] = useState<KPIForm>({
    name: '',
    description: '',
    kpi_type: '',
    unit: '',
    target_value: '',
    min_value: '',
    max_value: '',
    measurement_frequency: ''
  })

  useEffect(() => {
    loadKPIs()
  }, [])

  const loadKPIs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Carregar KPIs
      const { data: kpisData, error: kpisError } = await supabase
        .from('quality_kpis')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (kpisError) throw kpisError

      // Carregar medições mais recentes
      const kpisWithMeasurements = await Promise.all(
        (kpisData || []).map(async (kpi) => {
          const { data: measurementData } = await supabase
            .from('quality_kpi_measurements')
            .select('measured_value, measurement_date, status, trend')
            .eq('kpi_id', kpi.id)
            .order('measurement_date', { ascending: false })
            .limit(1)

          const latestMeasurement = measurementData?.[0]
          
          return {
            ...kpi,
            current_value: latestMeasurement?.measured_value,
            status: latestMeasurement?.status,
            trend: latestMeasurement?.trend,
            last_measurement: latestMeasurement?.measurement_date
          }
        })
      )

      setKpis(kpisWithMeasurements)
    } catch (error) {
      console.error('❌ Erro ao carregar KPIs:', error)
      setError('Erro ao carregar indicadores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const kpiData = {
        name: form.name,
        description: form.description,
        kpi_type: form.kpi_type,
        unit: form.unit,
        target_value: parseFloat(form.target_value),
        min_value: parseFloat(form.min_value),
        max_value: parseFloat(form.max_value),
        measurement_frequency: form.measurement_frequency
      }

      if (editingKPI) {
        const { error } = await supabase
          .from('quality_kpis')
          .update(kpiData)
          .eq('id', editingKPI.id)

        if (error) throw error
        setSuccess('KPI atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('quality_kpis')
          .insert(kpiData)

        if (error) throw error
        setSuccess('KPI criado com sucesso!')
      }

      setShowDialog(false)
      setEditingKPI(null)
      resetForm()
      loadKPIs()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar KPI:', error)
      setError('Erro ao salvar KPI')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      kpi_type: '',
      unit: '',
      target_value: '',
      min_value: '',
      max_value: '',
      measurement_frequency: ''
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'acima_meta':
        return 'success'
      case 'dentro_meta':
        return 'info'
      case 'abaixo_meta':
        return 'warning'
      case 'critico':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'acima_meta':
        return <CheckCircle color="success" />
      case 'dentro_meta':
        return <CheckCircle color="info" />
      case 'abaixo_meta':
        return <Warning color="warning" />
      case 'critico':
        return <Error color="error" />
      default:
        return <Schedule color="disabled" />
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'melhorando':
        return <TrendingUp color="success" />
      case 'piorando':
        return <TrendingDown color="error" />
      case 'estavel':
        return <TrendingFlat color="info" />
      default:
        return <TrendingFlat color="disabled" />
    }
  }

  const getProgressPercentage = (kpi: KPI) => {
    if (!kpi.current_value || !kpi.target_value) return 0
    
    const percentage = (kpi.current_value / kpi.target_value) * 100
    return Math.min(percentage, 100)
  }

  const getKPIStats = () => {
    const total = kpis.length
    const aboveTarget = kpis.filter(k => k.status === 'acima_meta').length
    const withinTarget = kpis.filter(k => k.status === 'dentro_meta').length
    const belowTarget = kpis.filter(k => k.status === 'abaixo_meta').length
    const critical = kpis.filter(k => k.status === 'critico').length

    return { total, aboveTarget, withinTarget, belowTarget, critical }
  }

  const stats = getKPIStats()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Indicadores de Qualidade (KPIs)
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm()
            setShowDialog(true)
          }}
        >
          Novo KPI
        </Button>
      </Box>

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

      {/* Resumo dos KPIs */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de KPIs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.aboveTarget + stats.withinTarget}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dentro da Meta
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Warning color="warning" />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.belowTarget}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Abaixo da Meta
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Error color="error" />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.critical}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Críticos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de KPIs */}
      <Grid container spacing={3}>
        {kpis.map((kpi) => (
          <Grid item xs={12} md={6} key={kpi.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getStatusIcon(kpi.status)}
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {kpi.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {kpi.kpi_type} • {kpi.measurement_frequency}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    {getTrendIcon(kpi.trend)}
                    <Chip
                      label={kpi.status || 'Sem dados'}
                      color={getStatusColor(kpi.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {kpi.description}
                </Typography>

                {/* Valor atual vs meta */}
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption">
                      Valor Atual
                    </Typography>
                    <Typography variant="caption">
                      Meta
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6" fontWeight="bold">
                      {kpi.current_value !== undefined 
                        ? `${kpi.current_value} ${kpi.unit}`
                        : 'Sem dados'
                      }
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      /
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {kpi.target_value} {kpi.unit}
                    </Typography>
                  </Box>
                </Box>

                {/* Progresso */}
                {kpi.current_value !== undefined && (
                  <Box mb={2}>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercentage(kpi)}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={getStatusColor(kpi.status) as any}
                    />
                  </Box>
                )}

                {/* Faixa aceitável */}
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    Min: {kpi.min_value} {kpi.unit}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Max: {kpi.max_value} {kpi.unit}
                  </Typography>
                </Box>

                {/* Última medição */}
                {kpi.last_measurement && (
                  <Typography variant="caption" color="text.secondary">
                    Última medição: {new Date(kpi.last_measurement).toLocaleDateString()}
                  </Typography>
                )}

                <Box display="flex" gap={1} mt={2}>
                  <Tooltip title="Ver Detalhes">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedKPI(kpi)
                        setShowDetails(true)
                      }}
                    >
                      <Assessment />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingKPI(kpi)
                        setForm({
                          name: kpi.name,
                          description: kpi.description,
                          kpi_type: kpi.kpi_type,
                          unit: kpi.unit,
                          target_value: kpi.target_value.toString(),
                          min_value: kpi.min_value.toString(),
                          max_value: kpi.max_value.toString(),
                          measurement_frequency: kpi.measurement_frequency
                        })
                        setShowDialog(true)
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {kpis.length === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhum KPI configurado
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Configure indicadores de qualidade para monitorar o desempenho dos processos.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar/editar KPI */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingKPI ? 'Editar KPI' : 'Novo KPI'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Nome do KPI"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            
            <TextField
              label="Descrição"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              required
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={form.kpi_type}
                    onChange={(e) => setForm(prev => ({ ...prev, kpi_type: e.target.value }))}
                    label="Tipo"
                  >
                    <MenuItem value="quantidade">Quantidade</MenuItem>
                    <MenuItem value="percentual">Percentual</MenuItem>
                    <MenuItem value="tempo">Tempo</MenuItem>
                    <MenuItem value="financeiro">Financeiro</MenuItem>
                    <MenuItem value="satisfacao">Satisfação</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unidade de Medida"
                  value={form.unit}
                  onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Valor Meta"
                  type="number"
                  value={form.target_value}
                  onChange={(e) => setForm(prev => ({ ...prev, target_value: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Valor Mínimo"
                  type="number"
                  value={form.min_value}
                  onChange={(e) => setForm(prev => ({ ...prev, min_value: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Valor Máximo"
                  type="number"
                  value={form.max_value}
                  onChange={(e) => setForm(prev => ({ ...prev, max_value: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
            
            <FormControl fullWidth required>
              <InputLabel>Frequência de Medição</InputLabel>
              <Select
                value={form.measurement_frequency}
                onChange={(e) => setForm(prev => ({ ...prev, measurement_frequency: e.target.value }))}
                label="Frequência de Medição"
              >
                <MenuItem value="diario">Diário</MenuItem>
                <MenuItem value="semanal">Semanal</MenuItem>
                <MenuItem value="mensal">Mensal</MenuItem>
                <MenuItem value="trimestral">Trimestral</MenuItem>
                <MenuItem value="semestral">Semestral</MenuItem>
                <MenuItem value="anual">Anual</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving || !form.name || !form.kpi_type || !form.unit}
          >
            {saving ? 'Salvando...' : (editingKPI ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedKPI && (
          <>
            <DialogTitle>
              Detalhes do KPI
            </DialogTitle>
            
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={3} mt={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedKPI.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedKPI.description}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Tipo
                    </Typography>
                    <Typography variant="body2">
                      {selectedKPI.kpi_type}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Frequência
                    </Typography>
                    <Typography variant="body2">
                      {selectedKPI.measurement_frequency}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Faixa Aceitável
                  </Typography>
                  <Typography variant="body2">
                    {selectedKPI.min_value} - {selectedKPI.max_value} {selectedKPI.unit}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Meta
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {selectedKPI.target_value} {selectedKPI.unit}
                  </Typography>
                </Box>
                
                {selectedKPI.current_value !== undefined && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Valor Atual
                    </Typography>
                    <Typography variant="h6" color={getStatusColor(selectedKPI.status)}>
                      {selectedKPI.current_value} {selectedKPI.unit}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setShowDetails(false)}>
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
} 