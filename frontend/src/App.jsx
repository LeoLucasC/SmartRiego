import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#ffeb3b',  // Amarillo
      contrastText: '#212121',
    },
    secondary: { 
      main: '#f44336',  // Rojo
      contrastText: '#ffffff',
    },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#263238', secondary: '#546E7A' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.8rem', letterSpacing: 1 },
    h5: { fontWeight: 600, fontSize: '1.4rem' },
    h6: { fontWeight: 500, fontSize: '1.2rem' },
    subtitle1: { fontWeight: 500, fontSize: '1rem' },
    body1: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': { boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)', transform: 'translateY(-2px)' },
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0,0,0,0.08)',
          margin: '12px 0',
        },
      },
    },
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh' }}>
          {showRegister ? (
            <Register setToken={setToken} setShowRegister={setShowRegister} />
          ) : (
            <Login setToken={setToken} setShowRegister={setShowRegister} />
          )}
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard setToken={setToken} />} />
          <Route path="/store" element={<Dashboard setToken={setToken} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;