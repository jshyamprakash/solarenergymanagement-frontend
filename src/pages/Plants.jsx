/**
 * Plants List Page
 * View and manage all plants
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getAllPlants, deletePlant } from '../services/plantService';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';

const statusColors = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  MAINTENANCE: 'warning',
  OFFLINE: 'error',
};

const Plants = () => {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);

  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPlants();
  }, [page, rowsPerPage, statusFilter]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        ...(statusFilter && { status: statusFilter }),
      };

      const data = await getAllPlants(params);
      setPlants(data.plants || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load plants');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (plantId, plantName) => {
    if (!window.confirm(`Are you sure you want to delete "${plantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePlant(plantId);
      loadPlants();
    } catch (err) {
      setError(err.message || 'Failed to delete plant');
    }
  };

  const canModify = isAdmin || isPlantManager;

  if (loading && plants.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Solar Plants</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton onClick={loadPlants} disabled={loading}>
            <RefreshIcon />
          </IconButton>
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
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Plants Table */}
      <Card>
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
              {plants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      No plants found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
};

export default Plants;
