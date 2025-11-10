/**
 * Plants List Page
 * View and manage all plants
 * Refactored to use Redux for state management
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  fetchPlants,
  deletePlant,
  selectPlants,
  selectPlantsPagination,
  selectPlantsFilters,
  selectPlantsLoading,
  selectPlantsError,
  setFilters,
  setPagination,
  clearError,
} from '../store/slices/plantSlice';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';

const statusColors = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  MAINTENANCE: 'warning',
  OFFLINE: 'error',
};

const Plants = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);
  const plants = useSelector(selectPlants);
  const pagination = useSelector(selectPlantsPagination);
  const filters = useSelector(selectPlantsFilters);
  const loading = useSelector(selectPlantsLoading);
  const error = useSelector(selectPlantsError);

  const canModify = isAdmin || isPlantManager;

  // Load plants when component mounts or filters/pagination change
  useEffect(() => {
    loadPlants();
  }, [pagination.page, pagination.limit, filters.status]);

  const loadPlants = () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.status && { status: filters.status }),
    };

    dispatch(fetchPlants(params));
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

  const handleStatusFilterChange = (event) => {
    dispatch(setFilters({ status: event.target.value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleRefresh = () => {
    dispatch(clearError());
    loadPlants();
  };

  const handleDelete = async (plantId, plantName) => {
    if (!window.confirm(`Are you sure you want to delete "${plantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dispatch(deletePlant(plantId)).unwrap();
      loadPlants(); // Refresh the list
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography variant="h4" gutterBottom>
            Solar Plants
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage solar plants and their configurations
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
          {canModify && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/plants/new')}
            >
              Add Plant
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={handleStatusFilterChange}
                size="small"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="OFFLINE">Offline</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Plants Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : plants.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No plants found
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Capacity (MW)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Devices</TableCell>
                      <TableCell>Alarms</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plants.map((plant) => (
                      <TableRow key={plant.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {plant.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {plant.location?.address || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {(plant.capacity / 1000).toFixed(1)} MW
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={plant.status}
                            color={statusColors[plant.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{plant._count?.devices || 0}</TableCell>
                        <TableCell>
                          {plant._count?.alarms > 0 ? (
                            <Chip
                              label={plant._count.alarms}
                              color="error"
                              size="small"
                            />
                          ) : (
                            '0'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/plants/${plant.id}`)}
                            title="View details"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          {canModify && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/plants/${plant.id}/edit`)}
                                title="Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              {isAdmin && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(plant.id, plant.name)}
                                  title="Delete"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default Plants;
