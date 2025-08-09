import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  useMediaQuery,
  TextField,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import * as LeafletDraw from 'leaflet-draw';
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
} from 'chart.js';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import LogoutIcon from '@mui/icons-material/Logout';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AutoModeIcon from '@mui/icons-material/AutoMode';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Tema consistente con tu código original
const theme = createTheme({
  palette: {
    primary: { main: '#00796b', contrastText: '#ffffff' },
    secondary: { main: '#00bcd4', contrastText: '#ffffff' },
    info: { main: '#1976d2', contrastText: '#ffffff' },
    success: { main: '#4caf50', contrastText: '#ffffff' },
    warning: { main: '#ff9800', contrastText: '#ffffff' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: 1 },
    h5: { fontWeight: 600, letterSpacing: 0.5 },
    h6: { fontWeight: 500 },
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
          transition: 'all 0.3s ease',
          textTransform: 'none',
          borderRadius: '12px',
          padding: '8px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          margin: '16px 0'
        }
      }
    }
  },
});

// Componente para manejar el dibujo en el mapa y áreas regadas
function MapController({ onAreaSelected, wateredArea }) {
  const map = useMap();
  const drawnItems = useRef(new L.FeatureGroup());

  useEffect(() => {
    map.addLayer(drawnItems.current);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        polygon: { allowIntersection: false, showArea: true },
        circle: false,
        marker: false,
        circlemarker: false,
        rectangle: true,
      },
      edit: { featureGroup: drawnItems.current },
    });
    map.addControl(drawControl);

    map.on('draw:created', (e) => {
      const layer = e.layer;
      drawnItems.current.addLayer(layer);
      const latlngs = layer.getLatLngs()[0];
      onAreaSelected(latlngs);
    });

    // Dibujar área regada automáticamente
    if (wateredArea) {
      const bounds = [
        [wateredArea[0], wateredArea[1]], // [lat1, lng1]
        [wateredArea[2], wateredArea[3]], // [lat2, lng2]
      ];
      L.rectangle(bounds, { color: '#00bcd4', weight: 2 }).addTo(drawnItems.current);
    }

    return () => {
      map.off('draw:created');
      map.removeControl(drawControl);
      map.removeLayer(drawnItems.current);
    };
  }, [map, onAreaSelected, wateredArea]);

  return null;
}

