import React from 'react';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Folder as FolderIcon,
  Target as TargetIcon,
  Assignment as ProjectIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string;
  color?: string;
}

interface EnhancedBreadcrumbsProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  showIcons?: boolean;
  showBadges?: boolean;
}

const EnhancedBreadcrumbs: React.FC<EnhancedBreadcrumbsProps> = ({
  items,
  maxItems = 5,
  showIcons = true,
  showBadges = true,
}) => {
  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === items.length - 1;
    const isActive = item.active || isLast;

    const content = (
      <Box display="flex" alignItems="center" gap={1}>
        {showIcons && item.icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: isActive ? 'primary.main' : 'text.secondary',
            }}
          >
            {item.icon}
          </Box>
        )}
        
        <Typography
          variant="body2"
          sx={{
            color: isActive ? 'primary.main' : 'text.secondary',
            fontWeight: isActive ? 600 : 400,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: isActive ? 'none' : 'underline',
            },
          }}
        >
          {item.label}
        </Typography>

        {showBadges && item.badge && (
          <Chip
            label={item.badge}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.75rem',
              bgcolor: item.color || 'primary.main',
              color: '#fff',
              fontWeight: 500,
            }}
          />
        )}
      </Box>
    );

    if (isActive) {
      return (
        <Typography
          key={index}
          variant="body2"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {content}
        </Typography>
      );
    }

    if (item.onClick) {
      return (
        <Link
          key={index}
          component="button"
          variant="body2"
          onClick={item.onClick}
          sx={{
            color: 'text.secondary',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
          }}
        >
          {content}
        </Link>
      );
    }

    if (item.href) {
      return (
        <Link
          key={index}
          href={item.href}
          variant="body2"
          sx={{
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {content}
        </Link>
      );
    }

    return (
      <Typography
        key={index}
        variant="body2"
        sx={{
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {content}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        mb: 2,
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        maxItems={maxItems}
        itemsBeforeCollapse={2}
        itemsAfterCollapse={1}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary',
          },
        }}
      >
        {items.map((item, index) => renderBreadcrumbItem(item, index))}
      </Breadcrumbs>
    </Box>
  );
};

// Componente específico para navegação de projetos
interface ProjectBreadcrumbsProps {
  currentProject?: {
    id: string;
    name: string;
    status: string;
  };
  onNavigate: (path: string) => void;
}

export const ProjectBreadcrumbs: React.FC<ProjectBreadcrumbsProps> = ({
  currentProject,
  onNavigate,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return '#2196F3';
      case 'development':
        return '#4CAF50';
      case 'testing':
        return '#FF9800';
      case 'deployed':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      icon: <HomeIcon />,
      onClick: () => onNavigate('/dashboard'),
    },
    {
      label: 'Projetos',
      icon: <FolderIcon />,
      onClick: () => onNavigate('/projects'),
    },
  ];

  if (currentProject) {
    breadcrumbItems.push(
      {
        label: currentProject.name,
        icon: <ProjectIcon />,
        badge: currentProject.status,
        color: getStatusColor(currentProject.status),
        active: true,
      }
    );
  }

  return (
    <EnhancedBreadcrumbs
      items={breadcrumbItems}
      showIcons={true}
      showBadges={true}
    />
  );
};

// Componente para navegação de status
interface StatusBreadcrumbsProps {
  currentStatus?: string;
  onNavigate: (status: string) => void;
}

export const StatusBreadcrumbs: React.FC<StatusBreadcrumbsProps> = ({
  currentStatus,
  onNavigate,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <TargetIcon />;
      case 'development':
        return <ProjectIcon />;
      case 'testing':
        return <TargetIcon />;
      case 'deployed':
        return <ProjectIcon />;
      default:
        return <FolderIcon />;
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      icon: <HomeIcon />,
      onClick: () => onNavigate('dashboard'),
    },
    {
      label: 'Projetos',
      icon: <FolderIcon />,
      onClick: () => onNavigate('projects'),
    },
  ];

  if (currentStatus) {
    breadcrumbItems.push({
      label: currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1),
      icon: getStatusIcon(currentStatus),
      active: true,
    });
  }

  return (
    <EnhancedBreadcrumbs
      items={breadcrumbItems}
      showIcons={true}
      showBadges={false}
    />
  );
};

export default EnhancedBreadcrumbs; 