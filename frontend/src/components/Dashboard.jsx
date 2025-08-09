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
  Stack,
  Chip,
  Avatar,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider
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
  Filler
} from 'chart.js';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import LogoutIcon from '@mui/icons-material/Logout';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';

// Registrar los componentes de Chart.js, incluyendo Filler
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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          },
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          },
          border: '1px solid rgba(0,0,0,0.05)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          border: '1px solid rgba(0,0,0,0.05)'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0,0,0,0.08)',
          margin: '12px 0'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          }
        }
      }
    },
    MuiInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 8px'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          padding: '12px',
          '&:first-of-type': {
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px'
          },
          '&:last-of-type': {
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px'
          }
        },
        head: {
          backgroundColor: alpha('#2E7D32', 0.08),
          color: '#263238',
          fontWeight: 600
        },
        body: {
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: alpha('#f5f5f5', 0.5)
          }
        }
      }
    }
  },
});

// Estilos reutilizables
const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 1
};

const statCardStyle = {
  p: 2,
  borderRadius: '10px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
};

// Ícono azul personalizado para el marcador de ubicación
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Componente para manejar el dibujo en el mapa
function MapController({ onAreaSelected, wateredArea }) {
  const map = useMap();
  const drawnItems = useRef(new L.FeatureGroup());

  useEffect(() => {
    console.log('[MapController] Inicializando mapa y controles de dibujo');
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
      console.log('[MapController] Área dibujada:', e.layer.getLatLngs());
      const layer = e.layer;
      drawnItems.current.addLayer(layer);
      const latlngs = layer.getLatLngs()[0];
      onAreaSelected(latlngs);
    });

    if (wateredArea) {
      console.log('[MapController] Añadiendo área regada:', wateredArea);
      const bounds = [
        [wateredArea[0], wateredArea[1]],
        [wateredArea[2], wateredArea[3]],
      ];
      L.rectangle(bounds, { 
        color: '#0288D1', 
        weight: 2,
        fillOpacity: 0.2,
        fillColor: '#0288D1'
      }).addTo(drawnItems.current);
    }

    return () => {
      console.log('[MapController] Limpiando mapa y controles');
      map.off('draw:created');
      map.removeControl(drawControl);
      map.removeLayer(drawnItems.current);
    };
  }, [map, onAreaSelected, wateredArea]);

  return null;
}

