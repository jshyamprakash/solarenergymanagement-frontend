/**
 * Dashboard Page
 * Main dashboard with overview statistics
 * Refactored to use Redux for state management
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Factory as PlantIcon,
  DeviceHub as DeviceIcon,
  Warning as AlarmIcon,
  Bolt as EnergyIcon,
} from '@mui/icons-material';
import { selectUser } from '../store/slices/authSlice';
import {
  fetchPlants,
  selectPlants,
  selectPlantsLoading,
  selectPlantsError,
  clearError,
} from '../store/slices/plantSlice';
import { generateMockTimeSeriesData, generateMockEnergySummary } from '../services/dataService';
import LineChartComponent from '../components/charts/LineChartComponent';
import BarChartComponent from '../components/charts/BarChartComponent';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h3" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            p: 2,
            borderRadius: 2,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const user = useSelector(selectUser);
  const plants = useSelector(selectPlants);
  const loading = useSelector(selectPlantsLoading);
  const error = useSelector(selectPlantsError);

  // Local state for chart data (UI-specific)
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [energySummaryData, setEnergySummaryData] = useState([]);

  useEffect(() => {
    // Fetch plants data
    dispatch(fetchPlants({}));

    // Generate mock data for charts
    setTimeSeriesData(generateMockTimeSeriesData(24));
    setEnergySummaryData(generateMockEnergySummary(7));
  }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => dispatch(clearError())}>
        {error}
      </Alert>
    );
  }

  // Calculate statistics
  const totalPlants = plants.length;
  const totalDevices = plants.reduce((sum, plant) => sum + (plant._count?.devices || 0), 0);
  const totalAlarms = plants.reduce((sum, plant) => sum + (plant._count?.alarms || 0), 0);
  const totalCapacity = plants.reduce((sum, plant) => sum + (plant.capacity || 0), 0);

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your solar energy monitoring system
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Plants"
            value={totalPlants}
            icon={<PlantIcon sx={{ fontSize: 32 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Devices"
            value={totalDevices}
            icon={<DeviceIcon sx={{ fontSize: 32 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Alarms"
            value={totalAlarms}
            icon={<AlarmIcon sx={{ fontSize: 32 }} />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Capacity"
            value={`${(totalCapacity / 1000).toFixed(1)} MW`}
            icon={<EnergyIcon sx={{ fontSize: 32 }} />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Real-time Data Visualization */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Power Generation (24 Hours)
              </Typography>
              <Box sx={{ height: 300 }}>
                <LineChartComponent
                  data={timeSeriesData}
                  dataKey="value"
                  xAxisKey="time"
                  color="#1976d2"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Energy Summary (7 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <BarChartComponent
                  data={energySummaryData}
                  dataKey="energy"
                  xAxisKey="day"
                  color="#2e7d32"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Plant List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Plants
          </Typography>
          {plants.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No plants found
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {plants.map((plant) => (
                <Grid item xs={12} sm={6} md={4} key={plant.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {plant.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Capacity: {(plant.capacity / 1000).toFixed(1)} MW
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Devices: {plant._count?.devices || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Alarms: {plant._count?.alarms || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
