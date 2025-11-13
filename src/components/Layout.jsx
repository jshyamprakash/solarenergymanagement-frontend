/**
 * Main Layout Component
 * Wrapper for authenticated pages with navigation
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Factory as PlantIcon,
  DeviceHub as DeviceIcon,
  Warning as AlarmIcon,
  Assessment as ReportIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  LightMode as SunIcon,
  // AUDIT LOG - COMMENTED OUT (Enable when needed)
  // History as HistoryIcon,
  Settings as MastersIcon,
  BusinessCenter as ManagementIcon,
} from '@mui/icons-material';
import { logout as logoutAction, selectUser, selectIsAdmin } from '../store/slices/authSlice';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleLogout = async () => {
    await dispatch(logoutAction());
    navigate('/login');
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMobileMenuClose();
  };

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/map')) return '/map';
    if (path.startsWith('/plants')) return '/plants';
    if (path.startsWith('/management')) return '/management';
    if (path.startsWith('/masters')) return '/masters';
    if (path.startsWith('/alarms')) return '/alarms';
    if (path.startsWith('/reports')) return '/reports';
    // AUDIT LOG - COMMENTED OUT (Enable when needed)
    // if (path.startsWith('/audit')) return '/audit';
    if (path.startsWith('/users')) return '/users';
    return '/dashboard';
  };

  const activeTab = getActiveTab();

  // Navigation items configuration
  const navItems = [
    { label: 'Dashboard', value: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Map', value: '/map', icon: <MapIcon /> },
    { label: 'Plants', value: '/plants', icon: <PlantIcon /> },
    { label: 'Management', value: '/management', icon: <ManagementIcon /> },
    { label: 'Masters', value: '/masters', icon: <MastersIcon /> },
    { label: 'Alarms', value: '/alarms', icon: <AlarmIcon /> },
    { label: 'Reports', value: '/reports', icon: <ReportIcon /> },
    // AUDIT LOG - COMMENTED OUT (Enable when needed)
    // ...(isAdmin ? [{ label: 'Audit Log', value: '/audit', icon: <HistoryIcon /> }] : []),
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SunIcon sx={{ mr: 2, fontSize: 32 }} />

          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Solar Monitor
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile ? (
            <>
              <Tabs
                value={activeTab}
                onChange={(e, value) => navigate(value)}
                textColor="inherit"
                indicatorColor="secondary"
                sx={{ flexGrow: 1 }}
                variant="scrollable"
                scrollButtons="auto"
              >
                {navItems.map((item) => (
                  <Tab
                    key={item.value}
                    icon={item.icon}
                    iconPosition="start"
                    label={item.label}
                    value={item.value}
                    sx={{ minHeight: 64 }}
                  />
                ))}
              </Tabs>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {user?.name}
                </Typography>
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                >
                  <Typography sx={{ display: { xs: 'none', sm: 'block' } }}>Logout</Typography>
                </Button>
              </Box>
            </>
          ) : (
            /* Mobile Navigation */
            <>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton
                color="inherit"
                onClick={handleMobileMenuOpen}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                onClick={handleMobileMenuClose}
              >
                {navItems.map((item) => (
                  <MenuItem
                    key={item.value}
                    onClick={() => handleNavigation(item.value)}
                    selected={activeTab === item.value}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.icon}
                      <Typography>{item.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem divider />
                <MenuItem onClick={handleLogout}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LogoutIcon />
                    <Typography>Logout</Typography>
                  </Box>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 3, bgcolor: 'background.default' }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Solar Energy Monitoring System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
