/**
 * Devices List Page
 * Displays all devices with table, filters, and pagination
 * Refactored to use Redux for state management
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Typography,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DevicesOther as DeviceIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  fetchDevices,
  deleteDevice,
  selectDevices,
  selectDevicesPagination,
  selectDevicesFilters,
  selectDevicesLoading,
  selectDevicesError,
  setFilters,
  setPagination,
  clearError,
} from '../store/slices/deviceSlice';
import {
  fetchPlants,
  selectPlants,
} from '../store/slices/plantSlice';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';

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

const STATUS_COLORS = {
  ONLINE: 'success',
  OFFLINE: 'error',
  MAINTENANCE: 'warning',
  ERROR: 'error',
};

const Devices = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);
  const devices = useSelector(selectDevices);
  const plants = useSelector(selectPlants);
  const pagination = useSelector(selectDevicesPagination);
  const filters = useSelector(selectDevicesFilters);
  const loading = useSelector(selectDevicesLoading);
  const error = useSelector(selectDevicesError);

  // Load plants for filter dropdown (on mount only)
  useEffect(() => {
    dispatch(fetchPlants({ page: 1, limit: 1000 })); // Load all plants for filter
  }, []);

  // Load devices when component mounts or filters/pagination change
  useEffect(() => {
    loadDevices();
  }, [pagination.page, pagination.limit, filters.plantId, filters.deviceType, filters.status]);

  const loadDevices = () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.plantId && { plantId: filters.plantId }),
      ...(filters.deviceType && { deviceType: filters.deviceType }),
      ...(filters.status && { status: filters.status }),
    };

    dispatch(fetchDevices(params));
  };

  const handleChangePage = (_event, newPage) => {
    dispatch(setPagination({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch(setPagination({
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handlePlantFilterChange = (event) => {
    dispatch(setFilters({ plantId: event.target.value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleTypeFilterChange = (event) => {
    dispatch(setFilters({ deviceType: event.target.value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleStatusFilterChange = (event) => {
    dispatch(setFilters({ status: event.target.value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleResetFilters = () => {
    dispatch(setFilters({ plantId: '', deviceType: '', status: '', search: '' }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleRefresh = () => {
    dispatch(clearError());
    loadDevices();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      await dispatch(deleteDevice(id)).unwrap();
      loadDevices(); // Refresh the list
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const getDeviceTypeIcon = (type) => {
    return <DeviceIcon fontSize="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }} gutterBottom>
            <DeviceIcon fontSize="large" />
            Devices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage devices across all solar plants
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          {(isAdmin || isPlantManager) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/devices/new')}
            >
              Add Device
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Plant"
              value={filters.plantId}
              onChange={handlePlantFilterChange}
              size="small"
            >
              <MenuItem value="">All Plants</MenuItem>
              {plants.map((plant) => (
                <MenuItem key={plant.id} value={plant.id}>
                  {plant.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Device Type"
              value={filters.deviceType}
              onChange={handleTypeFilterChange}
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              {DEVICE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filters.status}
              onChange={handleStatusFilterChange}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {DEVICE_STATUS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              sx={{ height: '40px' }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Plant</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Communication</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No devices found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getDeviceTypeIcon(device.deviceType)}
                          {device.name}
                        </Box>
                      </TableCell>
                      <TableCell>{device.plant?.name || 'N/A'}</TableCell>
                      <TableCell>{device.deviceType.replace('_', ' ')}</TableCell>
                      <TableCell>{device.manufacturer || 'N/A'}</TableCell>
                      <TableCell>{device.serialNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={device.status}
                          color={STATUS_COLORS[device.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {device.lastCommunication
                          ? new Date(device.lastCommunication).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/devices/${device.id}`)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        {(isAdmin || isPlantManager) && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/devices/${device.id}/edit`)}
                              title="Edit"
                            >
                              <EditIcon />
                            </IconButton>
                            {isAdmin && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(device.id)}
                                title="Delete"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.limit}
              page={pagination.page - 1}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>
    </Box>
  );
};

export default Devices;
