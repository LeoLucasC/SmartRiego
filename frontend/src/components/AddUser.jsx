import React, { useState, useEffect } from 'react';
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
  MenuItem,
  useMediaQuery
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Sidebar from './Sidebar';
import Header from './Header';
import videoBg from '../resource/video.mp4';
import sideImage from '../resource/riege.png';
import logoSmart from '../resource/logoreal.png';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#ffeb3b',
      light: '#fff176',
      dark: '#fbc02d',
      contrastText: '#212121',
    },
    secondary: { 
      main: '#f44336',
      light: '#ef5350',
      dark: '#d32f2f',
      contrastText: '#ffffff',
    },
    background: { 
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: { 
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: 1,
      color: '#212121',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease',
        },
        containedPrimary: {
          backgroundColor: '#ffeb3b',
          color: '#212121',
          '&:hover': {
            backgroundColor: '#fbc02d',
          },
        },
        containedSecondary: {
          backgroundColor: '#f44336',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#d32f2f',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e0e0e0',
              borderRadius: '12px',
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffeb3b',
              boxShadow: '0 0 0 3px rgba(255, 235, 59, 0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#757575',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ffeb3b',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: '#4caf50',
          color: '#ffffff',
        },
        standardError: {
          backgroundColor: '#f44336',
          color: '#ffffff',
        },
      },
    },
  },
});

export default function AddUser({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [groupId, setGroupId] = useState(1);
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
          setSeverity('error');
          setOpen(true);
          return;
        }
        const response = await axios.get('http://192.168.18.106:5000/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        console.log('AddUser - User response:', response.data);
        if (response.data.role !== 'admin') {
          setMessage('Solo los administradores pueden acceder a esta página.');
          setSeverity('error');
          setOpen(true);
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error.response?.data || error.message);
        setMessage('Error al cargar los datos del usuario. Verifica tu sesión.');
        setSeverity('error');
        setOpen(true);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!username || !password || username.length < 3 || password.length < 6) {
      setMessage('El nombre de usuario debe tener al menos 3 caracteres y la contraseña al menos 6.');
      setSeverity('error');
      setOpen(true);
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setSeverity('error');
      setOpen(true);
      setIsLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://192.168.0.106:5000/add-user',
        { 
          username, 
          password,
          role: 'collaborator',  // Por defecto siempre collaborator
          group_id: groupId      // Nuevo: enviar el grupo seleccionado
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setSeverity('success');
      setOpen(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setGroupId(1);
    } catch (error) {
      console.error('Error al agregar usuario:', error.response?.data || error.message);
      setMessage(error.response?.data.error || 'Error al agregar el usuario.');
      setSeverity('error');
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post('http://192.168.0.106:5000/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Error en logout:', err));
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (user && user.role !== 'admin') {
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
              zIndex: 1,
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
              zIndex: 0,
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
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                backgroundColor: alpha('#ffffff', 0.95),
                padding: { xs: '30px', md: '40px' },
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%',
              }}
            >
              <Typography variant="h4" color="error.main" sx={{ mb: 2 }}>
                Acceso Denegado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Solo los administradores pueden acceder a esta página.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleLogout}
                sx={{ borderRadius: '10px' }}
              >
                Cerrar Sesión
              </Button>
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
                borderRadius: '12px',
              }}
            >
              {message}
            </Alert>
          </Snackbar>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Sidebar
          open={isMobile ? drawerOpen : true}
          onClose={handleDrawerToggle}
          onSelectView={() => {}}
          userRole={user?.role || 'collaborator'}
        />
        <Box
          sx={{
            flexGrow: 1,
            position: 'relative',
            height: '100vh',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1,
            },
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
              zIndex: 0,
            }}
          >
            <source src={videoBg} type="video/mp4" />
          </video>
          <Box
            sx={{
              flexGrow: 1,
              p: isMobile ? 2 : 3,
              position: 'relative',
              zIndex: 2,
              height: '100%',
            }}
          >
            <Header
              username={user?.username || 'Usuario'}
              role={user?.role || 'collaborator'}
              onLogout={handleLogout}
              isMobile={isMobile}
            />
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                height: 'calc(100% - 70px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
                  overflow: 'hidden',
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
                      background: 'linear-gradient(to bottom, rgba(255, 235, 59, 0.3), rgba(244, 67, 54, 0.3))',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={sideImage}
                    alt="Imagen descriptiva"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
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
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      Sistema Inteligente
                    </Typography>
                    <Typography variant="body1">
                      Monitoreo avanzado de temperatura y humedad
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: { xs: '100%', md: '60%' },
                    backgroundColor: alpha('#ffffff', 0.95),
                    padding: { xs: '30px', md: '40px' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backdropFilter: 'blur(5px)',
                  }}
                >
                  <Box
                    component="img"
                    src={logoSmart}
                    alt="Logo SmartTemperatura"
                    sx={{
                      display: 'block',
                      margin: '0 auto 15px auto',
                      width: '80px',
                      height: '80px',
                    }}
                  />
                  <Typography
                    variant="h4"
                    component="h1"
                    align="center"
                    sx={{
                      mb: 2,
                      color: 'secondary.main',
                      fontSize: '1.4rem',
                    }}
                  >
                    <PersonAddOutlinedIcon
                      sx={{
                        verticalAlign: 'middle',
                        mr: 1,
                        fontSize: '1.4rem',
                        color: 'primary.main',
                      }}
                    />
                    AGREGAR COLABORADOR
                  </Typography>
                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                      '& .MuiTextField-root': {
                        mb: 1.5,
                      },
                    }}
                  >
                    <TextField
                      fullWidth
                      required
                      label="Usuario"
                      variant="outlined"
                      margin="normal"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      size="small"
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
                      size="small"
                    />
                    <TextField
                      fullWidth
                      required
                      label="Confirmar Contraseña"
                      type="password"
                      variant="outlined"
                      margin="normal"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      size="small"
                    />

                    <TextField
                    fullWidth
                    select
                    label="Grupo"
                    variant="outlined"
                    margin="normal"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    size="small"
                    helperText="Asigna el colaborador a un grupo de trabajo"
                  >
                    <MenuItem value={1}>Grupo 1 - Principal</MenuItem>
                    <MenuItem value={2}>Grupo 2 - Secundario</MenuItem>
                    <MenuItem value={3}>Grupo 3 - Auxiliar</MenuItem>
                  </TextField>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="medium"
                      disabled={isLoading}
                      sx={{
                        py: 1,
                        mt: 2,
                        mb: 1,
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'AGREGAR COLABORADOR'
                      )}
                    </Button>
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
                  borderRadius: '12px',
                }}
              >
                {message}
              </Alert>
            </Snackbar>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}