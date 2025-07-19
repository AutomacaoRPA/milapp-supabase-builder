import React from 'react';
import {
  Box,
  Button,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  Dashboard as DashboardIcon,
  Assessment as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

interface QuickActionsProps {
  onNewProject: () => void;
  onImport: () => void;
  onExport: () => void;
  onSettings: () => void;
  onRefresh: () => void;
  onViewChange?: (view: 'grid' | 'list' | 'kanban') => void;
  currentView?: 'grid' | 'list' | 'kanban';
  showSpeedDial?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onNewProject,
  onImport,
  onExport,
  onSettings,
  onRefresh,
  onViewChange,
  currentView = 'grid',
  showSpeedDial = false,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const actions = [
    {
      icon: <AddIcon />,
      name: 'Nova Ideia',
      action: onNewProject,
      color: 'primary' as const,
    },
    {
      icon: <ImportIcon />,
      name: 'Importar',
      action: onImport,
      color: 'secondary' as const,
    },
    {
      icon: <ExportIcon />,
      name: 'Exportar',
      action: onExport,
      color: 'info' as const,
    },
    {
      icon: <SettingsIcon />,
      name: 'Configurar',
      action: onSettings,
      color: 'warning' as const,
    },
  ];

  const viewActions = [
    {
      icon: <GridIcon />,
      name: 'Visualização em Grade',
      value: 'grid' as const,
      active: currentView === 'grid',
    },
    {
      icon: <ListIcon />,
      name: 'Visualização em Lista',
      value: 'list' as const,
      active: currentView === 'list',
    },
    {
      icon: <DashboardIcon />,
      name: 'Visualização Kanban',
      value: 'kanban' as const,
      active: currentView === 'kanban',
    },
  ];

  if (showSpeedDial) {
    return (
      <SpeedDial
        ariaLabel="Ações rápidas"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          '& .MuiSpeedDial-fab': {
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        }}
        icon={<SpeedDialIcon />}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: `${action.color}.main`,
                '&:hover': {
                  bgcolor: `${action.color}.dark`,
                },
              },
            }}
          />
        ))}
      </SpeedDial>
    );
  }

  return (
    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
      {/* Botão principal */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onNewProject}
        sx={{
          bgcolor: 'primary.main',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          fontWeight: 600,
        }}
      >
        Nova Ideia
      </Button>

      {/* Botões secundários */}
      <Box display="flex" gap={1}>
        <Tooltip title="Importar Projetos">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ImportIcon />}
            onClick={onImport}
          >
            Importar
          </Button>
        </Tooltip>

        <Tooltip title="Exportar Dados">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon />}
            onClick={onExport}
          >
            Exportar
          </Button>
        </Tooltip>

        <Tooltip title="Atualizar">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Atualizar
          </Button>
        </Tooltip>
      </Box>

      {/* Menu de visualização */}
      {onViewChange && (
        <>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon />}
            onClick={handleClick}
            sx={{ minWidth: 'auto' }}
          >
            Visualização
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {viewActions.map((viewAction) => (
              <MenuItem
                key={viewAction.value}
                onClick={() => {
                  onViewChange(viewAction.value);
                  handleClose();
                }}
                selected={viewAction.active}
              >
                <ListItemIcon>{viewAction.icon}</ListItemIcon>
                <ListItemText>{viewAction.name}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Botão de configurações */}
      <Tooltip title="Configurações">
        <Button
          variant="outlined"
          size="small"
          startIcon={<SettingsIcon />}
          onClick={onSettings}
        >
          Configurar
        </Button>
      </Tooltip>
    </Box>
  );
};

// Componente de ações flutuantes para mobile
export const FloatingQuickActions: React.FC<QuickActionsProps> = (props) => {
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <SpeedDial
      ariaLabel="Ações rápidas"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        '& .MuiSpeedDial-fab': {
          bgcolor: 'primary.main',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        },
      }}
      icon={<SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      <SpeedDialAction
        icon={<AddIcon />}
        tooltipTitle="Nova Ideia"
        onClick={() => {
          props.onNewProject();
          handleClose();
        }}
        sx={{
          '& .MuiSpeedDialAction-fab': {
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        }}
      />
      <SpeedDialAction
        icon={<ImportIcon />}
        tooltipTitle="Importar"
        onClick={() => {
          props.onImport();
          handleClose();
        }}
        sx={{
          '& .MuiSpeedDialAction-fab': {
            bgcolor: 'secondary.main',
            '&:hover': {
              bgcolor: 'secondary.dark',
            },
          },
        }}
      />
      <SpeedDialAction
        icon={<ExportIcon />}
        tooltipTitle="Exportar"
        onClick={() => {
          props.onExport();
          handleClose();
        }}
        sx={{
          '& .MuiSpeedDialAction-fab': {
            bgcolor: 'info.main',
            '&:hover': {
              bgcolor: 'info.dark',
            },
          },
        }}
      />
      <SpeedDialAction
        icon={<SettingsIcon />}
        tooltipTitle="Configurar"
        onClick={() => {
          props.onSettings();
          handleClose();
        }}
        sx={{
          '& .MuiSpeedDialAction-fab': {
            bgcolor: 'warning.main',
            '&:hover': {
              bgcolor: 'warning.dark',
            },
          },
        }}
      />
    </SpeedDial>
  );
};

export default QuickActions; 