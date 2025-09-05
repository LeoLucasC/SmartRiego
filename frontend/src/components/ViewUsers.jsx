import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Fade,
  Modal,
  TextField,
  Divider,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import Header from './Header';
import Sidebar from './Sidebar';

const theme = createTheme({
  palette: {
    primary: { main: '#ffeb3b', contrastText: '#212121' },
    secondary: { main: '#f44336', contrastText: '#ffffff' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#263238', secondary: '#546E7A' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.8rem' },
    h5: { fontWeight: 600, fontSize: '1.4rem' },
    body1: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: 'none',
          padding: '12px',
        },
        head: {
          backgroundColor: alpha('#ffeb3b', 0.1),
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
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': { boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)', transform: 'translateY(-2px)' },
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#e0e0e0', borderRadius: '8px' },
            '&:hover fieldset': { borderColor: '#bdbdbd' },
            '&.Mui-focused fieldset': { borderColor: '#ffeb3b' },
          },
        },
      },
    },
  },
});

export default function ViewUsers({ setToken }) {
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [shifts, setShifts] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState({ id: '', username: '', password: '' });
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);
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
      const serverUrl = 'http://192.168.0.237:5000';

      const [userResponse, usersResponse, alertsResponse] = await Promise.all([
        axios.get(`${serverUrl}/user`, config).catch(err => {
          console.error('Error al obtener usuario:', err.response?.data || err.message);
          return { data: null };
        }),
        axios.get(`${serverUrl}/users`, config).catch(err => {
          console.error('Error al obtener colaboradores:', err.response?.data || err.message);
          return { data: [] };
        }),
        axios.get(`${serverUrl}/iot-alerts`, config).catch(err => {
          console.error('Error al obtener alertas:', err.response?.data || err.message);
          return { data: { alerts: [] } };
        }),
      ]);

      if (userResponse.data && userResponse.data.role === 'admin') {
        setUser(userResponse.data);
      } else {
        setError('Solo los administradores pueden acceder a esta página.');
        return;
      }

      const usersData = usersResponse.data || [];
      setUsers(usersData);

      const shiftsPromises = usersData.map(user =>
        axios.get(`${serverUrl}/shifts/${user.id}`, config).catch(() => ({ data: [] }))
      );
      const shiftsResponses = await Promise.all(shiftsPromises);
      const shiftsData = shiftsResponses.reduce((acc, response, index) => {
        acc[usersData[index].id] = response.data.filter(s => s.status === 'active').length;
        return acc;
      }, {});
      setShifts(shiftsData);

      setAlerts(alertsResponse.data.alerts || []);
    } catch (error) {
      console.error('Error general al cargar datos:', error.response?.data || error.message);
      setError('Error al cargar los datos. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este colaborador?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`http://192.168.0.237:5000/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Error al eliminar usuario:', error.response?.data || error.message);
      setError(error.response?.data.error || 'Error al eliminar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (user) => {
    setEditUser({ id: user.id, username: user.username, password: '' });
    setModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser.username || editUser.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = { username: editUser.username };
      if (editUser.password) payload.password = editUser.password;
      await axios.put(`http://192.168.0.237:5000/user/${editUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.map((u) => (u.id === editUser.id ? { ...u, username: editUser.username } : u)));
      setModalOpen(false);
      setEditUser({ id: '', username: '', password: '' });
    } catch (error) {
      console.error('Error al actualizar usuario:', error.response?.data || error.message);
      setError(error.response?.data.error || 'Error al actualizar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewShifts = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://192.168.0.237:5000/shifts/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedShifts(response.data);
      setShiftModalOpen(true);
    } catch (error) {
      console.error('Error al obtener turnos:', error.response?.data || error.message);
      setError(error.response?.data.error || 'Error al obtener los turnos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (user && user.role !== 'admin') {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" color="error.main">
            Acceso Denegado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ my: 2 }}>
            Solo los administradores pueden acceder a esta página.
          </Typography>
          <Button variant="contained" color="secondary" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

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
            role={user?.role || 'collaborator'}
            onLogout={handleLogout}
            isMobile={isMobile}
            alerts={alerts}
          />
          {error && (
            <Fade in={!!error}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          <Typography variant="h4" color="text.primary" sx={{ mb: 2 }}>
            Ver Colaboradores
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Lista de colaboradores con acciones para editar o eliminar.
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Grupo ID</TableCell>
                  <TableCell>Alertas</TableCell>
                  <TableCell>Turnos Activos</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.group_id}</TableCell>
                      <TableCell>{alerts.filter(a => a.group_id === u.group_id).length}</TableCell>
                      <TableCell>{shifts[u.id] || 0}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditOpen(u)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(u.id)} color="secondary">
                          <DeleteIcon />
                        </IconButton>
                        <IconButton onClick={() => handleViewShifts(u.id)} color="primary">
                          <EventIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No se encontraron colaboradores.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: '8px',
                width: { xs: '90%', sm: 400 },
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Editar Colaborador
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="form" onSubmit={handleEditSubmit}>
                <TextField
                  fullWidth
                  label="Usuario"
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Nueva Contraseña (opcional)"
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={shiftModalOpen} onClose={() => setShiftModalOpen(false)}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: '8px',
                width: { xs: '90%', sm: 600 },
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Turnos del Colaborador
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedShifts.length > 0 ? (
                    selectedShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{new Date(shift.start_time).toLocaleString()}</TableCell>
                        <TableCell>{new Date(shift.end_time).toLocaleString()}</TableCell>
                        <TableCell>{shift.status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No se encontraron turnos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShiftModalOpen(false)}
                sx={{ mt: 2 }}
              >
                Cerrar
              </Button>
            </Box>
          </Modal>
        </Box>
      </Box>
    </ThemeProvider>
  );
}