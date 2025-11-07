/**
 * Device Detail Page
 * Displays detailed information about a specific device
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  DevicesOther as DeviceIcon,
  Business as PlantIcon,
  CalendarToday as CalendarIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { getDeviceById, getDeviceChildren } from '../services/deviceService';
import { generateMockTimeSeriesData } from '../services/dataService';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';
import LineChartComponent from '../components/charts/LineChartComponent';
import BarChartComponent from '../components/charts/BarChartComponent';

const STATUS_COLORS = {
  ONLINE: 'success',
  OFFLINE: 'error',
  MAINTENANCE: 'warning',
  ERROR: 'error',
};

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);

  const [device, setDevice] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);

  useEffect(() => {
    loadDevice();
    // Generate mock performance data for charts
    setPerformanceData(generateMockTimeSeriesData(24));
    // Generate temperature and voltage data
    const tempData = generateMockTimeSeriesData(24).map(item => ({
      time: item.time,
      temperature: item.temperature,
      voltage: item.voltage,
    }));
    setTemperatureData(tempData);
  }, [id]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deviceData, childrenData] = await Promise.all([
        getDeviceById(id),
        getDeviceChildren(id).catch(() => []),
      ]);

      setDevice(deviceData);
      setChildren(childrenData || []);
    } catch (err) {
      console.error('Error loading device:', err);
      setError(err.response?.data?.message || 'Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/devices')}
          sx={{ mt: 2 }}
        >
          Back to Devices
        </Button>
      </Box>
    );
  }

  if (!device) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Device not found</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/devices')}
          sx={{ mt: 2 }}
        >
          Back to Devices
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/devices')}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeviceIcon fontSize="large" />
            {device.name}
          </Typography>
          <Chip
            label={device.status}
            color={STATUS_COLORS[device.status] || 'default'}
            size="medium"
          />
        </Box>
        {(isAdmin || isPlantManager) && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/devices/${id}/edit`)}
          >
            Edit Device
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Device Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Device Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="text.secondary" variant="body2">
                    Device Type
                  </Typography>
                  <Typography variant="body1">
                    {device.deviceType.replace('_', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary" variant="body2">
                    Serial Number
                  </Typography>
                  <Typography variant="body1">
                    {device.serialNumber || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary" variant="body2">
                    Manufacturer
                  </Typography>
                  <Typography variant="body1">
                    {device.manufacturer || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary" variant="body2">
                    Model
                  </Typography>
                  <Typography variant="body1">
                    {device.model || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary" variant="body2">
                    Installation Date
                  </Typography>
                  <Typography variant="body1">
                    {device.installationDate
                      ? new Date(device.installationDate).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary" variant="body2">
                    Last Communication
                  </Typography>
                  <Typography variant="body1">
                    {device.lastCommunication
                      ? new Date(device.lastCommunication).toLocaleString()
                      : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Plant Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlantIcon />
                Plant Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography color="text.secondary" variant="body2">
                Plant Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {device.plant?.name || 'N/A'}
              </Typography>
              {device.parentDevice && (
                <>
                  <Typography color="text.secondary" variant="body2">
                    Parent Device
                  </Typography>
                  <Typography variant="body1">
                    {device.parentDevice.name}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Charts */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 1 }}>
            Device Performance
          </Typography>
        </Grid>
        <Grid item xs={12} lg={8}>
          <LineChartComponent
            data={performanceData}
            title="Power Generation - Last 24 Hours"
            xDataKey="time"
            lines={[
              { dataKey: 'activePower', name: 'Active Power (kW)', color: '#f59e0b' },
              { dataKey: 'energy', name: 'Energy (kWh)', color: '#10b981' },
            ]}
            height={350}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <LineChartComponent
            data={temperatureData}
            title="Temperature & Voltage"
            xDataKey="time"
            lines={[
              { dataKey: 'temperature', name: 'Temperature (°C)', color: '#ef4444' },
              { dataKey: 'voltage', name: 'Voltage (V)', color: '#3b82f6' },
            ]}
            height={350}
          />
        </Grid>

        {/* Tags */}
        {device.tags && device.tags.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Tags ({device.tags.length})
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  {device.tags.map((tag) => (
                    <ListItem key={tag.id}>
                      <ListItemText
                        primary={tag.name}
                        secondary={`Type: ${tag.dataType} | Unit: ${tag.unit || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Child Devices */}
        {children && children.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Child Devices ({children.length})
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  {children.map((child) => (
                    <ListItem
                      key={child.id}
                      button
                      onClick={() => navigate(`/devices/${child.id}`)}
                    >
                      <ListItemText
                        primary={child.name}
                        secondary={`Type: ${child.deviceType.replace('_', ' ')} | Status: ${child.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DeviceDetail;
