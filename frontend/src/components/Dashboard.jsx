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
  Slider,
  Alert,
  AlertTitle,
  Fade,
  Button,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Header from './Header';
import Sidebar from './Sidebar';
import WarningIcon from '@mui/icons-material/Warning';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StoreIcon from '@mui/icons-material/Store';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Tema
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
});

// StatusCard component
const StatusCard = ({ icon, title, value, subtitle, color, unit }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Box
          sx={{
            bgcolor: alpha(color || theme.palette.primary.main, 0.1),
            color: color || theme.palette.primary.main,
            mr: 2,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" color="text.primary">{title}</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h3" sx={{ color: color || theme.palette.primary.main, lineHeight: 1, textAlign: 'center' }}>
          {value}{unit && <Typography component="span" variant="h5" color="text.secondary"> {unit}</Typography>}
        </Typography>
      </Box>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard({ setToken }) {
  const [user, setUser] = useState(null);
  const [currentData, setCurrentData] = useState(null); // Dato actual (tiempo real)
  const [realtimeHistory, setRealtimeHistory] = useState([]); // Histórico de tiempo real (últimos 20 datos)
  const [historicalData, setHistoricalData] = useState([]); // Datos históricos de la base
  const [historicalChartData, setHistoricalChartData] = useState({ labels: [], datasets: [] });
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const [debugInfo, setDebugInfo] = useState({
    lastFetch: null,
    fetchCount: 0,
    apiResponses: {},
    connectionStatus: 'connecting'
  });
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const serverUrl = 'http://192.168.0.106:5000';
  
  const logDebug = (type, message, data = null) => {
    const timestamp = new Date().toISOString();
    console.group(`🔍 [${timestamp}] ${type.toUpperCase()}`);
    console.log(`📝 ${message}`);
    if (data) {
      console.log('📊 Datos:', data);
    }
    console.groupEnd();
    
    setDebugInfo(prev => ({
      ...prev,
      lastFetch: timestamp,
      fetchCount: prev.fetchCount + 1
    }));
  };

  const fetchCurrentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      logDebug('realtime', 'Obteniendo dato actual...');
      
      const response = await axios.get(`${serverUrl}/iot-data/latest`, config);
      const data = response.data;
      
      logDebug('realtime', 'Dato actual obtenido', data);
      
      setCurrentData(data);
      
      // Agregar al histórico de tiempo real (mantener solo últimos 20)
      setRealtimeHistory(prev => {
        const updated = [...prev, data];
        return updated.slice(-20); // Mantener solo últimos 20 datos
      });

      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, current: 'success' },
        connectionStatus: 'connected'
      }));
      
      return data;
    } catch (error) {
      logDebug('error', 'Error obteniendo dato actual', error);
      
      if (error.response?.status === 404) {
        logDebug('info', 'No hay datos recientes (404)');
        setCurrentData(null);
        setDebugInfo(prev => ({
          ...prev,
          apiResponses: { ...prev.apiResponses, current: 'no-data' },
          connectionStatus: 'no-data'
        }));
      } else {
        setDebugInfo(prev => ({
          ...prev,
          apiResponses: { ...prev.apiResponses, current: 'error' },
          connectionStatus: 'error'
        }));
      }
      return null;
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        params: { 
          startDate: dayjs().subtract(1, 'day').toISOString(), 
          endDate: dayjs().toISOString(),
          limit: 100
        }
      };

      logDebug('history', 'Obteniendo datos históricos...');
      
      const response = await axios.get(`${serverUrl}/iot-data/history`, config);
      const data = response.data || [];
      
      logDebug('history', `Datos históricos obtenidos: ${data.length} registros`, data.slice(0, 3));
      
      setHistoricalData(data);
      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, history: 'success' }
      }));
      
      return data;
    } catch (error) {
      logDebug('error', 'Error obteniendo datos históricos', error);
      setHistoricalData([]);
      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, history: 'error' }
      }));
      return [];
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const response = await axios.get(`${serverUrl}/iot-alerts`, config);
      const newAlerts = response.data.alerts || [];
      
      logDebug('alerts', `Alertas obtenidas: ${newAlerts.length}`, newAlerts);
      
      const filteredAlerts = [];
      let lastMessage = '';
      for (const alert of newAlerts.slice(0, 3)) {
        if (alert.message && alert.message.trim() !== '' && alert.message !== lastMessage) {
          filteredAlerts.push({ 
            ...alert, 
            id: `${alert.timestamp}-${alert.message}`, 
            expiry: Date.now() + 30000 
          });
          lastMessage = alert.message;
        }
      }
      setAlerts(filteredAlerts);
      
      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, alerts: 'success' }
      }));
    } catch (error) {
      logDebug('error', 'Error obteniendo alertas', error);
      setAlerts([]);
      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, alerts: 'error' }
      }));
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.get(`${serverUrl}/user`, config);
      const userData = response.data;
      
      logDebug('user', 'Usuario obtenido', userData);
      setUser(userData);
      
      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, user: 'success' }
      }));
    } catch (error) {
      logDebug('error', 'Error obteniendo usuario', error);
      setUser({ username: 'Usuario', role: 'collaborator', group_id: 1 });
      setDebugInfo(prev => ({
        ...prev,
        apiResponses: { ...prev.apiResponses, user: 'error' }
      }));
    }
  };

  const fetchData = async () => {
    logDebug('fetch', 'Iniciando obtención completa de datos...');
    
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        logDebug('error', 'No se encontró token de autenticación');
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Ejecutar todas las peticiones
      await Promise.allSettled([
        fetchUser(),
        fetchCurrentData(),
        fetchHistoricalData(),
        fetchAlerts()
      ]);

      setError(null);
      logDebug('success', '✅ Obtención de datos completada exitosamente');

    } catch (error) {
      logDebug('fatal', '❌ Error fatal en fetchData', error);
      setError(`Error al cargar los datos: ${error.message}`);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Effect para preparar datos del gráfico histórico
  useEffect(() => {
    if (historicalData.length > 0) {
      logDebug('chart', `Actualizando gráfico histórico con ${historicalData.length} puntos`);
      
      const chartData = {
        labels: historicalData.slice(-30).map((data) => new Date(data.timestamp).toLocaleString()),
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: historicalData.slice(-30).map((data) => parseFloat(data.temperature) || 0),
            borderColor: '#0288D1',
            backgroundColor: alpha('#0288D1', 0.05),
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Humedad (%)',
            data: historicalData.slice(-30).map((data) => parseFloat(data.humidity) || 0),
            borderColor: '#2E7D32',
            backgroundColor: alpha('#2E7D32', 0.05),
            tension: 0.3,
            fill: true,
          },
        ],
      };
      setHistoricalChartData(chartData);
    } else {
      logDebug('chart', 'No hay datos históricos para el gráfico');
      setHistoricalChartData({ labels: [], datasets: [] });
    }
  }, [historicalData]);

  // Effect para cargar datos iniciales
  useEffect(() => {
    logDebug('mount', 'Dashboard montado, iniciando carga de datos...');
    fetchData();
    
    // Intervalo para actualizar solo el dato actual cada 30 segundos
    const realtimeInterval = setInterval(() => {
      logDebug('interval', 'Actualizando dato actual automáticamente...');
      fetchCurrentData();
    }, 30000);
    
    // Intervalo para actualizar datos históricos cada 5 minutos
    const historyInterval = setInterval(() => {
      logDebug('interval', 'Actualizando datos históricos...');
      fetchHistoricalData();
    }, 300000);
    
    return () => {
      logDebug('unmount', 'Dashboard desmontado, limpiando intervalos');
      clearInterval(realtimeInterval);
      clearInterval(historyInterval);
    };
  }, []);

  const handleRefresh = async () => {
    logDebug('manual', 'Actualización manual iniciada');
    setRefreshing(true);
    await fetchData();
  };

