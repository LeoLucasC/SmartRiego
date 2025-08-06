import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import { Box, Button, Typography } from '@mui/material';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);

  if (token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <Box sx={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Sistema de Riego IoT</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>Bienvenido. Estás autenticado.</Typography>
          <Button
            onClick={() => {
              localStorage.removeItem('token');
              setToken(null);
            }}
            variant="contained"
            color="error"
            sx={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {showRegister ? (
        <Register setToken={setToken} setShowRegister={setShowRegister} />
      ) : (
        <Login setToken={setToken} setShowRegister={setShowRegister} />
      )}
    </Box>
  );
}

export default App;