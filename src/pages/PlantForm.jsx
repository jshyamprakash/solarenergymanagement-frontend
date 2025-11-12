/**
 * Plant Form Page - Multi-Step Wizard
 * Create a plant with device hierarchy setup
 * Refactored to use Redux for plant operations
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
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AccountTree as TreeIcon,
  SubdirectoryArrowRight as ChildIcon,
} from '@mui/icons-material';
import {
  fetchPlantById,
  createPlant as createPlantAction,
  updatePlant as updatePlantAction,
  selectCurrentPlant,
  selectPlantsLoading,
  selectPlantsError,
  clearError,
  clearCurrentPlant,
} from '../store/slices/plantSlice';
import {
  fetchTemplates,
  fetchTemplateById,
  selectTemplates,
} from '../store/slices/templatesSlice';

const STEPS = ['Plant Details', 'Device Hierarchy', 'Review & Submit'];

const PlantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = !!id;

  // Redux selectors
  const plant = useSelector(selectCurrentPlant);
  const templates = useSelector(selectTemplates);
  const loading = useSelector(selectPlantsLoading);
  const reduxError = useSelector(selectPlantsError);

  // Local form state
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Plant Details (Step 1) - Form input state
  const [plantData, setPlantData] = useState({
    name: '',
    plantId: '',
    mqttBaseTopic: '',
    capacity: '',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
    installationDate: '',
    lat: '',
    lng: '',
    address: '',
  });

  // Device Hierarchy (Step 2) - Form input state
  const [devices, setDevices] = useState([]);
  const [deviceDialog, setDeviceDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({
    templateId: '',
    name: '',
    parentDeviceId: null,
    serialNumber: '',
    status: 'ONLINE',
    selectedTags: [], // Array of tag IDs to include
  });
  const [availableTags, setAvailableTags] = useState([]);

  // Load plant data in edit mode using Redux
  useEffect(() => {
    // Clear any stale plant data first
    dispatch(clearCurrentPlant());

    if (isEditMode) {
      dispatch(fetchPlantById({ id, includeDevices: true }));
    }
    // Always load templates for device hierarchy step
    dispatch(fetchTemplates({ isActive: true, limit: 100 }));

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentPlant());
    };
  }, [id, dispatch, isEditMode]);

  // Populate form when plant data is loaded from Redux
  useEffect(() => {
    if (plant && isEditMode) {
      console.log('Loading plant data:', plant);
      console.log('Plant devices:', plant.devices);

      setPlantData({
        name: plant.name || '',
        plantId: plant.plantId || '',
        mqttBaseTopic: plant.mqttBaseTopic || '',
        capacity: plant.capacity || '',
        status: plant.status || 'ACTIVE',
        timezone: plant.timezone || 'Asia/Kolkata',
        installationDate: plant.installationDate
          ? new Date(plant.installationDate).toISOString().split('T')[0]
          : '',
        lat: plant.location?.lat || plant.location?.latitude || '',
        lng: plant.location?.lng || plant.location?.longitude || '',
        address: plant.location?.address || '',
      });

      // Load existing devices if any
      if (plant.devices && plant.devices.length > 0) {
        console.log('Loading devices from plant:', plant.devices);
        const loadedDevices = plant.devices.map((device, index) => {
          // Find parent device index in the devices array
          let parentDeviceId = 'PLANT';
          if (device.parentDeviceId) {
            const parentIndex = plant.devices.findIndex((d) => d.id === device.parentDeviceId);
            parentDeviceId = parentIndex >= 0 ? parentIndex.toString() : 'PLANT';
          }

          return {
            templateId: device.template?.id || device.templateId,
            name: device.name,
            deviceId: device.deviceId,
            templateName: device.template?.name || device.deviceType,
            templateShortform: device.template?.shortform || '',
            parentDeviceId,
            serialNumber: device.serialNumber || '',
            status: device.status,
            selectedTags: device.tags?.map((tag) => tag.templateTagId).filter(Boolean) || [],
          };
        });
        console.log('Loaded devices:', loadedDevices);
        setDevices(loadedDevices);
      } else {
        console.log('No devices found in plant data');
        setDevices([]); // Clear devices if plant has none
      }
    }
  }, [plant, isEditMode]);

  const handlePlantChange = (e) => {
    const { name, value } = e.target;
    setPlantData((prev) => ({
      ...prev,
      [name]: name === 'plantId' ? value.toUpperCase() : value,
    }));
  };

  const handleNext = () => {
    setError('');

    // Validate current step before proceeding
    if (activeStep === 0) {
      const missingFields = [];
      if (!plantData.name) missingFields.push('Plant Name');
      if (!plantData.plantId) missingFields.push('Plant ID');
      if (!plantData.mqttBaseTopic) missingFields.push('MQTT Base Topic');
      if (!plantData.capacity) missingFields.push('Capacity');
      if (!plantData.address) missingFields.push('Address');
      if (!plantData.lat) missingFields.push('Latitude');
      if (!plantData.lng) missingFields.push('Longitude');

      if (missingFields.length > 0) {
        setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setDeviceForm({
      templateId: '',
      name: '',
      parentDeviceId: 'PLANT', // Default to plant as parent
      serialNumber: '',
      status: 'ONLINE',
      selectedTags: [],
    });
    setAvailableTags([]);
    setDeviceDialog(true);
  };

  const handleEditDevice = async (index) => {
    const device = devices[index];
    setEditingDevice(index);
    setDeviceForm(device);

    // Load tags for the selected template
    try {
      const fullTemplate = await dispatch(fetchTemplateById(device.templateId)).unwrap();
      setAvailableTags(fullTemplate.tags || []);
    } catch (err) {
      console.error('Failed to load template tags:', err);
      setAvailableTags([]);
    }

    setDeviceDialog(true);
  };

  const handleDeleteDevice = (index) => {
    const deviceToDelete = devices[index];

    // Check if any device has this device as parent
    const hasChildren = devices.some((d, i) => i !== index && d.parentDeviceId === index);

    if (hasChildren) {
      const confirmDelete = window.confirm(
        `"${deviceToDelete.name}" has child devices. Deleting this device will also remove its children. Do you want to continue?`
      );
      if (!confirmDelete) return;

      // Collect all indices to remove (device and its descendants)
      const collectDescendants = (parentIdx) => {
        const children = devices
          .map((d, i) => ({ device: d, index: i }))
          .filter(({ device }) => device.parentDeviceId === parentIdx)
          .map(({ index: idx }) => idx);

        return [parentIdx, ...children.flatMap(childIdx => collectDescendants(childIdx))];
      };

      const indicesToRemove = new Set(collectDescendants(index));

      // Filter out removed devices and update parent indices
      setDevices((prev) => {
        const filteredDevices = prev.filter((_, i) => !indicesToRemove.has(i));

        // Update parent device indices for remaining devices
        return filteredDevices.map((device) => {
          if (device.parentDeviceId === 'PLANT' || device.parentDeviceId === null || device.parentDeviceId === '') {
            return device;
          }

          const oldParentIndex = parseInt(device.parentDeviceId);
          // Count how many devices with lower indices were removed
          const removedBefore = Array.from(indicesToRemove).filter(idx => idx < oldParentIndex).length;
          const newParentIndex = oldParentIndex - removedBefore;

          return {
            ...device,
            parentDeviceId: newParentIndex,
          };
        });
      });
    } else {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${deviceToDelete.name}"?`
      );
      if (!confirmDelete) return;

      // Remove device and update parent indices
      setDevices((prev) => {
        const filteredDevices = prev.filter((_, i) => i !== index);

        // Update parent device indices for remaining devices
        return filteredDevices.map((device) => {
          if (device.parentDeviceId === 'PLANT' || device.parentDeviceId === null || device.parentDeviceId === '') {
            return device;
          }

          const oldParentIndex = parseInt(device.parentDeviceId);
          // If parent index is greater than deleted index, decrement it
          const newParentIndex = oldParentIndex > index ? oldParentIndex - 1 : oldParentIndex;

          return {
            ...device,
            parentDeviceId: newParentIndex,
          };
        });
      });
    }
  };

  const handleDeviceFormChange = async (e) => {
    const { name, value } = e.target;
    setDeviceForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill name and load tags when template is selected
    if (name === 'templateId' && value) {
      const template = templates.find((t) => t.id === value);
      if (template && !deviceForm.name) {
        setDeviceForm((prev) => ({
          ...prev,
          name: `${template.name} 1`,
        }));
      }

      // Load template tags
      try {
        const fullTemplate = await dispatch(fetchTemplateById(value)).unwrap();
        setAvailableTags(fullTemplate.tags || []);
        // Auto-select all tags by default
        setDeviceForm((prev) => ({
          ...prev,
          selectedTags: (fullTemplate.tags || []).map((t) => t.id),
        }));
      } catch (err) {
        console.error('Failed to load template tags:', err);
      }
    }
  };

  const handleTagToggle = (tagId) => {
    setDeviceForm((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((id) => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  const handleSaveDevice = () => {
    if (!deviceForm.templateId || !deviceForm.name) {
      setError('Please select a template and enter device name');
      return;
    }

    // Parent is now always mandatory (can be plant or another device)
    if (deviceForm.parentDeviceId === null || deviceForm.parentDeviceId === '') {
      setError('Parent is required. Please select the plant or a parent device.');
      return;
    }

    const selectedTemplate = templates.find((t) => t.id === deviceForm.templateId);

    // Generate device ID if adding new device (not editing)
    let generatedDeviceId = deviceForm.deviceId;
    if (editingDevice === null) {
      // Count existing devices with same shortform
      const sameTypeCount = devices.filter(
        (d) => d.templateShortform === selectedTemplate?.shortform
      ).length;
      generatedDeviceId = `${selectedTemplate?.shortform}_${sameTypeCount + 1}`;
    }

    const deviceToSave = {
      ...deviceForm,
      deviceId: generatedDeviceId,
      templateName: selectedTemplate?.name,
      templateShortform: selectedTemplate?.shortform,
    };

    if (editingDevice !== null) {
      setDevices((prev) => prev.map((d, i) => (i === editingDevice ? deviceToSave : d)));
    } else {
      setDevices((prev) => [...prev, deviceToSave]);
    }

    setDeviceDialog(false);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: plantData.name,
        plantId: plantData.plantId,
        mqttBaseTopic: plantData.mqttBaseTopic,
        capacity: parseFloat(plantData.capacity),
        status: plantData.status,
        timezone: plantData.timezone,
        ...(plantData.installationDate && {
          installationDate: new Date(plantData.installationDate).toISOString(),
        }),
        location: {
          lat: parseFloat(plantData.lat),
          lng: parseFloat(plantData.lng),
          address: plantData.address,
        },
      };

      console.log('Submitting plant with payload:', payload);

      // Always add devices to payload (even if empty array for deletion)
      payload.devices = devices.map((device) => ({
        templateId: device.templateId,
        name: device.name,
        parentDeviceId: device.parentDeviceId === 'PLANT' ? null : device.parentDeviceId,
        serialNumber: device.serialNumber || undefined,
        status: device.status,
        selectedTags: device.selectedTags || [],
      }));

      // Create or update plant using Redux actions
      if (isEditMode) {
        await dispatch(updatePlantAction({ id, plantData: payload })).unwrap();
      } else {
        await dispatch(createPlantAction(payload)).unwrap();
      }

      navigate('/plants');
    } catch (err) {
      setError(err || 'Failed to save plant');
    } finally {
      setSaving(false);
    }
  };

  const getAvailableParents = () => {
    return devices.filter((_, i) => editingDevice === null || i !== editingDevice);
  };

  const buildDeviceTree = () => {
    // Build a tree structure for visualization
    const tree = {
      name: plantData.name || 'Plant',
      deviceId: plantData.plantId || 'PLANT',
      type: 'Plant',
      children: [],
    };

    // Add devices that have PLANT as parent
    const plantChildren = devices
      .map((device, index) => ({ ...device, index }))
      .filter((d) => d.parentDeviceId === 'PLANT');

    const addChildren = (parentIndex) => {
      return devices
        .map((device, index) => ({ ...device, index }))
        .filter((d) => {
          // Handle both string and number parent device IDs
          const parentId = typeof d.parentDeviceId === 'string' ? parseInt(d.parentDeviceId) : d.parentDeviceId;
          return parentId === parentIndex;
        })
        .map((device) => ({
          name: device.name,
          deviceId: device.deviceId,
          type: device.templateName,
          status: device.status,
          children: addChildren(device.index),
        }));
    };

    tree.children = plantChildren.map((device) => ({
      name: device.name,
      deviceId: device.deviceId,
      type: device.templateName,
      status: device.status,
      children: addChildren(device.index),
    }));

    return tree;
  };

  const renderTree = (node, level = 0) => {
    const isPlant = level === 0;
    return (
      <Box key={node.name} sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            ml: level * 4,
            py: 1,
            px: 2,
            backgroundColor: isPlant ? 'primary.light' : 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          {level > 0 && <ChildIcon sx={{ mr: 1, color: 'text.secondary' }} />}
          {isPlant && <TreeIcon sx={{ mr: 1, color: 'white' }} />}
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  color: isPlant ? 'white' : 'primary.main',
                  fontFamily: 'monospace',
                }}
              >
                {node.deviceId}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: isPlant ? 'bold' : 'medium',
                  color: isPlant ? 'white' : 'text.primary',
                }}
              >
                {node.name}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: isPlant ? 'white' : 'text.secondary' }}
            >
              {node.type}
            </Typography>
          </Box>
          {node.status && (
            <Chip
              label={node.status}
              size="small"
              color={node.status === 'ONLINE' ? 'success' : 'default'}
            />
          )}
        </Box>
        {node.children && node.children.length > 0 && (
          <Box>{node.children.map((child) => renderTree(child, level + 1))}</Box>
        )}
      </Box>
    );
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

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent>
          {/* Step 0: Plant Details */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
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
                  value={plantData.name}
                  onChange={handlePlantChange}
                  helperText="Enter a unique name for the plant"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Plant ID"
                  name="plantId"
                  value={plantData.plantId}
                  onChange={handlePlantChange}
                  disabled={isEditMode}
                  helperText={
                    isEditMode
                      ? 'Plant ID cannot be changed after creation'
                      : '3-20 chars: uppercase letters, numbers, underscores, hyphens (e.g., PLANT_001)'
                  }
                  inputProps={{
                    pattern: '[A-Z0-9_-]{3,20}',
                    style: { textTransform: 'uppercase' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="MQTT Base Topic"
                  name="mqttBaseTopic"
                  value={plantData.mqttBaseTopic}
                  onChange={handlePlantChange}
                  helperText="Base MQTT topic for this plant (e.g., solar/plant/001)"
                  placeholder="solar/plant/001"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Capacity (kW)"
                  name="capacity"
                  value={plantData.capacity}
                  onChange={handlePlantChange}
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
                  value={plantData.status}
                  onChange={handlePlantChange}
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
                  value={plantData.installationDate}
                  onChange={handlePlantChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  name="timezone"
                  value={plantData.timezone}
                  onChange={handlePlantChange}
                >
                  <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                  <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                </TextField>
              </Grid>

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
                  value={plantData.address}
                  onChange={handlePlantChange}
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
                  value={plantData.lat}
                  onChange={handlePlantChange}
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
                  value={plantData.lng}
                  onChange={handlePlantChange}
                  helperText="Longitude coordinate (-180 to 180)"
                  inputProps={{ min: -180, max: 180, step: 0.0001 }}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 1: Device Hierarchy */}
          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Device Hierarchy
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddDevice}
                >
                  Add Device
                </Button>
              </Box>

              {devices.length === 0 ? (
                <Alert severity="info">
                  No devices added yet. Click "Add Device" to add Transformers, Inverters, etc.
                  <br />
                  <strong>Note:</strong> Devices can also be added later from the Plant Details page.
                </Alert>
              ) : (
                <List>
                  {devices.map((device, index) => (
                    <Paper key={index} sx={{ mb: 2 }}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={device.deviceId}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                              <Typography variant="subtitle1">{device.name}</Typography>
                              <Chip
                                label={device.status}
                                size="small"
                                color={device.status === 'ONLINE' ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Type: {device.templateName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Parent: {device.parentDeviceId === 'PLANT'
                                  ? `${plantData.name || 'Plant'} (Plant Root)`
                                  : (() => {
                                      const parent = devices.find((d, i) => i === parseInt(device.parentDeviceId));
                                      return parent ? `${parent.deviceId} - ${parent.name}` : 'Unknown';
                                    })()}
                              </Typography>
                              {device.serialNumber && (
                                <Typography variant="body2" color="text.secondary">
                                  Serial: {device.serialNumber}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditDevice(index)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteDevice(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Step 2: Review & Submit */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Your Plant Configuration
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                <strong>Plant Information</strong>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1">{plantData.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Plant ID:</Typography>
                  <Typography variant="body1">{plantData.plantId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">MQTT Base Topic:</Typography>
                  <Typography variant="body1">{plantData.mqttBaseTopic}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Capacity:</Typography>
                  <Typography variant="body1">{plantData.capacity} kW</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Address:</Typography>
                  <Typography variant="body1">{plantData.address}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                <strong>Device Hierarchy ({devices.length} devices)</strong>
              </Typography>
              {devices.length > 0 ? (
                <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                  {renderTree(buildDeviceTree())}
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No devices configured. You can add devices later.
                </Typography>
              )}

              {devices.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Note:</strong> Devices will be created with auto-generated IDs and MQTT topics after the plant is created.
                  You can view and manage them from the Plant Details page.
                </Alert>
              )}
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={activeStep === 0 ? () => navigate('/plants') : handleBack}
              disabled={saving}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep < STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NextIcon />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Creating...' : isEditMode ? 'Update Plant' : 'Create Plant'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Device Dialog */}
      <Dialog open={deviceDialog} onClose={() => setDeviceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDevice !== null ? 'Edit Device' : 'Add Device'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                required
                label="Device Type"
                name="templateId"
                value={deviceForm.templateId}
                onChange={handleDeviceFormChange}
                helperText="Select the type of device you want to add"
              >
                <MenuItem value="">Select device type...</MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Device Name"
                name="name"
                value={deviceForm.name}
                onChange={handleDeviceFormChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                required
                label="Parent Device"
                name="parentDeviceId"
                value={deviceForm.parentDeviceId ?? ''}
                onChange={handleDeviceFormChange}
                helperText="Select the plant or a parent device"
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (selected === '' || selected === null || selected === undefined) {
                      return <em>Select parent device...</em>;
                    }
                    if (selected === 'PLANT') {
                      return `${plantData.name || 'Plant'} (Plant Root)`;
                    }
                    const parent = devices.find((_, i) => i === parseInt(selected));
                    return parent ? `${parent.deviceId} - ${parent.name} (${parent.templateName})` : 'Unknown';
                  },
                }}
              >
                <MenuItem value="PLANT">
                  {plantData.name || 'Plant'} (Plant Root)
                </MenuItem>
                {getAvailableParents().map((device, index) => (
                  <MenuItem key={index} value={index}>
                    {device.deviceId} - {device.name} ({device.templateName})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                name="serialNumber"
                value={deviceForm.serialNumber}
                onChange={handleDeviceFormChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={deviceForm.status}
                onChange={handleDeviceFormChange}
              >
                <MenuItem value="ONLINE">Online</MenuItem>
                <MenuItem value="OFFLINE">Offline</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
              </TextField>
            </Grid>

            {/* Tag Selection Section */}
            {availableTags.length > 0 && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Select Tags for this Device:
                </Typography>
                <FormHelperText sx={{ mb: 1 }}>
                  Choose which measurement tags to include for this device
                </FormHelperText>
                <Box
                  sx={{
                    maxHeight: 250,
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Grid container spacing={1}>
                    {availableTags.map((tag) => (
                      <Grid item xs={12} sm={6} key={tag.id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={deviceForm.selectedTags.includes(tag.id)}
                              onChange={() => handleTagToggle(tag.id)}
                              size="small"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">
                                {tag.displayName || tag.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tag.unit ? `(${tag.unit})` : ''} {tag.dataType}
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <FormHelperText>
                  {deviceForm.selectedTags.length} of {availableTags.length} tags selected
                </FormHelperText>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDevice}>
            {editingDevice !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlantForm;
