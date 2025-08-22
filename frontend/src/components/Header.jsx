import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Stack, 
  IconButton, 
  Button,
  Badge,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';

const Header = ({ username, alerts, onRefresh, refreshing, onLogout, isMobile }) => {
  const theme = useTheme();

  // Depuración en consola
  React.useEffect(() => {
    console.log('Header - Username recibido:', username);
  }, [username]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        flexWrap: 'wrap',
        gap: 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid',
        borderColor: 'rgba(255, 235, 59, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #ffeb3b 0%, #f44336 100%)',
          borderRadius: '16px 16px 0 0'
        }
      }}
    >
      {/* Sección izquierda: Título y descripción */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        flexWrap: 'wrap',
        flex: 1,
        minWidth: isMobile ? '100%' : 'auto'
      }}>
        <Box>
          <Typography 
            variant="h4" 
            color="text.primary" 
            sx={{ 
              fontWeight: 800,
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              background: 'linear-gradient(135deg, #f44336 0%, #ffeb3b 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Panel de Control - SmartTemperatura
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
          >
            Sistema Inteligente de Temperatura y Humedad 
          </Typography>
        </Box>
      </Box>

      {/* Sección central: Información de usuario */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Chip de bienvenida y usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Bienvenido,
          </Typography>
          <Chip
            icon={<PersonIcon />}
            label={username || 'Usuario'} // Fallback a "Usuario" si no hay username
            color="primary"
            variant="filled"
            size="medium"
            sx={{ 
              fontWeight: 600,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(255, 235, 59, 0.3)'
              },
              transition: 'all 0.3s ease',
              '& .MuiChip-icon': {
                color: 'primary.contrastText'
              }
            }}
          />
        </Box>
        
        {/* Alertas */}
        {alerts?.length > 0 && (
          <Tooltip title={alerts.join('\n')} arrow>
            <Badge 
              badgeContent={alerts.length} 
              color="error"
              sx={{ 
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  height: '20px',
                  minWidth: '20px',
                  borderRadius: '10px',
                  fontWeight: 'bold'
                }
              }}
            >
              <Chip
                icon={<WarningIcon />}
                label={`${alerts.length} Alerta${alerts.length > 1 ? 's' : ''}`}
                color="warning"
                variant="filled"
                size="medium"
                sx={{
                  fontWeight: 600,
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)'
                  },
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '& .MuiChip-icon': {
                    color: 'secondary.contrastText'
                  }
                }}
                onClick={() => alert(alerts.join('\n'))}
              />
            </Badge>
          </Tooltip>
        )}
      </Box>
      
      {/* Sección derecha: Botones de acción */}
      <Stack 
        direction="row" 
        spacing={1}
        sx={{
          flexShrink: 0
        }}
      >
        <Tooltip title="Actualizar datos" arrow>
          <IconButton
            onClick={onRefresh}
            disabled={refreshing}
            sx={{ 
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              '&:hover': { 
                backgroundColor: 'primary.main',
                transform: 'rotate(45deg)'
              },
              transition: 'all 0.3s ease',
              width: '48px',
              height: '48px'
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          size={isMobile ? 'small' : 'medium'}
          sx={{
            fontWeight: 600,
            borderRadius: '12px',
            px: 2,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(244, 67, 54, 0.3)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isMobile ? 'Salir' : 'Cerrar Sesión'}
        </Button>
      </Stack>
    </Box>
  );
};

export default Header;