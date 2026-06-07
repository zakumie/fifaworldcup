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
      fontFamily: '"Be Vietnam Pro", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
      ...(isDark && {
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              '& .MuiSvgIcon-root': {
                color: 'rgba(0, 0, 0, 0.54)',
              },
            },
            input: {
              colorScheme: 'light',
            },
            notchedOutline: {
              borderColor: 'rgba(0, 0, 0, 0.23)',
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            icon: {
              color: 'rgba(255, 255, 255, 0.54)',
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: 'rgba(0, 0, 0, 0.6)',
            },
          },
        },
        MuiInputAdornment: {
          styleOverrides: {
            root: {
              '& .MuiSvgIcon-root': {
                color: 'rgba(0, 0, 0, 0.54)',
              },
            },
          },
        },
      }),
    },
  });
}

export const theme = getTheme('light');