const handleLogout = async () => {
  logDebug('auth', 'Cerrando sesión...');
  
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Notificar al backend que se cierra sesión
      await axios.post(`${serverUrl}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    localStorage.removeItem('token');
    setToken(null);
  }
};

  const handleSelectView = (view) => {
    logDebug('navigation', `Cambiando vista a: ${view}`);
    setSelectedView(view);
    if (isMobile) setDrawerOpen(false);
  };

  const handleDismissAlerts = () => {
    logDebug('alerts', 'Descartando todas las alertas');
    setAlerts([]);
  };

  // Datos para el gráfico de tiempo real
  const realtimeChartData = {
    labels: realtimeHistory.map((_, index) => `-${(realtimeHistory.length - index - 1) * 30}s`),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: realtimeHistory.map((data) => parseFloat(data.temperature) || 0),
        borderColor: '#0288D1',
        backgroundColor: alpha('#0288D1', 0.05),
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Humedad (%)',
        data: realtimeHistory.map((data) => parseFloat(data.humidity) || 0),
        borderColor: '#2E7D32',
        backgroundColor: alpha('#2E7D32', 0.05),
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          boxWidth: 12,
          font: { size: 14 },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#ffffff',
        titleColor: '#2E7D32',
        bodyColor: '#424242',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}${context.dataset.label.includes('Humedad') ? '%' : '°C'}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxRotation: 45, minRotation: 45, maxTicksLimit: 10, font: { size: 12 } },
        title: { display: true, text: 'Tiempo', color: '#263238', font: { size: 14 } },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.03)' },
        ticks: { 
          callback: (value) => `${value}${value <= 100 ? '%' : '°C'}`,
          font: { size: 12 }
        },
        title: { display: true, text: 'Valores', color: '#263238', font: { size: 14 } },
      },
    },
    elements: {
      line: { borderWidth: 2 },
      point: { radius: 3, hoverRadius: 5 },
    },
    animation: { duration: 500, easing: 'linear' },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'background.default', p: 3 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Cargando Dashboard...</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Estado: {debugInfo.connectionStatus}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Intentos: {debugInfo.fetchCount} | Servidor: {serverUrl}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, maxWidth: 400 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default', position: 'relative' }}>
        <Sidebar
          open={isMobile ? drawerOpen : true}
          onClose={handleDrawerToggle}
          onSelectView={handleSelectView}
          selectedView={selectedView}
          userRole={user?.role || 'collaborator'}
        />
        <Box sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
          <Header
            username={user?.username || 'Usuario'}
            role={user?.role || 'collaborator'}
            alerts={alerts}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onLogout={handleLogout}
            isMobile={isMobile}
          />
          {process.env.NODE_ENV === 'development' && (
            <Card sx={{ mb: 2, bgcolor: alpha('#000', 0.02) }}>
              <CardContent sx={{ py: 1 }}>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  🔍 Debug: Conexión {debugInfo.connectionStatus} | 
                  Actualizaciones: {debugInfo.fetchCount} | 
                  APIs: {Object.entries(debugInfo.apiResponses).map(([key, value]) => `${key}=${value}`).join(', ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Última actualización: {debugInfo.lastFetch || 'nunca'} | 
                  Datos tiempo real: {realtimeHistory.length} | 
                  Históricos: {historicalData.length}
                </Typography>
              </CardContent>
            </Card>
          )}
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                <AlertTitle>Error de Conexión</AlertTitle>
                {error}
                <Button 
                  size="small" 
                  onClick={handleRefresh} 
                  sx={{ mt: 1 }}
                  disabled={refreshing}
                >
                  Reintentar
                </Button>
              </Alert>
            </Fade>
          )}
          {alerts.length > 0 && (
            <Box
              sx={{
                position: 'fixed',
                top: 80,
                right: isMobile ? 10 : 20,
                maxWidth: isMobile ? '90%' : 400,
                zIndex: 1200,
              }}
            >
              {alerts.map((alert) => (
                <Fade key={alert.id} in={alert.expiry > Date.now()}>
                  <Alert
                    severity="warning"
                    sx={{
                      mb: 1,
                      bgcolor: alpha(theme.palette.warning.main, 0.9),
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      borderRadius: 1,
                    }}
                  >
                    <AlertTitle>Alerta IoT</AlertTitle>
                    {alert.message} - {new Date(alert.timestamp).toLocaleString()}
                  </Alert>
                </Fade>
              ))}
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={handleDismissAlerts}
                sx={{ mt: 1, width: '100%' }}
              >
                Descartar todas
              </Button>
            </Box>
          )}
          {selectedView === 'dashboard' && (
            <>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Monitoreo IoT de temperatura y humedad para productos secos, panes y galletas. 
                Se registran <strong>automáticamente picos críticos</strong> y alertas durante tu turno activo.
                {currentData ? (
                  <span style={{ color: theme.palette.success.main }}> ✅ Sistema conectado</span>
                ) : (
                  <span style={{ color: theme.palette.error.main }}> ⚠️ Sin datos recientes</span>
                )}
                {user?.role === 'admin' && (
                  <span style={{ color: theme.palette.info.main, marginLeft: '8px' }}>
                    (Datos en tiempo real no se almacenan - Solo picos críticos)
                  </span>
                )}
              </Typography>

                  {user?.role === 'collaborator' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Turno Activo</AlertTitle>
                  Los datos críticos (temperatura &gt; 28°C, humedad &gt; 75%) se registrarán automáticamente bajo tu usuario.
                  Las alertas quedarán asociadas a tu turno actual.
                </Alert>
              )}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<WaterDropIcon />}
                    title="Humedad Actual"
                    value={currentData?.humidity ? Number(currentData.humidity).toFixed(1) : '--'}
                    subtitle={currentData ? 'Datos actualizados' : 'Sin datos'}
                    unit="%"
                    color={currentData?.humidity > 70 ? theme.palette.warning.main : theme.palette.primary.main}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<TimelineIcon />}
                    title="Temperatura Actual"
                    value={currentData?.temperature ? Number(currentData.temperature).toFixed(1) : '--'}
                    subtitle={currentData ? 'Datos actualizados' : 'Sin datos'}
                    unit="°C"
                    color={currentData?.temperature > 70 ? theme.palette.error.main : theme.palette.secondary.main}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<AccessTimeIcon />}
                    title="Última Actualización"
                    value={currentData?.timestamp ? new Date(currentData.timestamp).toLocaleTimeString() : '--:--'}
                    subtitle={currentData?.timestamp ? new Date(currentData.timestamp).toLocaleDateString() : 'Sin conexión'}
                    color={theme.palette.info.main}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<WarningIcon />}
                    title="Estado Sistema"
                    value={debugInfo.connectionStatus === 'connected' ? 'Activo' : 'Error'}
                    subtitle={`${alerts.length} alerta${alerts.length !== 1 ? 's' : ''}`}
                    color={debugInfo.connectionStatus === 'connected' ? theme.palette.success.main : theme.palette.error.main}
                  />
                </Grid>
              </Grid>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" color="text.primary" sx={{ mb: 2 }}>
                    <TimelineIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Monitoreo en Tiempo Real
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Últimas {realtimeHistory.length} lecturas | Actualización cada 30s
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ height: isMobile ? '300px' : '400px', position: 'relative' }}>
                    {realtimeHistory.length > 0 ? (
                      <Line data={realtimeChartData} options={chartOptions} />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                          No hay datos en tiempo real
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                          Verifica que el ESP32 esté enviando datos al servidor
                        </Typography>
                        <Button variant="outlined" onClick={handleRefresh} disabled={refreshing}>
                          {refreshing ? 'Actualizando...' : 'Reintentar'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                  {currentData && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>Última lectura:</Typography>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Typography variant="body1">
                          <strong>Temperatura:</strong> {currentData.temperature}°C
                        </Typography>
                        <Typography variant="body1">
                          <strong>Humedad:</strong> {currentData.humidity}%
                        </Typography>
                        <Typography variant="body1">
                          <strong>Hora:</strong> {new Date(currentData.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h5" color="text.primary" sx={{ mb: 2 }}>
                    Datos Históricos
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    {historicalData.length} registros encontrados
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {historicalData.length > 0 ? (
                    <>
                      <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400, overflow: 'auto' }}>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Fecha y Hora</TableCell>
                              <TableCell align="right">Temperatura (°C)</TableCell>
                              <TableCell align="right">Humedad (%)</TableCell>
                              <TableCell align="center">Usuario</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {historicalData.slice(0, 20).map((row, index) => (
                              <TableRow
                                key={row.id || index}
                                sx={{ 
                                  backgroundColor: index === sliderValue ? alpha('#2E7D32', 0.1) : 'inherit',
                                  '&:hover': { backgroundColor: alpha('#f5f5f5', 0.8) }
                                }}
                              >
                                <TableCell>
                                  {new Date(row.timestamp).toLocaleString()}
                                </TableCell>
                                <TableCell align="right" sx={{ 
                                  color: row.temperature > 70 ? theme.palette.error.main : 'inherit',
                                  fontWeight: row.temperature > 70 ? 'bold' : 'normal'
                                }}>
                                  {row.temperature ? Number(row.temperature).toFixed(1) : 'N/A'}
                                </TableCell>
                                <TableCell align="right" sx={{
                                  color: row.humidity > 70 ? theme.palette.warning.main : 'inherit',
                                  fontWeight: row.humidity > 70 ? 'bold' : 'normal'
                                }}>
                                  {row.humidity ? Number(row.humidity).toFixed(1) : 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="caption" color="text.secondary">
                                    {row.user_id || 'N/A'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {historicalData.length > 1 && (
                        <Box sx={{ mt: 3, px: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Navegar por {historicalData.length} registros históricos
                          </Typography>
                          <Slider
                            value={sliderValue}
                            onChange={(e, newValue) => setSliderValue(newValue)}
                            min={0}
                            max={Math.max(0, historicalData.length - 1)}
                            step={1}
                            marks={historicalData.length <= 10}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `Registro ${value + 1}`}
                            sx={{ maxWidth: '100%' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
                          Gráfico de Tendencias Históricas
                        </Typography>
                        <Box sx={{ height: isMobile ? '300px' : '400px', position: 'relative' }}>
                          {historicalChartData.labels?.length > 0 ? (
                            <Line data={historicalChartData} options={chartOptions} />
                          ) : (
                            <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                              No hay suficientes datos históricos para mostrar el gráfico
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        No hay datos históricos disponibles
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        Los datos históricos aparecerán aquí una vez que el sistema comience a recopilar información
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        startIcon={refreshing ? <CircularProgress size={16} /> : null}
                      >
                        {refreshing ? 'Buscando datos...' : 'Actualizar'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          {selectedView === 'store' && (
            <Box sx={{ p: isMobile ? 1 : 3 }}>
              <Typography variant="h4" color="text.primary" sx={{ mb: 2, fontWeight: 700 }}>
                <StoreIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Vista de Tienda Inteligente
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Monitoreo visual en tiempo real de las condiciones ambientales del minimercado.
                Estado de conexión: 
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1,
                    color: debugInfo.connectionStatus === 'connected' ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 'bold'
                  }}
                >
                  {debugInfo.connectionStatus === 'connected' ? 'CONECTADO' : 'DESCONECTADO'}
                </Typography>
                {user?.role === 'admin' && (
                  <Typography component="span" sx={{ ml: 1, color: theme.palette.info.main }}>
                    (Datos en tiempo real no se almacenan)
                  </Typography>
                )}
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      width: '100%',
                      height: isMobile ? 300 : 400,
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      border: '2px solid #e0e0e0',
                      position: 'relative',
                      overflow: 'hidden',
                      mb: 3,
                      background: 'linear-gradient(45deg, #f5f5f5 0%, #fafafa 100%)',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: '3px solid #bdbdbd',
                        borderRadius: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <Box sx={{
                      position: 'absolute',
                      top: 50,
                      left: 50,
                      width: 120,
                      height: 200,
                      backgroundColor: '#8d6e63',
                      borderRadius: '4px',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '20%',
                        backgroundColor: '#5d4037',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                      },
                    }} />
                    <Box sx={{
                      position: 'absolute',
                      top: 50,
                      right: 50,
                      width: 120,
                      height: 200,
                      backgroundColor: '#8d6e63',
                      borderRadius: '4px',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '20%',
                        backgroundColor: '#5d4037',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                      },
                    }} />
                    <Box sx={{
                      position: 'absolute',
                      bottom: 50,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 160,
                      height: 50,
                      backgroundColor: '#78909c',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                    }}>
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
                        CAJA REGISTRADORA
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 80,
                        left: '30%',
                        width: 50,
                        height: 50,
                        backgroundColor: currentData?.temperature > 70 ? '#D32F2F' : 
                                       currentData?.temperature ? '#ff6d00' : '#9e9e9e',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        boxShadow: currentData?.temperature > 70 ? 
                                  '0 0 20px rgba(211, 47, 47, 0.6)' : 
                                  '0 0 15px rgba(255, 109, 0, 0.5)',
                        animation: currentData?.temperature > 70 ? 'pulse 1s infinite' : 'none',
                        border: '3px solid #fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 25px rgba(255, 109, 0, 0.8)',
                        },
                      }}
                      title={`Temperatura: ${currentData?.temperature ? Number(currentData.temperature).toFixed(1) : '--'}°C | ${currentData?.timestamp ? 'Actualizado: ' + new Date(currentData.timestamp).toLocaleString() : 'Sin datos'}`}
                    >
                      🌡️
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 180,
                        right: '25%',
                        width: 50,
                        height: 50,
                        backgroundColor: currentData?.humidity > 70 ? '#D32F2F' : 
                                       currentData?.humidity ? '#0288d1' : '#9e9e9e',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        boxShadow: currentData?.humidity > 70 ? 
                                  '0 0 20px rgba(211, 47, 47, 0.6)' : 
                                  '0 0 15px rgba(2, 136, 209, 0.5)',
                        animation: currentData?.humidity > 70 ? 'pulse 1s infinite' : 'none',
                        border: '3px solid #fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 25px rgba(2, 136, 209, 0.8)',
                        },
                      }}
                      title={`Humedad: ${currentData?.humidity ? Number(currentData.humidity).toFixed(1) : '--'}% | ${currentData?.timestamp ? 'Actualizado: ' + new Date(currentData.timestamp).toLocaleString() : 'Sin datos'}`}
                    >
                      💧
                    </Box>
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: '40%',
                      width: 80,
                      height: 30,
                      backgroundColor: '#795548',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: 8,
                        width: 6,
                        height: 6,
                        backgroundColor: '#ffd600',
                        borderRadius: '50%',
                      },
                    }}>
                      <Typography variant="caption" sx={{ color: 'white', fontSize: '8px', fontWeight: 'bold' }}>
                        ENTRADA
                      </Typography>
                    </Box>
                    <Box sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: 1.5,
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                        SENSORES IoT
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#ff6d00' }}>
                        🌡️ Temperatura
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#0288d1' }}>
                        💧 Humedad
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#9e9e9e', mt: 0.5 }}>
                        ⚪ Sin conexión
                      </Typography>
                    </Box>
                    <Box sx={{
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      backgroundColor: debugInfo.connectionStatus === 'connected' ? 
                                     'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}>
                      {debugInfo.connectionStatus === 'connected' ? '● ONLINE' : '● OFFLINE'}
                    </Box>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<WaterDropIcon />}
                        title="Humedad Tienda"
                        value={currentData?.humidity ? Number(currentData.humidity).toFixed(1) : '--'}
                        subtitle={currentData?.humidity > 70 ? 'ALERTA: Muy alta' : currentData ? 'Normal' : 'Sin datos'}
                        unit="%"
                        color={currentData?.humidity > 70 ? theme.palette.error.main : theme.palette.primary.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<TimelineIcon />}
                        title="Temperatura Tienda"
                        value={currentData?.temperature ? Number(currentData.temperature).toFixed(1) : '--'}
                        subtitle={currentData?.temperature > 70 ? 'ALERTA: Muy alta' : currentData ? 'Normal' : 'Sin datos'}
                        unit="°C"
                        color={currentData?.temperature > 70 ? theme.palette.error.main : theme.palette.secondary.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<AccessTimeIcon />}
                        title="Última Lectura"
                        value={currentData?.timestamp ? new Date(currentData.timestamp).toLocaleTimeString() : '--:--'}
                        subtitle={currentData?.timestamp ? `${Math.round((Date.now() - new Date(currentData.timestamp).getTime()) / 1000)}s atrás` : 'Sin conexión'}
                        color={theme.palette.info.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<WarningIcon />}
                        title="Estado Sistema"
                        value={alerts.length}
                        subtitle={alerts.length > 0 ? 'Alertas activas' : 'Sistema normal'}
                        color={alerts.length > 0 ? theme.palette.warning.main : theme.palette.success.main}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.08), borderRadius: 2 }}>
                    <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                      🏪 Sistema de Monitoreo IoT - Minimercado
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          • Sensores distribuidos estratégicamente<br />
                          • Monitoreo continuo 24/7<br />
                          • Alertas automáticas en tiempo real<br />
                          • Histórico completo de mediciones
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Estado actual:</strong><br />
                          • Conexión: {debugInfo.connectionStatus}<br />
                          • Actualizaciones: {debugInfo.fetchCount}<br />
                          • Última sync: {debugInfo.lastFetch ? new Date(debugInfo.lastFetch).toLocaleTimeString() : 'nunca'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </Box>
      </Box>
    </ThemeProvider>
  );
}