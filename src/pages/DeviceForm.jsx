/**
 * Device Form Page
 * Create or edit a device
 * Refactored to use Redux for state management
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  DevicesOther as DeviceIcon,
} from '@mui/icons-material';
import {
  fetchDeviceById,
  fetchDevices,
  createDevice as createDeviceAction,
  updateDevice as updateDeviceAction,
  selectCurrentDevice,
  selectDevices,
  selectDevicesLoading,
  selectDevicesError,
  clearError,
  clearCurrentDevice,
} from '../store/slices/deviceSlice';
import {
  fetchPlants,
  selectPlants,
} from '../store/slices/plantSlice';

const DEVICE_TYPES = [
  'INVERTER',
  'TRANSFORMER',
  'COMBINER_BOX',
  'WEATHER_STATION',
  'METER',
  'STRING',
  'MODULE',
  'OTHER',
];

const DEVICE_STATUS = ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'];

const DeviceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);

  // Redux selectors
  const device = useSelector(selectCurrentDevice);
  const plants = useSelector(selectPlants);
  const availableParentDevices = useSelector(selectDevices);
  const loading = useSelector(selectDevicesLoading);
  const reduxError = useSelector(selectDevicesError);

  // Local form state (acceptable for forms)
  const [formData, setFormData] = useState({
    plantId: '',
    name: '',
    deviceType: 'INVERTER',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'ONLINE',
    parentDeviceId: '',
    installationDate: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load plants and device (if editing) on mount
  useEffect(() => {
    dispatch(fetchPlants({ page: 1, limit: 1000 }));

    if (isEditMode) {
      dispatch(fetchDeviceById(id));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentDevice());
    };
  }, [id, isEditMode, dispatch]);

  // Populate form when device data is loaded from Redux
  useEffect(() => {
    if (device && isEditMode) {
      setFormData({
        plantId: device.plantId || '',
        name: device.name || '',
        deviceType: device.deviceType || 'INVERTER',
        manufacturer: device.manufacturer || '',
        model: device.model || '',
        serialNumber: device.serialNumber || '',
        status: device.status || 'ONLINE',
        parentDeviceId: device.parentDeviceId || '',
        installationDate: device.installationDate
          ? new Date(device.installationDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [device, isEditMode]);

  // Load parent devices when plantId changes
  useEffect(() => {
    if (formData.plantId) {
      dispatch(fetchDevices({ plantId: formData.plantId, limit: 100 }));
    }
  }, [formData.plantId, dispatch]);

  // Filter out current device from parent options if editing
  const filteredParentDevices = isEditMode
    ? availableParentDevices.filter((device) => device.id !== id)
    : availableParentDevices;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        plantId: formData.plantId,
        name: formData.name,
        deviceType: formData.deviceType,
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        status: formData.status,
        parentDeviceId: formData.parentDeviceId || undefined,
        installationDate: formData.installationDate || undefined,
      };

      // Use Redux actions to create/update device
      if (isEditMode) {
        await dispatch(updateDeviceAction({ id, deviceData: payload })).unwrap();
      } else {
        await dispatch(createDeviceAction(payload)).unwrap();
      }

      navigate('/devices');
    } catch (err) {
      console.error('Error saving device:', err);
      setError(err || 'Failed to save device');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/devices')}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeviceIcon fontSize="large" />
          {isEditMode ? 'Edit Device' : 'Create Device'}
        </Typography>
      </Box>

      {(error || reduxError) && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setError(null);
            dispatch(clearError());
          }}
        >
          {error || reduxError}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Plant */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                required
                fullWidth
                label="Plant"
                name="plantId"
                value={formData.plantId}
                onChange={handleChange}
                disabled={isEditMode}
              >
                {plants.map((plant) => (
                  <MenuItem key={plant.id} value={plant.id}>
                    {plant.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Device Name */}
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Device Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            {/* Device Type */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                required
                fullWidth
                label="Device Type"
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
              >
                {DEVICE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                required
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {DEVICE_STATUS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Manufacturer */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
              />
            </Grid>

            {/* Model */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
              />
            </Grid>

            {/* Serial Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Serial Number"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
              />
            </Grid>

            {/* Installation Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Installation Date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Parent Device */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Parent Device (Optional)"
                name="parentDeviceId"
                value={formData.parentDeviceId}
                onChange={handleChange}
                helperText="Select a parent device to create a hierarchy"
                disabled={!formData.plantId}
              >
                <MenuItem value="">None</MenuItem>
                {filteredParentDevices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name} ({device.deviceType.replace('_', ' ')})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/devices')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditMode ? 'Update Device' : 'Create Device'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default DeviceForm;
