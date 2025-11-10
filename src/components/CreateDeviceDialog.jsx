/**
 * Create Device Dialog Component
 * Dialog for creating a new device from a template
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getAllTemplates } from '../services/templateService';
import { createDeviceFromTemplate } from '../services/deviceService';

const CreateDeviceDialog = ({ open, onClose, plantId, parentDeviceId = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    description: '',
    status: 'ONLINE',
  });

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllTemplates({ isActive: true, limit: 100 });
      setTemplates(data.data || []);
    } catch (err) {
      setError('Failed to load device templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template);

    // Auto-fill manufacturer and model from template if available
    if (template) {
      setFormData((prev) => ({
        ...prev,
        manufacturer: template.manufacturer || prev.manufacturer,
        model: template.model || prev.model,
        name: prev.name || `${template.name} 1`,
      }));
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

    if (!selectedTemplate) {
      setError('Please select a device template');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        plantId,
        templateId: selectedTemplate.id,
        parentDeviceId,
        name: formData.name,
        serialNumber: formData.serialNumber || undefined,
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        description: formData.description || undefined,
        status: formData.status,
      };

      const newDevice = await createDeviceFromTemplate(payload);

      if (onSuccess) {
        onSuccess(newDevice);
      }

      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create device');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      description: '',
      status: 'ONLINE',
    });
    setSelectedTemplate(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Device</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Template Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Device Template *
              </Typography>
              <TextField
                fullWidth
                select
                value={selectedTemplate?.id || ''}
                onChange={handleTemplateChange}
                disabled={loading}
                required
                helperText="Select the type of device to create"
              >
                <MenuItem value="" disabled>
                  Select a template...
                </MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{template.name}</Typography>
                      <Chip
                        label={template.shortform}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({template.deviceType})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Template Info */}
            {selectedTemplate && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<InfoIcon />}>
                  <Typography variant="body2">
                    <strong>Device ID:</strong> Will be auto-generated as{' '}
                    <code>{selectedTemplate.shortform}_X</code>
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tags:</strong> {selectedTemplate._count?.tags || 0} measurement tags
                    will be created automatically
                  </Typography>
                  <Typography variant="body2">
                    <strong>MQTT Topic:</strong> Will be auto-generated based on plant base topic
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Device Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Device Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                helperText="Enter a descriptive name for the device"
              />
            </Grid>

            {/* Serial Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                disabled={loading}
                helperText="Optional device serial number"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                required
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="ONLINE">Online</MenuItem>
                <MenuItem value="OFFLINE">Offline</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
              </TextField>
            </Grid>

            {/* Manufacturer */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                disabled={loading}
                helperText="Device manufacturer"
              />
            </Grid>

            {/* Model */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={loading}
                helperText="Device model number"
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                multiline
                rows={2}
                helperText="Optional description"
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedTemplate}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? 'Creating...' : 'Create Device'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateDeviceDialog;
