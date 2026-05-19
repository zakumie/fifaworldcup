import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { store } from './app/store';
import { getTheme } from './app/theme';
import { MusicProvider } from './contexts/MusicContext';
import App from './App';
import './index.css';
import { useAppSelector } from './app/hooks';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function ThemedApp() {
  const mode = useAppSelector((state) => state.theme.mode);
  const theme = getTheme(mode);

  // Sync dark class to <html> for Tailwind dark: variants
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <MusicProvider>
        <CssBaseline />
        <App />
      </MusicProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemedApp />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
