/**
 * User Plant Management Component
 * Allows admins to assign users to plants
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  People as PeopleIcon,
  Factory as PlantIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const UserPlantManagement = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  const [plants, setPlants] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [plantUsers, setPlantUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  
  // Snackbar State (UI-specific)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch all plants
  const fetchPlants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/plants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === 'success') {
        setPlants(data.data.plants);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
      showSnackbar('Failed to fetch plants', 'error');
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === 'success') {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to fetch users', 'error');
    }
  };

  // Fetch users for selected plant
  const fetchPlantUsers = async (plantId) => {
    if (!plantId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user-plant-map/plant/${plantId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPlantUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching plant users:', error);
      showSnackbar('Failed to fetch plant users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unassigned users for selected plant
  const fetchUnassignedUsers = async (plantId) => {
    if (!plantId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user-plant-map/plant/${plantId}/unassigned-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUnassignedUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching unassigned users:', error);
      showSnackbar('Failed to fetch unassigned users', 'error');
    }
  };

  // Assign users to plant
  const assignUsersToPlant = async () => {
    if (!selectedPlant || selectedUsers.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-plant-map/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignments: selectedUsers.map(userId => ({
            userId,
            plantId: parseInt(selectedPlant)
          }))
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSnackbar(`Successfully assigned ${selectedUsers.length} users to plant`);
        setAssignDialogOpen(false);
        setSelectedUsers([]);
        fetchPlantUsers(selectedPlant);
        fetchUnassignedUsers(selectedPlant);
      } else {
        showSnackbar(data.message || 'Failed to assign users', 'error');
      }
    } catch (error) {
      console.error('Error assigning users:', error);
      showSnackbar('Failed to assign users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Remove user from plant
  const removeUserFromPlant = async (userId, plantId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-plant-map/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          plantId
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSnackbar('User removed from plant successfully');
        fetchPlantUsers(plantId);
        fetchUnassignedUsers(plantId);
      } else {
        showSnackbar(data.message || 'Failed to remove user', 'error');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      showSnackbar('Failed to remove user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle plant selection
  const handlePlantChange = (plantId) => {
    setSelectedPlant(plantId);
    if (plantId) {
      fetchPlantUsers(plantId);
      fetchUnassignedUsers(plantId);
    } else {
      setPlantUsers([]);
      setUnassignedUsers([]);
    }
  };

  useEffect(() => {
    fetchPlants();
    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'PLANT_MANAGER': return 'warning';
      case 'VIEWER': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User-Plant Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Assign users to plants to control access permissions. Admin users have access to all plants.
      </Typography>

      {/* Plant Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Plant</InputLabel>
                <Select
                  value={selectedPlant}
                  label="Select Plant"
                  onChange={(e) => handlePlantChange(e.target.value)}
                >
                  {plants.map((plant) => (
                    <MenuItem key={plant.id} value={plant.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlantIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2">{plant.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {plant.capacity} kW • {plant._count?.devices || 0} devices
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAssignDialogOpen(true)}
                  disabled={!selectedPlant || unassignedUsers.length === 0}
                >
                  Assign Users
                </Button>
                <Chip 
                  label={`${plantUsers.length} users assigned`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedPlant && (
        <Grid container spacing={3}>
          {/* Assigned Users */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Assigned Users
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plantUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {user.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role} 
                              size="small" 
                              color={getRoleColor(user.role)}
                            />
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell align="right">
                            {currentUser.role === 'ADMIN' && user.role !== 'ADMIN' && (
                              <Tooltip title="Remove from plant">
                                <IconButton
                                  color="error"
                                  onClick={() => removeUserFromPlant(user.id, selectedPlant)}
                                  disabled={loading}
                                >
                                  <RemoveIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {plantUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No users assigned to this plant
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Plant Info */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Plant Information
                </Typography>
                {plants.find(p => p.id === parseInt(selectedPlant)) && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Name:</strong> {plants.find(p => p.id === parseInt(selectedPlant))?.name}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Capacity:</strong> {plants.find(p => p.id === parseInt(selectedPlant))?.capacity} kW
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Devices:</strong> {plants.find(p => p.id === parseInt(selectedPlant))?._count?.devices || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Assigned Users:</strong> {plantUsers.length}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Available Users:</strong> {unassignedUsers.length}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Assign Users Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Users to Plant</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select users to assign to this plant:
          </Typography>
          {unassignedUsers.map((user) => (
            <Box key={user.id} sx={{ mb: 1 }}>
              <Button
                fullWidth
                variant={selectedUsers.includes(user.id) ? "contained" : "outlined"}
                onClick={() => {
                  if (selectedUsers.includes(user.id)) {
                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                  } else {
                    setSelectedUsers([...selectedUsers, user.id]);
                  }
                }}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                    <Typography variant="body2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                  <Chip label={user.role} size="small" color={getRoleColor(user.role)} />
                </Box>
              </Button>
            </Box>
          ))}
          {unassignedUsers.length === 0 && (
            <Alert severity="info">
              All users are already assigned to this plant.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={assignUsersToPlant} 
            variant="contained"
            disabled={selectedUsers.length === 0 || loading}
          >
            Assign {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPlantManagement;