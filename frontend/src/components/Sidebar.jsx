import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  IconButton,
  Divider,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StoreIcon from '@mui/icons-material/Store';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import logoSmart from '../resource/logoreal.png';

const Sidebar = ({ open, onClose, onSelectView }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { text: 'Panel de Control', icon: <DashboardIcon />, value: 'dashboard', path: '/' },
    { text: 'Tienda', icon: <StoreIcon />, value: 'store', path: '/store' },
  ];

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      {isMobile && !open && (
        <IconButton
          onClick={onClose}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={isMobile ? onClose : undefined}
        sx={{
          width: collapsed ? 80 : 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? 80 : 280,
            boxSizing: 'border-box',
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
            borderRight: 'none',
            boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
            background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ 
          p: collapsed ? 2 : 3, 
          position: 'relative',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: collapsed ? 1 : 2
        }}>
          {/* Logo grande */}
          <Box
            component="img"
            src={logoSmart}
            alt="Logo SmartTemperatura"
            sx={{
              width: collapsed ? 48 : 80,
              height: collapsed ? 48 : 80,
              objectFit: 'contain',
              mb: collapsed ? 0 : 2
            }}
          />

          {!collapsed ? (
            <>
              {/* Nombre de la empresa */}
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                  mb: 1
                }}
              >
                SMARTTEMPERATURA
              </Typography>
              
              <Chip 
                label="Sistema Premium" 
                size="small" 
                sx={{ 
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: '24px'
                }} 
              />
            </>
          ) : (
            <Tooltip title="SmartTemperatura" placement="right">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  component="img"
                  src={logoSmart}
                  alt="Logo SmartTemperatura"
                  sx={{
                    width: 40,
                    height: 40,
                    objectFit: 'contain',
                    mb: 1
                  }}
                />
              </Box>
            </Tooltip>
          )}
          
          {!isMobile && (
            <IconButton
              onClick={toggleCollapse}
              sx={{
                position: 'absolute',
                top: 16,
                right: -12,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
                width: 24,
                height: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>

        <Box sx={{ overflow: 'auto', height: '100%', py: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.value} disablePadding sx={{ px: 1, mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right">
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    onClick={() => onSelectView(item.value)}
                    sx={{
                      borderRadius: '12px',
                      mx: 1,
                      py: 1.5,
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '& .MuiListItemIcon-root': {
                          color: theme.palette.primary.main,
                        },
                        '& .MuiListItemText-primary': {
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                        }
                      },
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateX(4px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
                        minWidth: collapsed ? 'auto' : 56,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        mx: collapsed ? 'auto' : 0
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText 
                        primary={item.text} 
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: location.pathname === item.path ? 600 : 500,
                            color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                            fontSize: '1rem'
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>

          {!collapsed && (
            <>
              <Divider sx={{ my: 3, mx: 2 }} />
              <Box sx={{ px: 3, pb: 2 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2, 
                    fontStyle: 'italic',
                    textAlign: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  Monitoreo inteligente de temperatura en tiempo real
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Chip 
                    label="v2.0.1" 
                    size="small" 
                    variant="outlined" 
                    sx={{ 
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      fontSize: '0.65rem'
                    }} 
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;