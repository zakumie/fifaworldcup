import { useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  open: boolean;
  message: string;
  severity: AlertSeverity;
}

interface AlertSnackbarProps {
  alert: AlertState;
  onClose: () => void;
}

export function AlertSnackbar({ alert, onClose }: AlertSnackbarProps) {
  return (
    <Snackbar
      open={alert.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={alert.severity}
        variant="filled"
        sx={{ borderRadius: 2 }}
      >
        {alert.message}
      </Alert>
    </Snackbar>
  );
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({ open: false, message: '', severity: 'success' });

  const showAlert = useCallback((message: string, severity: AlertSeverity = 'success') => {
    setAlert({ open: true, message, severity });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  return { alert, showAlert, closeAlert };
}
