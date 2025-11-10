/**
 * Device Types Master Page
 * Manage device type definitions
 * Refactored to use Redux for state management
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  fetchTemplates,
  createTemplate as createTemplateAction,
  updateTemplate as updateTemplateAction,
  deleteTemplate as deleteTemplateAction,
  selectTemplates,
  selectTemplatesLoading,
  selectTemplatesError,
} from '../store/slices/templatesSlice';

const DeviceTypes = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const deviceTypes = useSelector(selectTemplates);
  const loading = useSelector(selectTemplatesLoading);
  const reduxError = useSelector(selectTemplatesError);

  // Local UI state
  const [success, setSuccess] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shortform: '',
    deviceType: 'OTHER',
    manufacturer: '',
    model: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchTemplates({ limit: 100 }));
  }, [dispatch]);

  const handleAdd = () => {
    setEditing(null);
    setFormData({
      name: '',
      shortform: '',
      deviceType: 'OTHER',
      manufacturer: '',
      model: '',
      description: '',
    });
    setDialog(true);
  };

  const handleEdit = (deviceType) => {
    setEditing(deviceType);
    setFormData({
      name: deviceType.name,
      shortform: deviceType.shortform,
      deviceType: deviceType.deviceType,
      manufacturer: deviceType.manufacturer || '',
      model: deviceType.model || '',
      description: deviceType.description || '',
    });
    setDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device type?')) {
      return;
    }

    try {
      await dispatch(deleteTemplateAction(id)).unwrap();
      setSuccess('Device type deleted successfully');
      dispatch(fetchTemplates({ limit: 100 }));
    } catch (err) {
      setSuccess('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'shortform' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async () => {
    setSuccess('');

    if (!formData.name || !formData.shortform) {
      setSuccess('Name and Shortform are required');
      return;
    }

    try {
      if (editing) {
        await dispatch(updateTemplateAction({ id: editing.id, templateData: formData })).unwrap();
        setSuccess('Device type updated successfully');
      } else {
        await dispatch(createTemplateAction(formData)).unwrap();
        setSuccess('Device type created successfully');
      }
      setDialog(false);
      dispatch(fetchTemplates({ limit: 100 }));
    } catch (err) {
      setSuccess('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Device Types Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Device Type
        </Button>
      </Box>

      {reduxError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {reduxError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Shortform</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Manufacturer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tags</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No device types found. Click "Add Device Type" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deviceTypes.map((dt) => (
                      <TableRow key={dt.id}>
                        <TableCell>{dt.name}</TableCell>
                        <TableCell>
                          <Chip label={dt.shortform} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{dt.deviceType}</TableCell>
                        <TableCell>{dt.manufacturer || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={dt.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={dt.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{dt._count?.tags || 0} tags</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEdit(dt)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(dt.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Device Type' : 'Add Device Type'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Device Type Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                helperText="E.g., Transformer 5MVA, Inverter 100kW"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Shortform"
                name="shortform"
                value={formData.shortform}
                onChange={handleChange}
                helperText="2-6 uppercase chars (e.g., TRF, INV)"
                inputProps={{
                  pattern: '[A-Z0-9]{2,6}',
                  maxLength: 6,
                  style: { textTransform: 'uppercase' },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Category"
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                SelectProps={{ native: true }}
              >
                <option value="TRANSFORMER">Transformer</option>
                <option value="INVERTER">Inverter</option>
                <option value="COMBINER_BOX">Combiner Box</option>
                <option value="WEATHER_STATION">Weather Station</option>
                <option value="METER">Meter</option>
                <option value="STRING">String</option>
                <option value="MODULE">Module</option>
                <option value="OTHER">Other</option>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceTypes;
