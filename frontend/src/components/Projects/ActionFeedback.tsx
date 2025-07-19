import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  LinearProgress,
  Fade,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ActionFeedbackProps {
  messages: FeedbackMessage[];
  onClose: (id: string) => void;
}

const ActionFeedback: React.FC<ActionFeedbackProps> = ({ messages, onClose }) => {
  const getAlertIcon = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getAlertColor = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <>
      {messages.map((message) => (
        <Snackbar
          key={message.id}
          open={true}
          autoHideDuration={message.duration || 6000}
          onClose={() => onClose(message.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ zIndex: 9999 }}
        >
          <Alert
            onClose={() => onClose(message.id)}
            severity={getAlertColor(message.type)}
            icon={getAlertIcon(message.type)}
            sx={{
              width: '100%',
              minWidth: 300,
              maxWidth: 400,
              boxShadow: 3,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
            action={message.action && (
              <Box
                component="button"
                onClick={message.action.onClick}
                sx={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                {message.action.label}
              </Box>
            )}
          >
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {message.title}
            </AlertTitle>
            <Typography variant="body2">
              {message.message}
            </Typography>
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

// Componente de loading com feedback
interface LoadingFeedbackProps {
  message: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingFeedback: React.FC<LoadingFeedbackProps> = ({
  message,
  progress,
  showProgress = false,
}) => {
  return (
    <Fade in={true}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 3,
            boxShadow: 8,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
          }}
        >
          <InfoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} mb={1}>
            Processando...
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={2}>
            {message}
          </Typography>
          
          {showProgress && progress !== undefined && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="textSecondary">
                  Progresso
                </Typography>
                <Typography variant="caption" color="primary" fontWeight={500}>
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

// Hook para gerenciar feedback
export const useFeedback = () => {
  const [messages, setMessages] = React.useState<FeedbackMessage[]>([]);

  const addMessage = React.useCallback((
    type: FeedbackMessage['type'],
    title: string,
    message: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => {
    const id = Date.now().toString();
    const newMessage: FeedbackMessage = {
      id,
      type,
      title,
      message,
      duration,
      action,
    };

    setMessages(prev => [...prev, newMessage]);

    // Auto-remove after duration
    if (duration) {
      setTimeout(() => {
        removeMessage(id);
      }, duration);
    }
  }, []);

  const removeMessage = React.useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const showSuccess = React.useCallback((title: string, message: string, duration = 4000) => {
    addMessage('success', title, message, duration);
  }, [addMessage]);

  const showError = React.useCallback((title: string, message: string, duration = 6000) => {
    addMessage('error', title, message, duration);
  }, [addMessage]);

  const showInfo = React.useCallback((title: string, message: string, duration = 4000) => {
    addMessage('info', title, message, duration);
  }, [addMessage]);

  const showWarning = React.useCallback((title: string, message: string, duration = 5000) => {
    addMessage('warning', title, message, duration);
  }, [addMessage]);

  return {
    messages,
    removeMessage,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

export default ActionFeedback; 