// Componente de tarjeta de estado reutilizable
const StatusCard = ({ icon, title, value, subtitle, color, unit }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Avatar sx={{ 
          bgcolor: alpha(color || theme.palette.primary.main, 0.1), 
          color: color || theme.palette.primary.main,
          mr: 2,
          width: 40,
          height: 40
        }}>
          {icon}
        </Avatar>
        <Typography variant="h6" color="text.primary">{title}</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h3" sx={{ 
          color: color || theme.palette.primary.main,
          lineHeight: 1,
          textAlign: 'center'
        }}>
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
  const [sliderValue, setSliderValue] = useState(0);
  const [latestImage, setLatestImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [areaSelected, setAreaSelected] = useState(null);
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Iniciar la cámara
  const startCamera = async () => {
    try {
      console.log('[startCamera] Solicitando acceso a la cámara');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[startCamera] Cámara iniciada con éxito');
      }
    } catch (error) {
      console.error('[startCamera] Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Asegúrate de permitir el acceso.');
    }
  };

  // Detener la cámara
  const stopCamera = () => {
    if (cameraStream) {
      console.log('[stopCamera] Deteniendo cámara');
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Capturar imagen desde la cámara
  const handleCaptureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[handleCaptureImage] Video o canvas no disponibles');
      return;
    }

    setCapturing(true);
    console.log('[handleCaptureImage] Capturando imagen');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('[handleCaptureImage] Imagen capturada, enviando al backend');
    sendImageToBackend(imageData, 'camera');
  };

  // Subir imagen desde archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error('[handleFileUpload] No se seleccionó ningún archivo');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      console.error('[handleFileUpload] Formato de archivo no permitido:', file.type);
      alert('Solo se permiten imágenes JPEG o PNG');
      return;
    }

    setCapturing(true);
    console.log('[handleFileUpload] Leyendo archivo:', file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      console.log('[handleFileUpload] Archivo leído, enviando al backend');
      sendImageToBackend(imageData, 'file');
    };
    reader.onerror = () => {
      console.error('[handleFileUpload] Error al leer el archivo');
      alert('No se pudo leer la imagen');
      setCapturing(false);
    };
    reader.readAsDataURL(file);
  };

  // Enviar imagen al backend
  const sendImageToBackend = async (imageData, source) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[sendImageToBackend] No se encontró el token');
        throw new Error('No token found');
      }

      console.log('[sendImageToBackend] Enviando imagen, origen:', source);
      if (source === 'camera') {
        await axios.post('http://localhost:5000/capture-image', { image: imageData }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const formData = new FormData();
        const blob = dataURLtoBlob(imageData);
        formData.append('image', blob, `image.${imageData.includes('image/png') ? 'png' : 'jpg'}`);
        await axios.post('http://localhost:5000/capture-image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      console.log('[sendImageToBackend] Imagen enviada con éxito');
      await fetchData(); // Refrescar imágenes
    } catch (error) {
      console.error('[sendImageToBackend] Error al enviar imagen:', error);
      alert('No se pudo guardar la imagen');
    } finally {
      setCapturing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Convertir dataURL a Blob
  const dataURLtoBlob = (dataURL) => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mime });
  };

  // Calcular estadísticas
  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      console.log('[calculateStats] No hay datos para calcular estadísticas');
      return {};
    }
    
    const humidities = data.map(d => d.humidity).filter(h => h !== null && h !== undefined);
    if (humidities.length === 0) {
      console.log('[calculateStats] No hay valores de humedad válidos');
      return {};
    }
    
    const mean = humidities.reduce((sum, val) => sum + val, 0) / humidities.length;
    const variance = humidities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / humidities.length;
    const stdDev = Math.sqrt(variance);
    const sorted = [...humidities].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const range = Math.max(...humidities) - Math.min(...humidities);
    
    console.log('[calculateStats] Estadísticas calculadas:', { mean, stdDev, median, range, min: Math.min(...humidities), max: Math.max(...humidities) });
    return { mean, stdDev, median, range, min: Math.min(...humidities), max: Math.max(...humidities) };
  };

  // Obtener datos
  const fetchData = async () => {
    try {
      setRefreshing(true);
      console.log('[fetchData] Iniciando carga de datos');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[fetchData] No se encontró el token');
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }
      console.log('[fetchData] Token encontrado:', token);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      console.log('[fetchData] Enviando solicitudes al backend');
      const [userResponse, iotResponse, historyResponse, imageResponse] = await Promise.all([
        axios.get('http://localhost:5000/user', config).catch(err => {
          console.error('[fetchData] Error en /user:', err.response?.status, err.message);
          return { data: null };
        }),
        axios.get('http://localhost:5000/iot-data/latest', config).catch(err => {
          console.error('[fetchData] Error en /iot-data/latest:', err.response?.status, err.message);
          return { data: null };
        }),
        axios.get('http://localhost:5000/iot-data/history', {
          ...config,
          params: {
            startDate: dayjs().subtract(60, 'second').toISOString(),
            endDate: dayjs().toISOString(),
          },
        }).catch(err => {
          console.error('[fetchData] Error en /iot-data/history:', err.response?.status, err.message);
          return { data: [] };
        }),
        axios.get('http://localhost:5000/images', config).catch(err => {
          console.error('[fetchData] Error en /images:', err.response?.status, err.message);
          return { data: [] };
        }),
      ]);

      console.log('[fetchData] Respuestas recibidas:', {
        user: userResponse.data,
        iot: iotResponse.data,
        history: historyResponse.data,
        images: imageResponse.data
      });

      if (!userResponse.data) {
        console.warn('[fetchData] Datos de usuario no disponibles');
        setError('No se pudieron cargar los datos del usuario. Verifica tu sesión.');
      } else {
        setUser(userResponse.data);
      }

      setIotData(iotResponse.data || null);
      setHistoryData(prev => {
        const newData = [...prev, ...(historyResponse.data || [])].slice(-30);
        console.log('[fetchData] Datos históricos actualizados:', newData);
        return newData;
      });
      setLatestImage(imageResponse.data[0] || null);
    } catch (error) {
      console.error('[fetchData] Error general al cargar datos:', error);
      setError('Error al cargar los datos. Verifica la conexión con el servidor.');
    } finally {
      setRefreshing(false);
      setLoading(false);
      console.log('[fetchData] Carga completada');
    }
  };

  // Buscar datos históricos
  const fetchHistoricalData = async () => {
    try {
      setRefreshing(true);
      console.log('[fetchHistoricalData] Buscando datos históricos, rango:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[fetchHistoricalData] No se encontró el token');
        setError('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
        setRefreshing(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      console.log('[fetchHistoricalData] Enviando solicitud a /iot-data/history');
      const response = await axios.get('http://localhost:5000/iot-data/history', {
        ...config,
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      console.log('[fetchHistoricalData] Datos históricos obtenidos:', response.data);
      setHistoricalData(response.data || []);
      setSliderValue(0);
    } catch (error) {
      console.error('[fetchHistoricalData] Error al obtener datos históricos:', error);
      setError('No se pudieron cargar los datos históricos. Verifica el rango de fechas o la conexión.');
    } finally {
      setRefreshing(false);
      console.log('[fetchHistoricalData] Búsqueda completada');
    }
  };

  useEffect(() => {
    console.log('[useEffect] Iniciando carga inicial de datos');
    fetchData();
    const interval = setInterval(() => {
      console.log('[useEffect] Ejecutando refresco periódico');
      fetchData();
    }, 2000);
    return () => {
      console.log('[useEffect] Limpiando intervalo');
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    console.log('[handleRefresh] Iniciando refresco manual');
    setRefreshing(true);
    fetchData();
  };

  const handleShowLocation = () => {
    console.log('[handleShowLocation] Botón "Mi Ubicación" clicado');
    if (!navigator.geolocation) {
      console.error('[handleShowLocation] Geolocalización no soportada por el navegador');
      alert('La geolocalización no está soportada por tu navegador.');
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.error('[handleShowLocation] Geolocalización requiere HTTPS (no localhost)');
      alert('La geolocalización requiere HTTPS. Usa localhost o despliega en un servidor seguro.');
      return;
    }

    if (!mapRef.current) {
      console.error('[handleShowLocation] Mapa no inicializado (mapRef.current es null)');
      alert('El mapa no está inicializado correctamente.');
      return;
    }

    console.log('[handleShowLocation] Solicitando ubicación actual');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('[handleShowLocation] Ubicación obtenida:', { latitude, longitude });

        const map = mapRef.current;
        map.setView([latitude, longitude], 15);
        console.log('[handleShowLocation] Mapa centrado en:', [latitude, longitude]);

        // Añadir marcador azul
        L.marker([latitude, longitude], { icon: blueIcon })
          .addTo(map)
          .bindPopup('Tu ubicación actual')
          .openPopup();
        console.log('[handleShowLocation] Marcador azul añadido');
      },
      (error) => {
        console.error('[handleShowLocation] Error de geolocalización:', error);
        let message = 'No se pudo obtener tu ubicación.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de geolocalización denegado. Habilítalo en la configuración del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'La ubicación no está disponible.';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado al obtener la ubicación.';
            break;
          default:
            message = 'Error desconocido al obtener la ubicación.';
        }
        alert(message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAreaSelected = (latlngs) => {
    console.log('[handleAreaSelected] Área seleccionada:', latlngs);
    setAreaSelected(latlngs);
  };

  // Estadísticas para datos en tiempo real
  const stats = calculateStats(historyData);
  const chartData = {
    labels: historyData.map((_, index) => `-${(historyData.length - index - 1) * 2}s`),
    datasets: [
      {
        label: 'Humedad del suelo',
        data: historyData.map((data) => data.humidity || 0),
        borderColor: '#2E7D32',
        backgroundColor: alpha('#2E7D32', 0.05),
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2E7D32',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Media',
        data: historyData.map(() => stats.mean || 0),
        borderColor: '#F57C00',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Desviación Estándar (+/-)',
        data: historyData.map(() => (stats.mean || 0) + (stats.stdDev || 0)),
        borderColor: '#D32F2F',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Desviación Estándar (-)',
        data: historyData.map(() => (stats.mean || 0) - (stats.stdDev || 0)),
        borderColor: '#D32F2F',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  // Estadísticas para datos históricos
  const historicalStats = calculateStats(historicalData);
  const historicalChartData = {
    labels: historicalData.map((data) => new Date(data.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Humedad del suelo',
        data: historicalData.map((data) => data.humidity || 0),
        borderColor: '#2E7D32',
        backgroundColor: alpha('#2E7D32', 0.05),
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2E7D32',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Media',
        data: historicalData.map(() => historicalStats.mean || 0),
        borderColor: '#F57C00',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Desviación Estándar (+/-)',
        data: historicalData.map(() => (historicalStats.mean || 0) + (historicalStats.stdDev || 0)),
        borderColor: '#D32F2F',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
      {
        label: 'Desviación Estándar (-)',
        data: historicalData.map(() => (historicalStats.mean || 0) - (historicalStats.stdDev || 0)),
        borderColor: '#D32F2F',
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
          boxWidth: 12,
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
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10,
        },
        title: { display: true, text: 'Tiempo', color: '#263238' }
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0, 0, 0, 0.03)' },
        ticks: { callback: (value) => `${value}%` },
        title: { display: true, text: 'Humedad (%)', color: '#263238' }
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
    animation: {
      duration: 500,
      easing: 'linear'
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
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
            p: isMobile ? 2 : 3,
          }}
        >
          <Box
            sx={{
              maxWidth: '1800px',
              mx: 'auto',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                  Hola, {user?.username || 'Usuario'}!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Panel de monitoreo del sistema de riego inteligente
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton
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
              </Stack>
            </Box>

            {/* Mostrar error si existe */}
            {error && (
              <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            )}

            {/* Selectores de fechas */}
            <Card sx={{ mb: 3, p: 2 }}>
              <Box sx={{ ...cardHeaderStyle, mb: 0 }}>
                <Typography variant="h6" color="text.primary">
                  <CalendarMonthIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Selección de rango de fechas
                </Typography>
                <Chip 
                  label={refreshing ? 'Actualizando...' : 'Datos actualizados'} 
                  size="small"
                  color={refreshing ? 'warning' : 'success'}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <DatePicker
                  label="Fecha de inicio"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth={isMobile}
                      sx={{ minWidth: isMobile ? '100%' : '220px' }}
                      size="small"
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
                      fullWidth={isMobile}
                      sx={{ minWidth: isMobile ? '100%' : '220px' }}
                      size="small"
                    />
                  )}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={fetchHistoricalData}
                  disabled={refreshing}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Buscar
                </Button>
              </Box>
            </Card>

            {/* Datos históricos: Tabla y Gráfico */}
            {historicalData.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={cardHeaderStyle}>
                    <Typography variant="h5" color="text.primary">
                      <TimelineIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Datos Históricos
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {historicalData.length} registros
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Fecha y Hora</TableCell>
                              <TableCell>Humedad (%)</TableCell>
                              <TableCell>Bomba</TableCell>
                              <TableCell>Modo</TableCell>
                              <TableCell>Coordenadas</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {historicalData.map((row, index) => (
                              <TableRow
                                key={row.id}
                                sx={{ backgroundColor: index === sliderValue ? alpha('#2E7D32', 0.1) : 'inherit' }}
                              >
                                <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                                <TableCell>{row.humidity || 'N/A'}</TableCell>
                                <TableCell>{row.pump_state ? 'Activa' : 'Inactiva'}</TableCell>
                                <TableCell>{row.mode ? 'Automático' : 'Manual'}</TableCell>
                                <TableCell>{row.coordinates || 'N/A'}</TableCell>
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
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: isMobile ? '300px' : '400px' }}>
                        <Line
                          data={historicalChartData}
                          options={chartOptions}
                          redraw={refreshing}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Mapa grande */}
            <Card sx={{ mb: 3, height: isMobile ? '350px' : '500px' }}>
              <CardContent sx={{ height: '100%', p: 0 }}>
                <Box sx={{ 
                  ...cardHeaderStyle, 
                  p: isMobile ? 1.5 : 2,
                  pb: 0
                }}>
                  <Typography variant="h5" color="text.primary">
                    <LocationOnIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Mapa de Cultivo
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<LocationOnIcon />}
                    onClick={handleShowLocation}
                  >
                    {isMobile ? 'Ubicación' : 'Mi Ubicación'}
                  </Button>
                </Box>
                <Box sx={{ 
                  height: 'calc(100% - 56px)', 
                  width: '100%',
                  position: 'relative'
                }}>
                  <MapContainer
                    center={[-34.6037, -58.3816]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    whenCreated={(map) => {
                      console.log('[MapContainer] Mapa inicializado');
                      mapRef.current = map;
                    }}
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

            {/* Tarjetas de estado en fila */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  icon={<WaterDropIcon />}
                  title="Humedad del suelo"
                  value={iotData?.humidity ?? '--'}
                  subtitle="Nivel actual"
                  unit="%"
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  icon={<PowerSettingsNewIcon />}
                  title="Bomba de agua"
                  value={iotData?.pump_state ? 'ACTIVA' : 'INACTIVA'}
                  subtitle="Estado actual"
                  color={iotData?.pump_state ? theme.palette.success.main : theme.palette.error.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  icon={<AutoModeIcon />}
                  title="Modo de operación"
                  value={iotData?.mode ? 'AUTOMÁTICO' : 'MANUAL'}
                  subtitle="Configuración actual"
                  color={theme.palette.secondary.main}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  icon={<AccessTimeIcon />}
                  title="Última actualización"
                  value={iotData?.timestamp ? new Date(iotData.timestamp).toLocaleTimeString() : '--:--'}
                  subtitle={iotData?.timestamp ? new Date(iotData.timestamp).toLocaleDateString() : 'N/A'}
                  color={theme.palette.info.main}
                />
              </Grid>
            </Grid>

            {/* Cámara */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={cardHeaderStyle}>
                  <Typography variant="h5" color="text.primary">
                    <CameraAltIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Monitoreo por Cámara
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<CameraAltIcon />}
                      onClick={cameraStream ? handleCaptureImage : startCamera}
                      disabled={capturing}
                    >
                      {capturing ? 'Capturando...' : cameraStream ? 'Capturar Imagen' : 'Iniciar Cámara'}
                    </Button>
                    {cameraStream && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={stopCamera}
                      >
                        Detener Cámara
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current.click()}
                      disabled={capturing}
                    >
                      Subir Imagen
                    </Button>
                    <Input
                      type="file"
                      inputRef={fileInputRef}
                      inputProps={{ accept: 'image/jpeg,image/png' }}
                      onChange={handleFileUpload}
                      sx={{ display: 'none' }}
                    />
                  </Stack>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ 
                  height: isMobile ? '200px' : '300px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {cameraStream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  ) : latestImage && latestImage.image ? (
                    <img
                      src={`data:image/${latestImage.metadata.format || 'jpeg'};base64,${latestImage.image}`}
                      alt="Última captura"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay imágenes disponibles. Inicia la cámara o sube una imagen.
                    </Typography>
                  )}
                </Box>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {latestImage && !cameraStream && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Capturada: {new Date(latestImage.timestamp).toLocaleString()} ({latestImage.metadata.capturedBy})
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Humedad en Tiempo Real */}
            <Card>
              <CardContent>
                <Box sx={cardHeaderStyle}>
                  <Typography variant="h5" color="text.primary">
                    <TimelineIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Humedad en Tiempo Real
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {historyData.length} registros
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ 
                  height: isMobile ? '400px' : '500px',
                  position: 'relative'
                }}>
                  <Line
                    data={chartData}
                    options={chartOptions}
                    redraw={refreshing}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}