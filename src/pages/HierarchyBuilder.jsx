/**
 * Hierarchy Viewer Page
 * Simple tree visualization of plant device hierarchy
 * Refactored to use Redux for state management
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  AccountTree as TreeIcon,
  SubdirectoryArrowRight as ChildIcon,
  Power as GridIcon,
} from '@mui/icons-material';
import {
  fetchPlants,
  fetchPlantById,
  selectPlants,
  selectCurrentPlant,
  selectPlantsLoading,
  selectPlantsError,
  clearError as clearPlantError,
  clearCurrentPlant,
} from '../store/slices/plantSlice';
import {
  fetchDevices,
  selectDevices,
  selectDevicesLoading,
  selectDevicesError,
  clearError as clearDeviceError,
} from '../store/slices/deviceSlice';

const HierarchyBuilder = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const plants = useSelector(selectPlants);
  const selectedPlantData = useSelector(selectCurrentPlant);
  const devices = useSelector(selectDevices);
  const plantsLoading = useSelector(selectPlantsLoading);
  const devicesLoading = useSelector(selectDevicesLoading);
  const plantsError = useSelector(selectPlantsError);
  const devicesError = useSelector(selectDevicesError);

  // Local UI state
  const [selectedPlant, setSelectedPlant] = useState('');

  const loading = plantsLoading || devicesLoading;
  const error = plantsError || devicesError;

  // Load plants on mount
  useEffect(() => {
    dispatch(fetchPlants({ page: 1, limit: 1000 }));
  }, [dispatch]);

  // Load hierarchy when plant is selected
  useEffect(() => {
    if (selectedPlant) {
      // Load plant details
      dispatch(fetchPlantById(selectedPlant));

      // Load all devices for the plant
      dispatch(fetchDevices({ plantId: selectedPlant, limit: 1000 }));
    } else {
      dispatch(clearCurrentPlant());
    }
  }, [selectedPlant, dispatch]);

  const buildDeviceTree = () => {
    if (!selectedPlantData) return null;

    // Build tree structure: Grid -> Plant -> Devices
    const tree = {
      name: 'Grid',
      deviceId: 'GRID',
      type: 'Power Grid',
      isGrid: true,
      children: [
        {
          name: selectedPlantData.name,
          deviceId: selectedPlantData.plantId,
          type: 'Solar Plant',
          status: selectedPlantData.status,
          capacity: selectedPlantData.capacity,
          isPlant: true,
          children: [],
        },
      ],
    };

    // Add devices that have no parent (root level devices under plant)
    const rootDevices = devices.filter((d) => !d.parentDeviceId);

    const addChildren = (parentId) => {
      return devices
        .filter((d) => d.parentDeviceId === parentId)
        .map((device) => ({
          name: device.name,
          deviceId: device.deviceId,
          type: device.deviceType?.name || device.deviceType,
          status: device.status,
          children: addChildren(device.id),
        }));
    };

    tree.children[0].children = rootDevices.map((device) => ({
      name: device.name,
      deviceId: device.deviceId,
      type: device.deviceType?.name || device.deviceType,
      status: device.status,
      children: addChildren(device.id),
    }));

    return tree;
  };

  const renderTree = (node, level = 0) => {
    const isGrid = node.isGrid;
    const isPlant = node.isPlant;
    const isDevice = !isGrid && !isPlant;

    return (
      <Box key={`${level}-${node.deviceId}`} sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            ml: level * 4,
            py: 1.5,
            px: 2,
            backgroundColor: isGrid
              ? 'success.light'
              : isPlant
              ? 'primary.light'
              : 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: isGrid || isPlant ? 2 : 1,
          }}
        >
          {isDevice && <ChildIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          {isPlant && <TreeIcon sx={{ mr: 1, color: 'white' }} />}
          {isGrid && <GridIcon sx={{ mr: 1, color: 'white' }} />}

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: isGrid || isPlant ? 'white' : 'primary.main',
                  fontFamily: 'monospace',
                  fontSize: isGrid || isPlant ? '0.9rem' : '0.85rem',
                }}
              >
                {node.deviceId}
              </Typography>
              <Typography
                variant={isGrid || isPlant ? 'h6' : 'body1'}
                sx={{
                  fontWeight: isGrid || isPlant ? 'bold' : 'medium',
                  color: isGrid || isPlant ? 'white' : 'text.primary',
                }}
              >
                {node.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: isGrid || isPlant ? 'white' : 'text.secondary' }}
              >
                {node.type}
              </Typography>
              {node.capacity && (
                <Typography
                  variant="caption"
                  sx={{ color: 'white', fontWeight: 'bold' }}
                >
                  • {node.capacity} kW
                </Typography>
              )}
            </Box>
          </Box>

          {node.status && (
            <Chip
              label={node.status}
              size="small"
              color={node.status === 'ONLINE' || node.status === 'ACTIVE' ? 'success' : 'default'}
              sx={{ ml: 2 }}
            />
          )}

          {node.children && node.children.length > 0 && (
            <Chip
              label={`${node.children.length} device${node.children.length > 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
              sx={{
                ml: 1,
                color: isGrid || isPlant ? 'white' : 'inherit',
                borderColor: isGrid || isPlant ? 'white' : 'inherit',
              }}
            />
          )}
        </Box>
        {node.children && node.children.length > 0 && (
          <Box>{node.children.map((child) => renderTree(child, level + 1))}</Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TreeIcon fontSize="large" />
          Device Hierarchy Viewer
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View the complete device hierarchy from Grid to individual devices
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            dispatch(clearPlantError());
            dispatch(clearDeviceError());
          }}
        >
          {error}
        </Alert>
      )}

      {/* Plant Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Plant
        </Typography>
        <TextField
          select
          fullWidth
          label="Plant"
          value={selectedPlant}
          onChange={(e) => setSelectedPlant(e.target.value)}
          disabled={loading}
          helperText="Choose a plant to view its device hierarchy"
        >
          <MenuItem value="">
            <em>Select a plant...</em>
          </MenuItem>
          {plants.map((plant) => (
            <MenuItem key={plant.id} value={plant.id}>
              {plant.plantId} - {plant.name} ({plant.capacity} kW)
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* Hierarchy Tree */}
      <Paper sx={{ p: 3, minHeight: '60vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : !selectedPlant ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <GridIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Plant Selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select a plant from the dropdown above to view its device hierarchy
            </Typography>
          </Box>
        ) : devices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <TreeIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Devices Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This plant doesn't have any devices yet. Add devices from the Plant Management page.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Hierarchy Tree
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<GridIcon />}
                  label="Grid (Root)"
                  color="success"
                  size="small"
                />
                <Chip
                  icon={<TreeIcon />}
                  label={`${selectedPlantData?.name || 'Plant'}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${devices.length} Total Devices`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>

            <Box sx={{ backgroundColor: 'background.default', p: 2, borderRadius: 1 }}>
              {renderTree(buildDeviceTree())}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default HierarchyBuilder;
