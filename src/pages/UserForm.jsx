/**
 * User Form Page
 * Create or edit a user (Admin only)
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
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  fetchUserById,
  createUser as createUserAction,
  updateUser as updateUserAction,
  selectCurrentUser,
  selectUsersLoading,
  selectUsersError,
  clearError,
  clearCurrentUser,
} from '../store/slices/usersSlice';
import { selectIsAdmin } from '../store/slices/authSlice';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = !!id;

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectCurrentUser);
  const loading = useSelector(selectUsersLoading);
  const reduxError = useSelector(selectUsersError);

  // Local form state (acceptable for forms)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'VIEWER',
    isActive: true,
  });

  // Load user data in edit mode using Redux
  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchUserById(id));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentUser());
    };
  }, [id, isEditMode, dispatch]);

  // Populate form when user data is loaded from Redux
  useEffect(() => {
    if (user && isEditMode) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: user.role || 'VIEWER',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    }
  }, [user, isEditMode]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation (only for create mode or if password is provided in edit mode)
    if (!isEditMode || formData.password) {
      if (!formData.password) {
        setError('Password is required');
        return false;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include password if provided
      if (formData.password) {
        payload.password = formData.password;
      }

      // Use Redux actions to create/update user
      if (isEditMode) {
        await dispatch(updateUserAction({ id, userData: payload })).unwrap();
      } else {
        await dispatch(createUserAction(payload)).unwrap();
      }

      navigate('/users');
    } catch (err) {
      setError(err || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return 0;

    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (formData.password.length >= 12) strength += 25;
    if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength += 12.5;

    return strength;
  };

  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'error';
    if (strength < 70) return 'warning';
    return 'success';
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/users')}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        <Typography variant="h4">
          {isEditMode ? 'Edit User' : 'Create New User'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {(error || reduxError) && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => {
            setError('');
            dispatch(clearError());
          }}
        >
          {error || reduxError}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Enter the user's full name"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="User's email address for login"
                />
              </Grid>

              {/* Password Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {isEditMode ? 'Change Password (Optional)' : 'Password'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required={!isEditMode}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={saving}
                  helperText={isEditMode ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {formData.password && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={getPasswordStrength()}
                        color={getPasswordStrengthColor()}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color={`${getPasswordStrengthColor()}.main`}>
                        {getPasswordStrengthLabel()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required={!isEditMode && formData.password}
                  type={showPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Re-enter the password"
                  error={formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword}
                />
              </Grid>

              {/* Role & Status */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Role & Access
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="User Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Select the user's access level"
                >
                  <MenuItem value="ADMIN">Admin - Full system access</MenuItem>
                  <MenuItem value="PLANT_MANAGER">Plant Manager - Manage assigned plants</MenuItem>
                  <MenuItem value="VIEWER">Viewer - Read-only access</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleChange}
                      name="isActive"
                      disabled={saving}
                    />
                  }
                  label={formData.isActive ? 'Active User' : 'Inactive User'}
                />
                <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                  {formData.isActive
                    ? 'User can log in and access the system'
                    : 'User account is disabled'}
                </Typography>
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/users')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserForm;
