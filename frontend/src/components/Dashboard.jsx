import React, { useState, useEffect, useRef } from 'react';
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

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Tema profesional
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

// Componente StatusCard
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
  const [iotData, setIotData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [historicalChartData, setHistoricalChartData] = useState({ labels: [], datasets: [] });
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const audioRef = useRef(new Audio('https://www.soundjay.com/buttons/beep-01a.mp3'));

  // Calcular estadísticas
  const calculateStats = (data) => {
    if (!data || data.length === 0) return {};
    const temperatures = data.map(d => d.temperature).filter(t => t !== null && t !== undefined);
    const humidities = data.map(d => d.humidity).filter(h => h !== null && h !== undefined);
    if (temperatures.length === 0 || humidities.length === 0) return {};

    const tempMean = temperatures.reduce((sum, val) => sum + val, 0) / temperatures.length;
    const humMean = humidities.reduce((sum, val) => sum + val, 0) / humidities.length;
    const tempVariance = temperatures.reduce((sum, val) => sum + Math.pow(val - tempMean, 2), 0) / temperatures.length;
    const humVariance = humidities.reduce((sum, val) => sum + Math.pow(val - humMean, 2), 0) / humidities.length;
    const tempStdDev = Math.sqrt(tempVariance);
    const humStdDev = Math.sqrt(humVariance);
    const tempSorted = [...temperatures].sort((a, b) => a - b);
    const humSorted = [...humidities].sort((a, b) => a - b);
    const tempMid = Math.floor(tempSorted.length / 2);
    const humMid = Math.floor(humSorted.length / 2);
    const tempMedian = tempSorted.length % 2 === 0 ? (tempSorted[tempMid - 1] + tempSorted[tempMid]) / 2 : tempSorted[tempMid];
    const humMedian = humSorted.length % 2 === 0 ? (humSorted[humMid - 1] + humSorted[humMid]) / 2 : humSorted[humMid];
    const tempRange = Math.max(...temperatures) - Math.min(...temperatures);
    const humRange = Math.max(...humidities) - Math.min(...humidities);

    return {
      tempMean, tempStdDev, tempMedian, tempRange, tempMin: Math.min(...temperatures), tempMax: Math.max(...temperatures),
      humMean, humStdDev, humMedian, humRange, humMin: Math.min(...humidities), humMax: Math.max(...humidities),
    };
  };

  // Obtener datos
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const serverUrl = 'http://192.168.18.31:5000';

      const [userResponse, iotResponse, historyResponse, alertsResponse] = await Promise.all([
        axios.get(`${serverUrl}/user`, config).catch(err => {
          console.error('Error al obtener usuario:', err.response?.status, err.response?.data || err.message);
          return { data: null };
        }),
        axios.get(`${serverUrl}/iot-data/latest`, config).catch(err => {
          console.error('Error al obtener datos IoT:', err.response?.status, err.response?.data || err.message);
          return { data: null };
        }),
        axios.get(`${serverUrl}/iot-data/history`, {
          ...config,
          params: { startDate: dayjs().subtract(1, 'day').toISOString(), endDate: dayjs().toISOString() },
        }).catch(err => {
          console.error('Error al obtener historial:', err.response?.status, err.response?.data || err.message);
          return { data: [] };
        }),
        axios.get(`${serverUrl}/iot-alerts`, config).catch(err => {
          console.error('Error al obtener alertas:', err.response?.status, err.response?.data || err.message);
          return { data: { alerts: [], data: null } };
        }),
      ]);

      if (userResponse.data && typeof userResponse.data === 'object' && userResponse.data.username) {
        setUser(userResponse.data);
      } else {
        setUser({ username: 'Usuario' });
        setError('No se pudieron cargar los datos del usuario. Verifica tu sesión.');
      }

      if (iotResponse.data && typeof iotResponse.data === 'object') {
        setIotData(iotResponse.data);
      } else {
        setIotData(null);
      }

      const newData = historyResponse.data || [];
      console.log('Datos históricos recibidos:', newData);
      setHistoryData(prev => [...prev, ...newData].slice(-30));
      setHistoricalData(newData);

      // Filtrar alertas duplicadas consecutivas y limitar a 3
      const newAlerts = alertsResponse.data.alerts || [];
      const filteredAlerts = [];
      let lastMessage = '';
      for (const alert of newAlerts.slice(0, 3)) {
        if (alert.message !== lastMessage) {
          filteredAlerts.push({ ...alert, id: `${alert.timestamp}-${alert.message}`, expiry: Date.now() + 30000 });
          lastMessage = alert.message;
        }
      }
      setAlerts(filteredAlerts);

      if (filteredAlerts.length > 0) {
        audioRef.current.play().catch(err => console.error('Error al reproducir sonido:', err));
      }
    } catch (error) {
      console.error('Error general al cargar datos:', error.response?.status, error.response?.data || error.message);
      setError('Error al cargar los datos. Verifica la conexión con el servidor.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Buscar datos históricos (para selector de fechas)
  const fetchHistoricalData = async (startDate, endDate) => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        setRefreshing(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const serverUrl = 'http://192.168.18.31:5000';

      const response = await axios.get(`${serverUrl}/iot-data/history`, {
        ...config,
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      });
      console.log('Respuesta de fetchHistoricalData:', response.data);
      setHistoricalData(response.data || []);
      setSliderValue(0);
    } catch (error) {
      console.error('Error al obtener datos históricos:', error.response?.data || error.message);
      setError('No se pudieron cargar los datos históricos. Verifica el rango de fechas o la conexión.');
    } finally {
      setRefreshing(false);
    }
  };

  // Expirar alertas automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.expiry > Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar historicalChartData
  useEffect(() => {
    if (historicalData.length > 0) {
      const chartData = {
        labels: historicalData.map((data) => new Date(data.timestamp).toLocaleString()),
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: historicalData.map((data) => data.temperature || 0),
            borderColor: '#0288D1',
            backgroundColor: alpha('#0288D1', 0.05),
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Humedad (%)',
            data: historicalData.map((data) => data.humidity || 0),
            borderColor: '#2E7D32',
            backgroundColor: alpha('#2E7D32', 0.05),
            tension: 0.3,
            fill: true,
          },
        ],
      };
      setHistoricalChartData(chartData);
    } else {
      setHistoricalChartData({ labels: [], datasets: [] });
    }
    console.log('historicalData:', historicalData);
    console.log('historicalChartData:', historicalChartData);
  }, [historicalData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleSelectView = (view) => {
    setSelectedView(view);
    if (isMobile) setDrawerOpen(false);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDismissAlerts = () => {
    setAlerts([]);
  };

  const stats = calculateStats(historyData);
  const chartData = {
    labels: historyData.map((_, index) => `-${(historyData.length - index - 1) * 60}s`),
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: historyData.map((data) => data.temperature || 0),
        borderColor: '#0288D1',
        backgroundColor: alpha('#0288D1', 0.05),
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Humedad (%)',
        data: historyData.map((data) => data.humidity || 0),
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
          font: {
            size: 14,
          },
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
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10,
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          text: 'Fecha y Hora',
          color: '#263238',
          font: {
            size: 14,
          },
        },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.03)' },
        ticks: {
          callback: (value) => `${value}${value <= 100 ? '%' : '°C'}`,
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          text: 'Temperatura (°C) / Humedad (%)',
          color: '#263238',
          font: {
            size: 14,
          },
        },
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'background.default' }}>
        <CircularProgress size={60} thickness={4} />
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
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
        />
        <Box sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
          <Header
            username={user?.username || 'Usuario'}
            alerts={alerts}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onLogout={handleLogout}
            isMobile={isMobile}
          />
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 2, mx: isMobile ? 0 : 2 }}>
                {error}
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
                    <AlertTitle>Alerta</AlertTitle>
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
                Este panel monitorea la temperatura y humedad del minimercado para garantizar la calidad de los abarrotes. Usa los gráficos y datos para analizar tendencias y recibir alertas.
              </Typography>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<WaterDropIcon />}
                    title="Humedad Ambiental"
                    value={iotData?.humidity ? Number(iotData.humidity).toFixed(1) : '--'}
                    subtitle="Nivel actual"
                    unit="%"
                    color={theme.palette.primary.main}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<TimelineIcon />}
                    title="Temperatura Ambiental"
                    value={iotData?.temperature ? Number(iotData.temperature).toFixed(1) : '--'}
                    subtitle="Nivel actual"
                    unit="°C"
                    color={theme.palette.secondary.main}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<AccessTimeIcon />}
                    title="Última Actualización"
                    value={iotData?.timestamp ? new Date(iotData.timestamp).toLocaleTimeString() : '--:--'}
                    subtitle={iotData?.timestamp ? new Date(iotData.timestamp).toLocaleDateString() : 'N/A'}
                    color={theme.palette.info.main}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatusCard
                    icon={<WarningIcon />}
                    title="Alertas"
                    value={alerts.length}
                    subtitle={alerts.length > 0 ? 'Activas' : 'Sin alertas'}
                    color={alerts.length > 0 ? theme.palette.warning.main : theme.palette.success.main}
                  />
                </Grid>
              </Grid>
              <Card sx={{ mb: 3, minHeight: isMobile ? '500px' : '700px' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="text.primary">
                      <TimelineIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Datos Históricos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {historicalData.length} registros
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={3} sx={{ flexDirection: 'column' }}>
                    <Grid item xs={12}>
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
                            {historicalData.map((row, index) => (
                              <TableRow
                                key={row.id}
                                sx={{ backgroundColor: index === sliderValue ? alpha('#2E7D32', 0.1) : 'inherit' }}
                              >
                                <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                                <TableCell>{row.temperature ? Number(row.temperature).toFixed(1) : 'N/A'}</TableCell>
                                <TableCell>{row.humidity ? Number(row.humidity).toFixed(1) : 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Box sx={{ mt: 2, px: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Navegar registros
                        </Typography>
                        <Slider
                          value={sliderValue}
                          onChange={(e, newValue) => setSliderValue(newValue)}
                          min={0}
                          max={historicalData.length - 1}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `Registro ${value + 1}`}
                          sx={{ maxWidth: '100%' }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          height: isMobile ? '400px' : '600px',
                          width: '100%',
                          position: 'relative',
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        {historicalChartData.labels?.length > 0 ? (
                          <Line data={historicalChartData} options={chartOptions} />
                        ) : (
                          <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                            No hay datos históricos para mostrar
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="text.primary">
                      <TimelineIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Humedad y Temperatura en Tiempo Real
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {historyData.length} registros
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ height: isMobile ? '400px' : '600px', position: 'relative', border: '1px solid #e0e0e0' }}>
                    {chartData.labels?.length > 0 ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                        No hay datos en tiempo real para mostrar
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
          {selectedView === 'store' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" color="text.primary" sx={{ mb: 2, fontWeight: 700 }}>
                <StoreIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Vista de Tienda Inteligente
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Monitoreo en tiempo real de las condiciones ambientales de la tienda mediante sensores IoT.
              </Typography>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      width: '100%',
                      height: 400,
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
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 50,
                        left: 50,
                        width: 120,
                        height: 250,
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
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 50,
                        right: 50,
                        width: 120,
                        height: 250,
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
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 50,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 200,
                        height: 60,
                        backgroundColor: '#78909c',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                        CAJA REGISTRADORA
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 100,
                        left: 200,
                        width: 40,
                        height: 40,
                        backgroundColor: iotData?.temperature > 70 ? '#D32F2F' : '#ff6d00',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        boxShadow: '0 0 15px rgba(255, 109, 0, 0.5)',
                        animation: iotData?.temperature > 70 ? 'pulse 1s infinite' : 'none',
                        border: '2px solid #ff9800',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 20px rgba(255, 109, 0, 0.8)',
                        },
                      }}
                      title={`Temperatura: ${iotData?.temperature ? Number(iotData.temperature).toFixed(1) : '--'}°C`}
                    >
                      🌡️
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 180,
                        right: 150,
                        width: 40,
                        height: 40,
                        backgroundColor: iotData?.humidity > 70 ? '#D32F2F' : '#0288d1',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        boxShadow: '0 0 15px rgba(2, 136, 209, 0.5)',
                        animation: iotData?.humidity > 70 ? 'pulse 1s infinite' : 'none',
                        border: '2px solid #03a9f4',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 20px rgba(2, 136, 209, 0.8)',
                        },
                      }}
                      title={`Humedad: ${iotData?.humidity ? Number(iotData.humidity).toFixed(1) : '--'}%`}
                    >
                      💧
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '30%',
                        width: 80,
                        height: 40,
                        backgroundColor: '#795548',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          right: 10,
                          width: 8,
                          height: 8,
                          backgroundColor: '#ffd600',
                          borderRadius: '50%',
                        },
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>
                        ENTRADA
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 30,
                        left: '25%',
                        width: 60,
                        height: 40,
                        backgroundColor: '#e3f2fd',
                        border: '2px solid #90caf9',
                        borderRadius: '4px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 30,
                        right: '25%',
                        width: 60,
                        height: 40,
                        backgroundColor: '#e3f2fd',
                        border: '2px solid #90caf9',
                        borderRadius: '4px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: 1,
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        🟠 Sensor Temperatura
                      </Typography>
                      <br />
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        🔵 Sensor Humedad
                      </Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<WaterDropIcon />}
                        title="Humedad Tienda"
                        value={iotData?.humidity ? Number(iotData.humidity).toFixed(1) : '--'}
                        subtitle="Nivel actual"
                        unit="%"
                        color={theme.palette.primary.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<TimelineIcon />}
                        title="Temperatura Tienda"
                        value={iotData?.temperature ? Number(iotData.temperature).toFixed(1) : '--'}
                        subtitle="Nivel actual"
                        unit="°C"
                        color={theme.palette.secondary.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<AccessTimeIcon />}
                        title="Última Actualización"
                        value={iotData?.timestamp ? new Date(iotData.timestamp).toLocaleTimeString() : '--:--'}
                        subtitle={iotData?.timestamp ? new Date(iotData.timestamp).toLocaleDateString() : 'N/A'}
                        color={theme.palette.info.main}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <StatusCard
                        icon={<WarningIcon />}
                        title="Estado General"
                        value={alerts.length > 0 ? 'Alerta' : 'Óptimo'}
                        subtitle={alerts.length > 0 ? 'Revisar alertas' : 'Sistemas funcionando'}
                        color={alerts.length > 0 ? theme.palette.warning.main : theme.palette.success.main}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                      📊 Información del Sistema IoT
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Sensores distribuidos estratégicamente en la tienda
                      <br />
                      • Monitoreo continuo 24/7
                      <br />
                      • Alertas automáticas en tiempo real
                      <br />
                      • Histórico de datos accesible
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
