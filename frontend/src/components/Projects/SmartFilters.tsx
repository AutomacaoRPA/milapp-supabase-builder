import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  Paper,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const FilterChip: React.FC<FilterChipProps> = ({ label, count, active, onClick, color = 'default' }) => (
  <Chip
    label={`${label} (${count})`}
    onClick={onClick}
    color={active ? 'primary' : color}
    variant={active ? 'filled' : 'outlined'}
    size="small"
    sx={{
      fontWeight: active ? 600 : 400,
      '&:hover': {
        transform: 'scale(1.05)',
        transition: 'transform 0.2s',
      },
    }}
  />
);

interface SmartFiltersProps {
  projects: any[];
  onFilterChange: (filters: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SmartFilters: React.FC<SmartFiltersProps> = ({
  projects,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({
    status: [],
    priority: [],
    type: [],
    methodology: [],
    overdue: false,
    thisWeek: false,
    highPriority: false,
  });

  // Calcular contadores
  const getCounts = () => {
    const counts = {
      overdue: 0,
      thisWeek: 0,
      highPriority: 0,
      automation: 0,
      enhancement: 0,
      maintenance: 0,
      planning: 0,
      development: 0,
      testing: 0,
      deployed: 0,
      scrum: 0,
      kanban: 0,
      hybrid: 0,
    };

    projects.forEach(project => {
      // Contar por tipo
      counts[project.type as keyof typeof counts]++;
      
      // Contar por status
      counts[project.status as keyof typeof counts]++;
      
      // Contar por metodologia
      counts[project.methodology as keyof typeof counts]++;
      
      // Contar atrasados
      if (project.end_date) {
        const endDate = new Date(project.end_date);
        const today = new Date();
        if (endDate < today && project.status !== 'deployed') {
          counts.overdue++;
        }
      }
      
      // Contar desta semana
      if (project.end_date) {
        const endDate = new Date(project.end_date);
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (endDate <= weekFromNow && endDate >= today) {
          counts.thisWeek++;
        }
      }
      
      // Contar alta prioridade
      if (project.priority === 'high') {
        counts.highPriority++;
      }
    });

    return counts;
  };

  const counts = getCounts();

  const handleFilterToggle = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters };
    
    if (filterType === 'overdue' || filterType === 'thisWeek' || filterType === 'highPriority') {
      newFilters[filterType] = !newFilters[filterType];
    } else {
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter((v: string) => v !== value);
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
    }
    
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      status: [],
      priority: [],
      type: [],
      methodology: [],
      overdue: false,
      thisWeek: false,
      highPriority: false,
    };
    setActiveFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(activeFilters).some(filter => 
    Array.isArray(filter) ? filter.length > 0 : filter
  );

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header dos filtros */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Filtros Inteligentes
          </Typography>
          {hasActiveFilters && (
            <Chip
              label={`${Object.values(activeFilters).filter(f => 
                Array.isArray(f) ? f.length > 0 : f
              ).length} ativo(s)`}
              size="small"
              color="primary"
              variant="filled"
            />
          )}
        </Box>
        
        <Box display="flex" gap={1}>
          {hasActiveFilters && (
            <Tooltip title="Limpar todos os filtros">
              <IconButton size="small" onClick={clearAllFilters}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={expanded ? "Recolher filtros" : "Expandir filtros"}>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Busca */}
      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Buscar projetos, automações, responsáveis..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      {/* Filtros rápidos */}
      <Box mb={2}>
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          Filtros Rápidos
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <FilterChip
            label="Atrasados"
            count={counts.overdue}
            active={activeFilters.overdue}
            onClick={() => handleFilterToggle('overdue', '')}
            color="error"
          />
          <FilterChip
            label="Esta Semana"
            count={counts.thisWeek}
            active={activeFilters.thisWeek}
            onClick={() => handleFilterToggle('thisWeek', '')}
            color="warning"
          />
          <FilterChip
            label="Alta Prioridade"
            count={counts.highPriority}
            active={activeFilters.highPriority}
            onClick={() => handleFilterToggle('highPriority', '')}
            color="error"
          />
        </Box>
      </Box>

      {/* Filtros expandidos */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        
        <Box display="flex" gap={3} flexWrap="wrap">
          {/* Filtro por Status */}
          <Box minWidth={200}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Status
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <FilterChip
                label="Planejamento"
                count={counts.planning}
                active={activeFilters.status.includes('planning')}
                onClick={() => handleFilterToggle('status', 'planning')}
              />
              <FilterChip
                label="Desenvolvimento"
                count={counts.development}
                active={activeFilters.status.includes('development')}
                onClick={() => handleFilterToggle('status', 'development')}
              />
              <FilterChip
                label="Testes"
                count={counts.testing}
                active={activeFilters.status.includes('testing')}
                onClick={() => handleFilterToggle('status', 'testing')}
              />
              <FilterChip
                label="Deployado"
                count={counts.deployed}
                active={activeFilters.status.includes('deployed')}
                onClick={() => handleFilterToggle('status', 'deployed')}
              />
            </Box>
          </Box>

          {/* Filtro por Tipo */}
          <Box minWidth={200}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Tipo de Projeto
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <FilterChip
                label="Automação"
                count={counts.automation}
                active={activeFilters.type.includes('automation')}
                onClick={() => handleFilterToggle('type', 'automation')}
              />
              <FilterChip
                label="Melhoria"
                count={counts.enhancement}
                active={activeFilters.type.includes('enhancement')}
                onClick={() => handleFilterToggle('type', 'enhancement')}
              />
              <FilterChip
                label="Manutenção"
                count={counts.maintenance}
                active={activeFilters.type.includes('maintenance')}
                onClick={() => handleFilterToggle('type', 'maintenance')}
              />
            </Box>
          </Box>

          {/* Filtro por Metodologia */}
          <Box minWidth={200}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Metodologia
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <FilterChip
                label="Scrum"
                count={counts.scrum}
                active={activeFilters.methodology.includes('scrum')}
                onClick={() => handleFilterToggle('methodology', 'scrum')}
              />
              <FilterChip
                label="Kanban"
                count={counts.kanban}
                active={activeFilters.methodology.includes('kanban')}
                onClick={() => handleFilterToggle('methodology', 'kanban')}
              />
              <FilterChip
                label="Híbrido"
                count={counts.hybrid}
                active={activeFilters.methodology.includes('hybrid')}
                onClick={() => handleFilterToggle('methodology', 'hybrid')}
              />
            </Box>
          </Box>
        </Box>

        {/* Filtros avançados */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          Filtros Avançados
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select
              value={activeFilters.priority}
              onChange={(e) => {
                const newFilters = { ...activeFilters, priority: e.target.value };
                setActiveFilters(newFilters);
                onFilterChange(newFilters);
              }}
              label="Prioridade"
              multiple
            >
              <MenuItem value="low">Baixa</MenuItem>
              <MenuItem value="medium">Média</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Progresso</InputLabel>
            <Select
              value=""
              onChange={() => {}}
              label="Progresso"
            >
              <MenuItem value="0-25">0-25%</MenuItem>
              <MenuItem value="25-50">25-50%</MenuItem>
              <MenuItem value="50-75">50-75%</MenuItem>
              <MenuItem value="75-100">75-100%</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SmartFilters; 