import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Alert,
  Fade,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import Header from './Header';
import Sidebar from './Sidebar';

const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32', contrastText: '#ffffff' },
    secondary: { main: '#0288D1', contrastText: '#ffffff' },
    info: { main: '#1976D2', contrastText: '#ffffff' },
    success: { main: '#388E3C', contrastText: '#ffffff' },
    warning: { main: '#F57C00', contrastText: '#ffffff' },
    error: { main: '#D32F2F', contrastText: '#ffffff' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#263238', secondary: '#546E7A' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.8rem' },
    h5: { fontWeight: 600, fontSize: '1.4rem' },
    h6: { fontWeight: 500, fontSize: '1.2rem' },
    subtitle1: { fontWeight: 500, fontSize: '1rem' },
    body1: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
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
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 8px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          padding: '12px',
          '&:first-of-type': {
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px',
          },
          '&:last-of-type': {
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
          },
        },
        head: {
          backgroundColor: alpha('#2E7D32', 0.08),
          color: '#263238',
          fontWeight: 600,
        },
        body: {
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: alpha('#f5f5f5', 0.5),
          },
        },
      },
    },
  },
});

export default function DateSearch({ setToken }) {
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [iotData, setIotData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const serverUrl = 'http://192.168.0.237:5000'; // Actualizado a la URL correcta

      const [userResponse, iotResponse, alertsResponse] = await Promise.all([
        axios.get(`${serverUrl}/user`, config).catch(err => {
          console.error('Error al obtener usuario:', err.response?.data || err.message);
          return { data: null };
        }),
        axios.get(`${serverUrl}/iot-data/history`, {
          ...config,
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }).catch(err => {
          console.error('Error al obtener datos IoT:', err.response?.data || err.message);
          return { data: [] };
        }),
        axios.get(`${serverUrl}/iot-alerts`, config).catch(err => {
          console.error('Error al obtener alertas:', err.response?.data || err.message);
          return { data: { alerts: [] } };
        }),
      ]);

      if (userResponse.data && typeof userResponse.data === 'object' && userResponse.data.username) {
        setUser(userResponse.data);
        console.log('DateSearch - User response:', userResponse.data); // Log para depuración
      } else {
        setUser({ username: 'Usuario', role: 'collaborator' });
        setError('No se pudieron cargar los datos del usuario. Verifica tu sesión.');
      }

      setIotData(iotResponse.data || []);
      setAlerts(alertsResponse.data.alerts || []);
    } catch (error) {
      console.error('Error general al cargar datos:', error.response?.data || error.message);
      setError('Error al cargar los datos. Verifica la conexión con el servidor o el rango de fechas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Cargar datos al montar el componente
  }, []);

  const handleSearch = () => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona ambas fechas.');
      return;
    }
    if (endDate.isBefore(startDate)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Sidebar
          open={isMobile ? drawerOpen : true}
          onClose={handleDrawerToggle}
          onSelectView={() => {}}
          userRole={user?.role || 'collaborator'}
        />
        <Box sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
          <Header
            username={user?.username || 'Usuario'}
            role={user?.role || 'collaborator'} // Agregar prop role
            onLogout={handleLogout}
            isMobile={isMobile}
            alerts={alerts} // Pasar alertas al Header
          />
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 2, mx: isMobile ? 0 : 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          <Typography variant="h4" color="text.primary" sx={{ mb: 2, fontWeight: 700 }}>
            Búsqueda por Fecha
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona un rango de fechas para consultar los registros de sensores IoT y alertas.
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Fecha de Inicio"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={5} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Fecha de Fin"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={2} md={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    disabled={loading}
                    sx={{ height: '100%' }}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : 'Buscar'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" color="text.primary" sx={{ mb: 2 }}>
                Registros de Sensores IoT
              </Typography>
              <Divider sx={{ my: 2 }} />
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress size={60} thickness={4} />
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha y Hora</TableCell>
                        <TableCell>Temperatura (°C)</TableCell>
                        <TableCell>Humedad (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {iotData.length > 0 ? (
                        iotData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{row.temperature ? Number(row.temperature).toFixed(1) : 'N/A'}</TableCell>
                            <TableCell>{row.humidity ? Number(row.humidity).toFixed(1) : 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No se encontraron registros para el rango de fechas seleccionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.primary" sx={{ mb: 2 }}>
                Alertas
              </Typography>
              <Divider sx={{ my: 2 }} />
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <CircularProgress size={60} thickness={4} />
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha y Hora</TableCell>
                        <TableCell>Mensaje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alerts.length > 0 ? (
                        alerts.map((alert) => (
                          <TableRow key={`${alert.timestamp}-${alert.message}`}>
                            <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{alert.message}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            No se encontraron alertas para el rango de fechas seleccionado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  );
}