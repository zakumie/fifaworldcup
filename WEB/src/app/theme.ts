import { createTheme } from '@mui/material/styles';

export function getTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1a472a',
        light: '#2d6a3f',
        dark: '#0d2415',
      },
      secondary: {
        main: '#8b0000',
        light: '#b71c1c',
        dark: '#5c0000',
      },
      background: isDark
        ? { default: '#0f1117', paper: '#1a1d2e' }
        : { default: '#f5f5f5', paper: '#ffffff' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 8 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { borderRadius: 0 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}

export const theme = getTheme('light');
