/**
 * Main App Component
 * Root component with routing
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';
import theme from './theme';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Plants from './pages/Plants';
import PlantDetail from './pages/PlantDetail';
import PlantForm from './pages/PlantForm';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import DeviceForm from './pages/DeviceForm';
import Alarms from './pages/Alarms';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Plant Management Routes */}
              <Route path="plants" element={<Plants />} />
              <Route path="plants/new" element={<PlantForm />} />
              <Route path="plants/:id" element={<PlantDetail />} />
              <Route path="plants/:id/edit" element={<PlantForm />} />

              {/* Device Management Routes */}
              <Route path="devices" element={<Devices />} />
              <Route path="devices/new" element={<DeviceForm />} />
              <Route path="devices/:id" element={<DeviceDetail />} />
              <Route path="devices/:id/edit" element={<DeviceForm />} />

              {/* Alarm Management Routes */}
              <Route path="alarms" element={<Alarms />} />

              {/* Placeholder routes for future pages */}
              <Route path="reports" element={<Dashboard />} />
              <Route path="users" element={<Dashboard />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
