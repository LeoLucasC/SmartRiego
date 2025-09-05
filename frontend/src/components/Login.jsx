import React, { useState } from 'react';
import axios from 'axios';
import {
  Button,
  CssBaseline,
  TextField,
  Box,
  Typography,
  Snackbar,
  Alert,
  Fade,
  CircularProgress,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import videoBg from '../resource/video.mp4';
import sideImage from '../resource/riege.png';
import logoSmart from '../resource/logoreal.png';
import androidLogo from '../resource/androide.png';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#ffeb3b',  // Amarillo vibrante
      light: '#fff176', // Amarillo claro
      dark: '#fbc02d',  // Amarillo oscuro
      contrastText: '#212121', // Texto oscuro para buen contraste
    },
    secondary: { 
      main: '#f44336',  // Rojo vibrante
      light: '#ef5350', // Rojo claro
      dark: '#d32f2f',  // Rojo oscuro
      contrastText: '#ffffff', // Texto blanco para buen contraste
    },
    background: { 
      default: '#f5f5f5', // Fondo gris claro
      paper: '#ffffff',   // Fondo blanco para elementos
    },
    text: {
      primary: '#212121', // Texto principal oscuro
      secondary: '#757575', // Texto secundario
    },
  },
  typography: { 
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: 1,
      color: '#212121', // Color oscuro para buen contraste
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)'
          },
          transition: 'all 0.3s ease'
        },
        containedPrimary: {
          backgroundColor: '#ffeb3b',
          color: '#212121',
          '&:hover': {
            backgroundColor: '#fbc02d',
          }
        },
        containedSecondary: {
          backgroundColor: '#f44336',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#d32f2f',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e0e0e0',
              borderRadius: '12px'
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffeb3b', // Borde amarillo al enfocar
              boxShadow: '0 0 0 3px rgba(255, 235, 59, 0.2)'
            },
          },
          '& .MuiInputLabel-root': {
            color: '#757575',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ffeb3b', // Etiqueta amarilla al enfocar
          }
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: '#4caf50', // Verde para éxito (se mantiene)
          color: '#ffffff',
        },
        standardError: {
          backgroundColor: '#f44336', // Rojo para errores
          color: '#ffffff',
        }
      }
    }
  }
});

export default function Login({ setToken, setShowRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post('http://192.168.0.237:5000/login', {
        username,
        password,
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setMessage('¡Inicio de sesión exitoso!');
      setSeverity('success');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error en el inicio de sesión');
      setSeverity('error');
    } finally {
      setOpen(true);
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover',
            zIndex: 0
          }}
        >
          <source src={videoBg} type="video/mp4" />
        </video>

        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              height: { xs: 'auto', md: '80%' },
              maxHeight: '800px',
              width: { xs: '90%', md: '80%' },
              maxWidth: '1000px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              borderRadius: '20px',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                width: '40%',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to bottom, rgba(255, 235, 59, 0.3), rgba(244, 67, 54, 0.3))' // Degradado amarillo-rojo
                }
              }}
            >
              <Box
                component="img"
                src={sideImage}
                alt="Imagen descriptiva"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 40,
                  left: 0,
                  width: '100%',
                  padding: '0 30px',
                  color: 'white',
                  textAlign: 'center',
                  zIndex: 2,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Sistema Inteligente
                </Typography>
                <Typography variant="body1">
                  Gestión avanzada de riego agrícola
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                width: { xs: '100%', md: '60%' },
                backgroundColor: alpha('#ffffff', 0.95), // Fondo blanco semitransparente
                padding: { xs: '30px', md: '40px' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
              }}
            >
              <Box
                component="img"
                src={logoSmart}
                alt="Logo Smart"
                sx={{
                  display: 'block',
                  margin: '0 auto 25px auto',
                  width: '100px',
                  height: '100px'
                }}
              />
              <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                sx={{ 
                  mb: 3,
                   color: 'secondary.main', // Cambiado a rojo
                  fontSize: '1.6rem'
                }}
              >
                <LockOutlinedIcon 
                  sx={{ 
                    verticalAlign: 'middle', 
                    mr: 2,
                    fontSize: '1.6rem',
                    color: 'primary.main'
                  }} 
                />
                INICIAR SESIÓN
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  required
                  label="Usuario"
                  variant="outlined"
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  required
                  label="Contraseña"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    borderRadius: '10px',
                    fontSize: '1rem',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'ACCEDER'
                  )}
                </Button>
                <Typography 
                  variant="body2" 
                  align="center"
                  sx={{
                    mt: 2,
                    color: 'text.secondary',
                    mb: 3
                  }}
                >
                  ¿No tienes una cuenta?{' '}
                  <Button
                    onClick={() => setShowRegister(true)}
                    color="secondary"
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'none',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    Regístrate aquí
                  </Button>
                </Typography>
                <Box sx={{ 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <Snackbar
          open={open}
          autoHideDuration={5000}
          onClose={() => setOpen(false)}
          TransitionComponent={Fade}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setOpen(false)}
            severity={severity}
            variant="filled"
            sx={{ 
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              borderRadius: '12px'
            }}
          >
            {message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}