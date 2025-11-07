/**
 * Devices List Page
 * Displays all devices with table, filters, and pagination
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { getAllDevices, deleteDevice } from '../services/deviceService';
import { getAllPlants } from '../services/plantService';
import { useSelector } from 'react-redux';
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
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);

  const [devices, setDevices] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [plantFilter, setPlantFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load plants for filter
  useEffect(() => {
    const loadPlants = async () => {
      try {
        const data = await getAllPlants();
        setPlants(data.plants || []);
      } catch (err) {
        console.error('Error loading plants:', err);
      }
    };
    loadPlants();
  }, []);

  // Load devices
  useEffect(() => {
    loadDevices();
  }, [page, rowsPerPage, plantFilter, typeFilter, statusFilter]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(plantFilter && { plantId: plantFilter }),
        ...(typeFilter && { deviceType: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      };

      const data = await getAllDevices(params);
      setDevices(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      await deleteDevice(id);
      loadDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
      alert(err.response?.data?.message || 'Failed to delete device');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleResetFilters = () => {
    setPlantFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const getDeviceTypeIcon = (type) => {
    return <DeviceIcon fontSize="small" />;
  };

  if (loading && devices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeviceIcon fontSize="large" />
          Devices
        </Typography>
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
              value={plantFilter}
              onChange={(e) => setPlantFilter(e.target.value)}
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
};

export default Devices;
