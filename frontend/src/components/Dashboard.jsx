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
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
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
import LogoutIcon from '@mui/icons-material/Logout';
import LocationOnIcon from '@mui/icons-material/LocationOn';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Tema consistente con Login.jsx y Register.jsx
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
  },
});

// Componente para manejar el dibujo en el mapa
function MapController({ onAreaSelected }) {
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

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.current.addLayer(layer);
      const latlngs = layer.getLatLngs()[0];
      onAreaSelected(latlngs);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems.current);
    };
  }, [map, onAreaSelected]);

  return null;
}

export default function Dashboard({ setToken }) {
  const [user, setUser] = useState(null);
  const [iotData, setIotData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaSelected, setAreaSelected] = useState(null);

  // Obtener datos del usuario y IoT
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Obtener datos del usuario
        const userResponse = await axios.get('http://localhost:5000/user', config);
        setUser(userResponse.data);

        // Obtener datos IoT en tiempo real
        const iotResponse = await axios.get('http://localhost:5000/iot-data/latest', config);
        setIotData(iotResponse.data);

        // Obtener datos históricos
        const historyResponse = await axios.get('http://localhost:5000/iot-data/history', config);
        setHistoryData(historyResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Actualizar datos en tiempo real cada 5 segundos
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manejar geolocalización
  const handleShowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const map = L.map('map').setView([latitude, longitude], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }).addTo(map);
          L.marker([latitude, longitude]).addTo(map).bindPopup('Tu ubicación').openPopup();
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso.');
        }
      );
    } else {
      alert('Geolocalización no soportada por tu navegador.');
    }
  };

  // Manejar selección de área
  const handleAreaSelected = (latlngs) => {
    setAreaSelected(latlngs);
    console.log('Área seleccionada:', latlngs);
  };

  // Datos para el gráfico de humedad
  const chartData = {
    labels: historyData.map((data) => new Date(data.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Humedad (%)',
        data: historyData.map((data) => data.humidity),
        borderColor: '#00796b',
        backgroundColor: 'rgba(0, 121, 107, 0.2)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: { title: { display: true, text: 'Hora' } },
      y: { title: { display: true, text: 'Humedad (%)' }, min: 0, max: 100 },
    },
    plugins: { legend: { position: 'top' } },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" color="primary.main">
              Bienvenido, {user?.username || 'Usuario'}
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => {
                localStorage.removeItem('token');
                setToken(null);
              }}
            >
              Cerrar Sesión
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Mapa */}
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '500px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Mapa de Ubicación
                  </Typography>
                  <MapContainer
                    center={[-34.6037, -58.3816]} // Coordenadas por defecto (Buenos Aires)
                    zoom={13}
                    style={{ height: '400px', width: '100%' }}
                    id="map"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapController onAreaSelected={handleAreaSelected} />
                  </MapContainer>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<LocationOnIcon />}
                    onClick={handleShowLocation}
                    sx={{ mt: 2 }}
                  >
                    Ver mi ubicación
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Datos en tiempo real */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estado del Sistema IoT
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    <strong>Humedad:</strong> {iotData?.humidity ?? 'N/A'} %
                  </Typography>
                  <Typography variant="body1">
                    <strong>Estado de la bomba:</strong> {iotData?.pump_state ? 'Encendida' : 'Apagada'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Modo:</strong> {iotData?.mode ? 'Automático' : 'Manual'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Última actualización: {iotData?.timestamp ? new Date(iotData.timestamp).toLocaleString() : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico histórico */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estadísticas de Humedad
                  </Typography>
                  <Line data={chartData} options={chartOptions} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}