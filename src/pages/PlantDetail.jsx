/**
 * Plant Detail Page
 * View detailed information about a specific plant
 * Refactored to use Redux for state management
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Bolt as BoltIcon,
  DeviceHub as DeviceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  fetchPlantById,
  fetchPlantStats,
  selectCurrentPlant,
  selectCurrentPlantStats,
  selectPlantsLoading,
  selectPlantsError,
  clearError,
  clearCurrentPlant,
} from '../store/slices/plantSlice';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';
import { generateMockTimeSeriesData, generateMockEnergySummary } from '../services/dataService';
import LineChartComponent from '../components/charts/LineChartComponent';
import BarChartComponent from '../components/charts/BarChartComponent';

const InfoRow = ({ label, value }) => (
  <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Box>
);

const StatCard = ({ icon, title, value, color = 'primary' }) => (
  <Paper sx={{ p: 3, textAlign: 'center' }}>
    <Box
      sx={{
        display: 'inline-flex',
        p: 2,
        borderRadius: 2,
        bgcolor: `${color}.light`,
        color: `${color}.main`,
        mb: 2,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h4" gutterBottom>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
  </Paper>
);

const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);
  const plant = useSelector(selectCurrentPlant);
  const stats = useSelector(selectCurrentPlantStats);
  const loading = useSelector(selectPlantsLoading);
  const error = useSelector(selectPlantsError);

  // Local state for chart data (UI-specific)
  const [powerData, setPowerData] = useState([]);
  const [energySummary, setEnergySummary] = useState([]);

  useEffect(() => {
    // Fetch plant data with devices and stats
    dispatch(fetchPlantById({ id, includeDevices: true }));
    dispatch(fetchPlantStats(id));

    // Generate mock chart data
    setPowerData(generateMockTimeSeriesData(24));
    setEnergySummary(generateMockEnergySummary(30));

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentPlant());
    };
  }, [id, dispatch]);

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

  if (!plant) {
    return <Alert severity="warning">Plant not found</Alert>;
  }

  const canModify = isAdmin || isPlantManager;
  const statusColors = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    MAINTENANCE: 'warning',
    OFFLINE: 'error',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/plants')}
            sx={{ mb: 2 }}
          >
            Back to Plants
          </Button>
          <Typography variant="h4" gutterBottom>
            {plant.name}
          </Typography>
          <Chip
            label={plant.status}
            color={statusColors[plant.status]}
            sx={{ mt: 1 }}
          />
        </Box>
        {canModify && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/plants/${id}/edit`)}
          >
            Edit Plant
          </Button>
        )}
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<DeviceIcon sx={{ fontSize: 32 }} />}
              title="Total Devices"
              value={stats.deviceStats?.total || 0}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<DeviceIcon sx={{ fontSize: 32 }} />}
              title="Online Devices"
              value={stats.deviceStats?.online || 0}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<WarningIcon sx={{ fontSize: 32 }} />}
              title="Active Alarms"
              value={stats.alarmStats?.active || 0}
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<BoltIcon sx={{ fontSize: 32 }} />}
              title="Energy (kWh)"
              value={(stats.energyStats?.totalGenerated || 0).toLocaleString()}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Plant Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plant Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <InfoRow label="Capacity" value={`${(plant.capacity / 1000).toFixed(1)} MW`} />
              <InfoRow label="Status" value={plant.status} />
              <InfoRow
                label="Installation Date"
                value={plant.installationDate ? new Date(plant.installationDate).toLocaleDateString() : 'N/A'}
              />
              <InfoRow label="Timezone" value={plant.timezone || 'UTC'} />
              <InfoRow label="Owner" value={plant.createdBy?.name || 'N/A'} />
              <InfoRow
                label="Created"
                value={new Date(plant.createdAt).toLocaleDateString()}
              />
              <InfoRow
                label="Last Updated"
                value={new Date(plant.updatedAt).toLocaleDateString()}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Location */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Location
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <InfoRow label="Address" value={plant.location?.address || 'N/A'} />
              <InfoRow label="Latitude" value={plant.location?.lat || 'N/A'} />
              <InfoRow label="Longitude" value={plant.location?.lng || 'N/A'} />
              <InfoRow label="Coordinates" value={plant.coordinates || 'N/A'} />

              {/* Map placeholder */}
              <Box
                sx={{
                  mt: 2,
                  height: 200,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Map view (Google Maps integration)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy Production Charts */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 1 }}>
            Energy Production Analysis
          </Typography>
        </Grid>
        <Grid item xs={12} lg={8}>
          <LineChartComponent
            data={powerData}
            title="Plant Power Generation - Last 24 Hours"
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
            data={energySummary}
            title="Monthly Energy Production"
            xDataKey="label"
            bars={[
              { dataKey: 'energy', name: 'Energy (kWh)', color: '#f59e0b' },
            ]}
            height={350}
          />
        </Grid>

        {/* Device Statistics */}
        {stats && stats.deviceStats?.byType && stats.deviceStats.byType.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Devices by Type
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {stats.deviceStats.byType.map((item, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.deviceType}
                        </Typography>
                        <Typography variant="h6">
                          {item._count} {item.status}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* AWS IoT Information */}
        {plant.iotThingName && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AWS IoT Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <InfoRow label="IoT Thing Name" value={plant.iotThingName || 'Not configured'} />
                <InfoRow label="MQTT Topic" value={plant.mqttTopic || 'Not configured'} />
                <InfoRow label="IoT Thing ARN" value={plant.iotThingArn || 'Not configured'} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PlantDetail;
