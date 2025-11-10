/**
 * Main Layout Component
 * Wrapper for authenticated pages with navigation
 */

import React from 'react';
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
} from '@mui/icons-material';
import { logout as logoutAction, selectUser, selectIsAdmin } from '../store/slices/authSlice';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  const handleLogout = async () => {
    await dispatch(logoutAction());
    navigate('/login');
  };

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/map')) return '/map';
    if (path.startsWith('/plants')) return '/plants';
    if (path.startsWith('/devices')) return '/devices';
    if (path.startsWith('/masters')) return '/masters';
    if (path.startsWith('/alarms')) return '/alarms';
    if (path.startsWith('/reports')) return '/reports';
    // AUDIT LOG - COMMENTED OUT (Enable when needed)
    // if (path.startsWith('/audit')) return '/audit';
    if (path.startsWith('/users')) return '/users';
    return '/dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SunIcon sx={{ mr: 2, fontSize: 32 }} />

          <Typography variant="h6" component="div" sx={{ mr: 4 }}>
            Solar Monitor
          </Typography>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, value) => navigate(value)}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ flexGrow: 1 }}
          >
            <Tab
              icon={<DashboardIcon />}
              iconPosition="start"
              label="Dashboard"
              value="/dashboard"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<MapIcon />}
              iconPosition="start"
              label="Map"
              value="/map"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<PlantIcon />}
              iconPosition="start"
              label="Plants"
              value="/plants"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<DeviceIcon />}
              iconPosition="start"
              label="Devices"
              value="/devices"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<MastersIcon />}
              iconPosition="start"
              label="Masters"
              value="/masters"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<AlarmIcon />}
              iconPosition="start"
              label="Alarms"
              value="/alarms"
              sx={{ minHeight: 64 }}
            />
            <Tab
              icon={<ReportIcon />}
              iconPosition="start"
              label="Reports"
              value="/reports"
              sx={{ minHeight: 64 }}
            />
            {/* AUDIT LOG - COMMENTED OUT (Enable when needed) */}
            {/* {isAdmin && (
              <Tab
                icon={<HistoryIcon />}
                iconPosition="start"
                label="Audit Log"
                value="/audit"
                sx={{ minHeight: 64 }}
              />
            )} */}
            {isAdmin && (
              <Tab
                icon={<PeopleIcon />}
                iconPosition="start"
                label="Users"
                value="/users"
                sx={{ minHeight: 64 }}
              />
            )}
          </Tabs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.name} ({user?.role})
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
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
