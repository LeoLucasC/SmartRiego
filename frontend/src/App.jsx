import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#00796b', contrastText: '#ffffff' },
    secondary: { main: '#00bcd4', contrastText: '#ffffff' },
    info: { main: '#1976d2', contrastText: '#ffffff' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: 1 },
  },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        {token ? (
          <Dashboard setToken={setToken} />
        ) : showRegister ? (
          <Register setToken={setToken} setShowRegister={setShowRegister} />
        ) : (
          <Login setToken={setToken} setShowRegister={setShowRegister} />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;