export default function Dashboard({ setToken }) {
  const [user, setUser] = useState(null);
  const [iotData, setIotData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaSelected, setAreaSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const mapRef = useRef(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calcular estadísticas
  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      return { mean: null, stdDev: null, median: null, range: null };
    }
    const humidities = data.map((d) => d.humidity).filter((h) => h !== null && h !== undefined);
    if (humidities.length === 0) {
      return { mean: null, stdDev: null, median: null, range: null };
    }

    // Media
    const mean = humidities.reduce((sum, val) => sum + val, 0) / humidities.length;

    // Desviación estándar
    const variance = humidities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / humidities.length;
    const stdDev = Math.sqrt(variance);

    // Mediana
    const sorted = [...humidities].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    // Rango
    const range = Math.max(...humidities) - Math.min(...humidities);

    return { mean, stdDev, median, range };
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [userResponse, iotResponse, historyResponse] = await Promise.all([
        axios.get('http://localhost:5000/user', config),
        axios.get('http://localhost:5000/iot-data/latest', config),
        axios.get('http://localhost:5000/iot-data/history', {
          ...config,
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      ]);

      setUser(userResponse.data);
      setIotData(iotResponse.data);
      setHistoryData(historyResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleShowLocation = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const map = mapRef.current;
          map.setView([latitude, longitude], 15);
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup('Tu ubicación actual')
            .openPopup();
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso.');
        }
      );
    }
  };

  const handleAreaSelected = (latlngs) => {
    setAreaSelected(latlngs);
    console.log('Área seleccionada:', latlngs);
  };

  const stats = calculateStats(historyData);
  const chartData = {
    labels: historyData.map((data) => new Date(data.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Humedad del suelo (%)',
        data: historyData.map((data) => data.humidity),
        borderColor: '#00796b',
        backgroundColor: alpha('#00796b', 0.1),
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#00796b',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Media',
        data: historyData.map(() => stats.mean),
        borderColor: '#ff9800',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Desviación Estándar (+/-)',
        data: historyData.map(() => stats.mean + stats.stdDev),
        borderColor: '#f44336',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Desviación Estándar (-)',
        data: historyData.map(() => stats.mean - stats.stdDev),
        borderColor: '#f44336',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
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
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#ffffff',
        titleColor: '#00796b',
        bodyColor: '#424242',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        title: { display: true, text: 'Fecha y Hora', color: '#616161' },
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Humedad (%)', color: '#616161' },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            minHeight: '100vh',
            backgroundColor: 'background.default',
            p: isMobile ? 2 : 4,
          }}
        >
          <Box
            sx={{
              maxWidth: '1400px',
              mx: 'auto',
              transform: isMobile ? 'none' : 'scale(0.95)',
              transformOrigin: 'top center',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: isMobile ? 2 : 4,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                  Hola, {user?.username || 'Usuario'}!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Panel de control del sistema de riego
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { backgroundColor: 'primary.dark' },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={() => {
                    localStorage.removeItem('token');
                    setToken(null);
                  }}
                  size={isMobile ? 'small' : 'medium'}
                >
                  {isMobile ? 'Salir' : 'Cerrar Sesión'}
                </Button>
              </Box>
            </Box>

            {/* Selectores de fechas */}
            <Box sx={{ display: 'flex', gap: 2, mb: isMobile ? 2 : 3, flexWrap: 'wrap' }}>
              <DatePicker
                label="Fecha de inicio"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={{ minWidth: isMobile ? '100%' : '200px' }}
                  />
                )}
              />
              <DatePicker
                label="Fecha de fin"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    sx={{ minWidth: isMobile ? '100%' : '200px' }}
                  />
                )}
              />
            </Box>

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Mapa */}
              <Grid item xs={12} lg={8}>
                <Card sx={{ height: isMobile ? '350px' : '500px' }}>
                  <CardContent
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      p: isMobile ? 1 : 2,
                      '&:last-child': { pb: isMobile ? 1 : 2 },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h5" color="text.primary">
                        <LocationOnIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Mapa de Cultivo
                      </Typography>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        startIcon={<LocationOnIcon />}
                        onClick={handleShowLocation}
                      >
                        {isMobile ? 'Ubicación' : 'Mi Ubicación'}
                      </Button>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        flex: 1,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <MapContainer
                        center={[-34.6037, -58.3816]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        whenCreated={(map) => (mapRef.current = map)}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <MapController
                          onAreaSelected={handleAreaSelected}
                          wateredArea={iotData?.pump_state && iotData?.coordinates ? iotData.coordinates : null}
                        />
                      </MapContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Estado del Sistema */}
              <Grid item xs={12} lg={4}>
                <Grid container spacing={isMobile ? 2 : 3} sx={{ height: '100%' }}>
                  <Grid item xs={12}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="h5" color="text.primary">
                            <SettingsIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Estado del Sistema
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {iotData?.timestamp ? new Date(iotData.timestamp).toLocaleString() : 'N/A'}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} lg={12}>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                backgroundColor: alpha('#00796b', 0.08),
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <WaterDropIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1">Humedad</Typography>
                              </Box>
                              <Typography variant="h4" color="primary">
                                {iotData?.humidity ?? '--'}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Nivel actual del suelo
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={6} lg={12}>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                backgroundColor: iotData?.pump_state
                                  ? alpha('#4caf50', 0.08)
                                  : alpha('#f44336', 0.08),
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PowerSettingsNewIcon
                                  sx={{
                                    mr: 1,
                                    color: iotData?.pump_state ? 'success.main' : 'error.main',
                                  }}
                                />
                                <Typography variant="subtitle1">Bomba de Agua</Typography>
                              </Box>
                              <Typography
                                variant="h4"
                                color={iotData?.pump_state ? 'success.main' : 'error.main'}
                              >
                                {iotData?.pump_state ? 'ACTIVA' : 'INACTIVA'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Estado actual
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12}>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                backgroundColor: alpha('#00bcd4', 0.08),
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AutoModeIcon color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1">Modo de Operación</Typography>
                              </Box>
                              <Typography variant="h4" color="secondary">
                                {iotData?.mode ? 'AUTOMÁTICO' : 'MANUAL'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Configuración actual
                              </Typography>
                            </Paper>
                          </Grid>
                          {/* Estadísticas */}
                          <Grid item xs={12}>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                backgroundColor: alpha('#1976d2', 0.08),
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <SettingsIcon color="info" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1">Estadísticas (Rango de fechas)</Typography>
                              </Box>
                              <Typography variant="body1" sx={{ mb: 0.5 }}>
                                <strong>Media:</strong> {stats.mean ? stats.mean.toFixed(2) : '--'} %
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 0.5 }}>
                                <strong>Desviación Estándar:</strong> {stats.stdDev ? stats.stdDev.toFixed(2) : '--'} %
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 0.5 }}>
                                <strong>Mediana:</strong> {stats.median ? stats.median.toFixed(2) : '--'} %
                              </Typography>
                              <Typography variant="body1">
                                <strong>Rango:</strong> {stats.range ? stats.range.toFixed(2) : '--'} %
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Gráfico de Humedad */}
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: isMobile ? 1 : 3 }}>
                    <Typography variant="h5" gutterBottom>
                      Histórico de Humedad
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                      sx={{
                        height: isMobile ? '250px' : '350px',
                        position: 'relative',
                      }}
                    >
                      <Line data={chartData} options={chartOptions} redraw={refreshing} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}