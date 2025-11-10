/**
 * User Detail Page
 * View detailed information about a specific user (Admin only)
 * Refactored to use Redux for state management
 */

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PersonOutline as PersonIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon,
  SupervisorAccount as RoleIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
} from '@mui/icons-material';
import {
  fetchUserById,
  fetchUserPlants,
  updateUser,
  updateUserRole as updateUserRoleAction,
  assignUserPlants,
  toggleUserStatus,
  selectCurrentUser,
  selectUserPlants,
  selectUsersLoading,
  selectUsersError,
  clearError,
  clearCurrentUser,
} from '../store/slices/usersSlice';
import { fetchPlants, selectPlants } from '../store/slices/plantSlice';
import { selectIsAdmin } from '../store/slices/authSlice';

const InfoRow = ({ label, value, icon }) => (
  <Box sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
    {icon && <Box sx={{ color: 'text.secondary' }}>{icon}</Box>}
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500}>
        {value}
      </Typography>
    </Box>
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

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectCurrentUser);
  const userPlants = useSelector(selectUserPlants);
  const allPlants = useSelector(selectPlants);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);

  // Dialog states (UI-specific)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [plantsDialogOpen, setPlantsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Snackbar (UI-specific)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Fetch user data and plants
    dispatch(fetchUserById(id));
    dispatch(fetchUserPlants(id));

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentUser());
    };
  }, [id, dispatch]);

  // Update newRole when user is loaded
  useEffect(() => {
    if (user) {
      setNewRole(user.role);
    }
  }, [user]);

  const handleToggleActive = async () => {
    try {
      await dispatch(toggleUserStatus(id)).unwrap();
      setSnackbar({
        open: true,
        message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
        severity: 'success',
      });
      // Refresh user data
      dispatch(fetchUserById(id));
      dispatch(fetchUserPlants(id));
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || 'Failed to update user status',
        severity: 'error',
      });
    }
  };

  const handleOpenRoleDialog = () => {
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
  };

  const handleUpdateRole = async () => {
    try {
      setDialogLoading(true);
      await dispatch(updateUserRoleAction({ userId: id, role: newRole })).unwrap();
      setSnackbar({
        open: true,
        message: 'User role updated successfully',
        severity: 'success',
      });
      setRoleDialogOpen(false);
      // Refresh user data
      dispatch(fetchUserById(id));
      dispatch(fetchUserPlants(id));
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || 'Failed to update user role',
        severity: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleOpenPlantsDialog = async () => {
    try {
      setDialogLoading(true);
      setPlantsDialogOpen(true);

      // Fetch all plants using Redux
      await dispatch(fetchPlants({ page: 1, limit: 1000 })).unwrap();
      setSelectedPlants(userPlants.map((p) => p.id));
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || 'Failed to load plants',
        severity: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleClosePlantsDialog = () => {
    setPlantsDialogOpen(false);
  };

  const handleTogglePlant = (plantId) => {
    setSelectedPlants((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId]
    );
  };

  const handleAssignPlants = async () => {
    try {
      setDialogLoading(true);
      await dispatch(assignUserPlants({ userId: id, plantIds: selectedPlants })).unwrap();
      setSnackbar({
        open: true,
        message: 'Plants assigned successfully',
        severity: 'success',
      });
      setPlantsDialogOpen(false);
      // Refresh user data
      dispatch(fetchUserById(id));
      dispatch(fetchUserPlants(id));
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || 'Failed to assign plants',
        severity: 'error',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="error">
        You do not have permission to access this page. Admin role required.
      </Alert>
    );
  }

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

  if (!user) {
    return <Alert severity="warning">User not found</Alert>;
  }

  const roleColors = {
    ADMIN: 'error',
    PLANT_MANAGER: 'primary',
    VIEWER: 'default',
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/users')}
            sx={{ mb: 2 }}
          >
            Back to Users
          </Button>
          <Typography variant="h4" gutterBottom>
            {user.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={user.role.replace('_', ' ')}
              color={roleColors[user.role]}
            />
            <Chip
              label={user.isActive ? 'Active' : 'Inactive'}
              color={user.isActive ? 'success' : 'default'}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={user.isActive ? <DeactivateIcon /> : <ActivateIcon />}
            onClick={handleToggleActive}
            color={user.isActive ? 'error' : 'success'}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/users/${id}/edit`)}
          >
            Edit User
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<BusinessIcon sx={{ fontSize: 32 }} />}
            title="Assigned Plants"
            value={userPlants.length}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<PersonIcon sx={{ fontSize: 32 }} />}
            title="Created Alarms"
            value={user._count?.createdAlarms || 0}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<TimeIcon sx={{ fontSize: 32 }} />}
            title="Last Login"
            value={user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* User Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <InfoRow
                label="Full Name"
                value={user.name}
                icon={<PersonIcon fontSize="small" />}
              />
              <InfoRow
                label="Email Address"
                value={user.email}
                icon={<EmailIcon fontSize="small" />}
              />
              <InfoRow
                label="Role"
                value={user.role.replace('_', ' ')}
                icon={<RoleIcon fontSize="small" />}
              />
              <InfoRow
                label="Status"
                value={user.isActive ? 'Active' : 'Inactive'}
                icon={user.isActive ? <ActivateIcon fontSize="small" /> : <DeactivateIcon fontSize="small" />}
              />
              <InfoRow
                label="Last Login"
                value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
                icon={<TimeIcon fontSize="small" />}
              />
              <InfoRow
                label="Created At"
                value={new Date(user.createdAt).toLocaleDateString()}
              />
              <InfoRow
                label="Last Updated"
                value={new Date(user.updatedAt).toLocaleDateString()}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Role Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Role & Permissions
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleOpenRoleDialog}
                >
                  Change Role
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" color="text.secondary" paragraph>
                Current Role: <strong>{user.role.replace('_', ' ')}</strong>
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Role Permissions:
                </Typography>
                {user.role === 'ADMIN' && (
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Full system access" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage all users" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Manage all plants and devices" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="View and manage all alarms" />
                    </ListItem>
                  </List>
                )}
                {user.role === 'PLANT_MANAGER' && (
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Manage assigned plants" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Add and edit devices" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="View and acknowledge alarms" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Generate reports" />
                    </ListItem>
                  </List>
                )}
                {user.role === 'VIEWER' && (
                  <List dense>
                    <ListItem>
                      <ListItemText primary="View assigned plants" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="View devices and data" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="View alarms (read-only)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="View reports" />
                    </ListItem>
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Assigned Plants */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Assigned Plants ({userPlants.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleOpenPlantsDialog}
                >
                  Assign Plants
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {userPlants.length > 0 ? (
                <Grid container spacing={2}>
                  {userPlants.map((plant) => (
                    <Grid item xs={12} sm={6} md={4} key={plant.id}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {plant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plant.location?.address || 'No address'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Chip
                            label={plant.status}
                            size="small"
                            color={plant.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                          <Chip
                            label={`${(plant.capacity / 1000).toFixed(1)} MW`}
                            size="small"
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No plants assigned to this user
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a new role for {user.name}. This will change their access permissions.
          </Typography>
          <TextField
            fullWidth
            select
            label="User Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            disabled={dialogLoading}
          >
            <MenuItem value="ADMIN">Admin - Full system access</MenuItem>
            <MenuItem value="PLANT_MANAGER">Plant Manager - Manage assigned plants</MenuItem>
            <MenuItem value="VIEWER">Viewer - Read-only access</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={dialogLoading || newRole === user.role}
          >
            {dialogLoading ? <CircularProgress size={24} /> : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Plants Dialog */}
      <Dialog open={plantsDialogOpen} onClose={handleClosePlantsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Assign Plants to {user.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the plants that this user can access and manage.
          </Typography>

          {dialogLoading && allPlants.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {allPlants.map((plant) => (
                <FormControlLabel
                  key={plant.id}
                  control={
                    <Checkbox
                      checked={selectedPlants.includes(plant.id)}
                      onChange={() => handleTogglePlant(plant.id)}
                      disabled={dialogLoading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{plant.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {plant.location?.address} • {(plant.capacity / 1000).toFixed(1)} MW
                      </Typography>
                    </Box>
                  }
                  sx={{ display: 'flex', width: '100%', mb: 1 }}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlantsDialog} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignPlants}
            variant="contained"
            disabled={dialogLoading}
          >
            {dialogLoading ? <CircularProgress size={24} /> : `Assign ${selectedPlants.length} Plants`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserDetail;
