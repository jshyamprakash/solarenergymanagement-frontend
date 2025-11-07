/**
 * Plant Form Page
 * Create or edit a plant
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { getPlantById, createPlant, updatePlant } from '../services/plantService';

const PlantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
    installationDate: '',
    lat: '',
    lng: '',
    address: '',
  });

  useEffect(() => {
    if (isEditMode) {
      loadPlant();
    }
  }, [id]);

  const loadPlant = async () => {
    try {
      setLoading(true);
      const plant = await getPlantById(id);

      setFormData({
        name: plant.name || '',
        capacity: plant.capacity || '',
        status: plant.status || 'ACTIVE',
        timezone: plant.timezone || 'Asia/Kolkata',
        installationDate: plant.installationDate
          ? new Date(plant.installationDate).toISOString().split('T')[0]
          : '',
        lat: plant.location?.lat || '',
        lng: plant.location?.lng || '',
        address: plant.location?.address || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load plant');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        capacity: parseFloat(formData.capacity),
        status: formData.status,
        timezone: formData.timezone,
        ...(formData.installationDate && {
          installationDate: new Date(formData.installationDate).toISOString(),
        }),
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address,
        },
      };

      if (isEditMode) {
        await updatePlant(id, payload);
      } else {
        await createPlant(payload);
      }

      navigate('/plants');
    } catch (err) {
      setError(err.message || 'Failed to save plant');
    } finally {
      setSaving(false);
    }
  };

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
          onClick={() => navigate('/plants')}
          sx={{ mb: 2 }}
        >
          Back to Plants
        </Button>
        <Typography variant="h4">
          {isEditMode ? 'Edit Plant' : 'Create New Plant'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
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
                  label="Plant Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Enter a unique name for the plant"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Capacity (kW)"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Total capacity in kilowatts"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="OFFLINE">Offline</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Installation Date"
                  name="installationDate"
                  type="date"
                  value={formData.installationDate}
                  onChange={handleChange}
                  disabled={saving}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                  <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                </TextField>
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Location
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Full address of the plant"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Latitude"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Latitude coordinate (-90 to 90)"
                  inputProps={{ min: -90, max: 90, step: 0.0001 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Longitude"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Longitude coordinate (-180 to 180)"
                  inputProps={{ min: -180, max: 180, step: 0.0001 }}
                />
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/plants')}
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
                    {saving ? 'Saving...' : isEditMode ? 'Update Plant' : 'Create Plant'}
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

export default PlantForm;
