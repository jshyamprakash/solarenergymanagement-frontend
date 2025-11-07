/**
 * Dashboard Page
 * Main dashboard with overview statistics
 */

import React, { useState, useEffect } from 'react';
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
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { getAllPlants } from '../services/plantService';
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
  const user = useSelector(selectUser);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [energySummaryData, setEnergySummaryData] = useState([]);

  useEffect(() => {
    loadDashboardData();
    // Generate mock data for charts
    setTimeSeriesData(generateMockTimeSeriesData(24));
    setEnergySummaryData(generateMockEnergySummary(7));
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getAllPlants();
      setPlants(data.plants || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
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
        <Grid item xs={12} lg={8}>
          <LineChartComponent
            data={timeSeriesData}
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
          <BarChartComponent
            data={energySummaryData}
            title="Daily Energy Production"
            xDataKey="label"
            bars={[
              { dataKey: 'energy', name: 'Energy (kWh)', color: '#f59e0b' },
            ]}
            height={350}
          />
        </Grid>
      </Grid>

      {/* Plants Overview */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Solar Plants
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {plants.map((plant) => (
              <Grid item xs={12} md={6} key={plant.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{plant.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {plant.location?.address || 'No address'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Typography variant="caption">
                        Capacity: {(plant.capacity / 1000).toFixed(1)} MW
                      </Typography>
                      <Typography variant="caption">
                        Status: {plant.status}
                      </Typography>
                      <Typography variant="caption">
                        Devices: {plant._count?.devices || 0}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
