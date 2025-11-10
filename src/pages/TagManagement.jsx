/**
 * Tag Management Page
 * Manage tags and their assignments to devices
 * Refactored to use Redux for state management
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import {
  fetchTags,
  createTag as createTagAction,
  updateTag as updateTagAction,
  deleteTag as deleteTagAction,
  fetchDeviceTags,
  assignTagToDevice as assignTagAction,
  removeTagFromDevice as removeTagAction,
  selectTags,
  selectDeviceTags,
  selectTagsLoading,
  selectTagsError,
  clearError,
  clearDeviceTags,
} from '../store/slices/tagsSlice';
import {
  fetchDevices,
  selectDevices,
} from '../store/slices/deviceSlice';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';
import MqttPayloadTester from '../components/tags/MqttPayloadTester';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tag-tabpanel-${index}`}
      aria-labelledby={`tag-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const dataTypes = ['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'TIMESTAMP'];
const deviceTypes = [
  'INVERTER',
  'TRANSFORMER',
  'COMBINER_BOX',
  'STRING',
  'WEATHER_STATION',
  'METER',
  'SENSOR',
  'OTHER',
];

const TagManagement = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);
  const tags = useSelector(selectTags);
  const deviceTags = useSelector(selectDeviceTags);
  const devices = useSelector(selectDevices);
  const loading = useSelector(selectTagsLoading);
  const reduxError = useSelector(selectTagsError);

  const canModify = isAdmin || isPlantManager;

  // Local UI state
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Tag Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [currentTag, setCurrentTag] = useState({
    name: '',
    dataType: 'FLOAT',
    unit: '',
    deviceType: 'INVERTER',
    description: '',
  });

  // Tag Assignment State (UI-specific)
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [newTagAssignment, setNewTagAssignment] = useState({
    tagId: '',
    mqttPath: '',
  });

  // Snackbar State (UI-specific)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load tags and devices using Redux
  useEffect(() => {
    dispatch(fetchTags({ page: 1, limit: 1000 }));
    dispatch(fetchDevices({ page: 1, limit: 1000 }));
  }, [dispatch]);

  // Load device tags when device is selected
  useEffect(() => {
    if (selectedDevice) {
      setAssignmentLoading(true);
      dispatch(fetchDeviceTags(selectedDevice.id))
        .unwrap()
        .catch((err) => showSnackbar(err || 'Failed to load device tags', 'error'))
        .finally(() => setAssignmentLoading(false));
    } else {
      dispatch(clearDeviceTags());
    }
  }, [selectedDevice, dispatch]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Tag Library Actions
  const handleOpenDialog = (mode = 'create', tag = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && tag) {
      setCurrentTag({
        id: tag.id,
        name: tag.name,
        dataType: tag.dataType,
        unit: tag.unit || '',
        deviceType: tag.deviceType,
        description: tag.description || '',
      });
    } else {
      setCurrentTag({
        name: '',
        dataType: 'FLOAT',
        unit: '',
        deviceType: 'INVERTER',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentTag({
      name: '',
      dataType: 'FLOAT',
      unit: '',
      deviceType: 'INVERTER',
      description: '',
    });
  };

  const handleSaveTag = async () => {
    try {
      if (dialogMode === 'create') {
        await dispatch(createTagAction(currentTag)).unwrap();
        showSnackbar('Tag created successfully');
      } else {
        await dispatch(updateTagAction({ id: currentTag.id, tagData: currentTag })).unwrap();
        showSnackbar('Tag updated successfully');
      }
      handleCloseDialog();
      dispatch(fetchTags({ page: 1, limit: 1000 }));
    } catch (err) {
      showSnackbar(err || 'Failed to save tag', 'error');
    }
  };

  const handleDeleteTag = async (tagId, tagName) => {
    if (!window.confirm(`Are you sure you want to delete tag "${tagName}"?`)) {
      return;
    }

    try {
      await dispatch(deleteTagAction(tagId)).unwrap();
      showSnackbar('Tag deleted successfully');
      dispatch(fetchTags({ page: 1, limit: 1000 }));
    } catch (err) {
      showSnackbar(err || 'Failed to delete tag', 'error');
    }
  };

  // Tag Assignment Actions
  const handleAssignTag = async () => {
    if (!selectedDevice || !newTagAssignment.tagId || !newTagAssignment.mqttPath) {
      showSnackbar('Please select a device, tag, and provide MQTT path', 'warning');
      return;
    }

    try {
      await dispatch(assignTagAction({
        deviceId: selectedDevice.id,
        tagId: newTagAssignment.tagId,
        mqttPath: newTagAssignment.mqttPath
      })).unwrap();
      showSnackbar('Tag assigned successfully');
      setNewTagAssignment({ tagId: '', mqttPath: '' });
      dispatch(fetchDeviceTags(selectedDevice.id));
    } catch (err) {
      showSnackbar(err || 'Failed to assign tag', 'error');
    }
  };

  const handleRemoveTagAssignment = async (deviceId, tagId, tagName) => {
    if (!window.confirm(`Remove tag "${tagName}" from this device?`)) {
      return;
    }

    try {
      await dispatch(removeTagAction({ deviceId, tagId })).unwrap();
      showSnackbar('Tag assignment removed');
      dispatch(fetchDeviceTags(deviceId));
    } catch (err) {
      showSnackbar(err || 'Failed to remove tag assignment', 'error');
    }
  };

  // Filter and paginate tags
  const filteredTags = tags.filter((tag) => {
    const matchesDeviceType = !deviceTypeFilter || tag.deviceType === deviceTypeFilter;
    const matchesSearch = !searchQuery ||
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDeviceType && matchesSearch;
  });

  // Paginate tags
  const paginatedTags = filteredTags.slice(page * pageSize, (page + 1) * pageSize);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    dispatch(fetchTags({ page: 1, limit: 1000 }));
    dispatch(fetchDevices({ page: 1, limit: 1000 }));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Tag Management</Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Tag Library" />
            <Tab label="Tag Assignments" />
            <Tab label="MQTT Tester" />
          </Tabs>
        </Box>

        {/* Tab 1: Tag Library */}
        <TabPanel value={tabValue} index={0}>
          {/* Filters and Actions */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search tags"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                placeholder="Search by name or description"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Device Type"
                value={deviceTypeFilter}
                onChange={(e) => setDeviceTypeFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="">All Types</MenuItem>
                {deviceTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {canModify && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('create')}
                >
                  Add Tag
                </Button>
              )}
            </Grid>
          </Grid>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Tags Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Tag Name</strong></TableCell>
                    <TableCell><strong>Data Type</strong></TableCell>
                    <TableCell><strong>Unit</strong></TableCell>
                    <TableCell><strong>Device Type</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedTags.length > 0 ? (
                    paginatedTags.map((tag) => (
                      <TableRow key={tag.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {tag.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={tag.dataType} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{tag.unit || '-'}</TableCell>
                        <TableCell>{tag.deviceType}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {tag.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {canModify && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog('edit', tag)}
                                title="Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              {isAdmin && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                                  title="Delete"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">
                          No tags found. {canModify && 'Click "Add Tag" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredTags.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Card>
        </TabPanel>

        {/* Tab 2: Tag Assignments */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Device Selection */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Select Device
                  </Typography>
                  <Autocomplete
                    options={devices}
                    getOptionLabel={(option) => `${option.name} (${option.deviceType})`}
                    value={selectedDevice}
                    onChange={(event, newValue) => setSelectedDevice(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Device"
                        placeholder="Search for a device..."
                      />
                    )}
                  />
                </CardContent>
              </Card>
            </Grid>

            {selectedDevice && (
              <>
                {/* Assign New Tag */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Assign New Tag
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            select
                            label="Tag"
                            value={newTagAssignment.tagId}
                            onChange={(e) =>
                              setNewTagAssignment({
                                ...newTagAssignment,
                                tagId: e.target.value,
                              })
                            }
                          >
                            <MenuItem value="">Select Tag</MenuItem>
                            {tags
                              .filter((tag) => tag.deviceType === selectedDevice.deviceType)
                              .map((tag) => (
                                <MenuItem key={tag.id} value={tag.id}>
                                  {tag.name} ({tag.dataType})
                                </MenuItem>
                              ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            fullWidth
                            label="MQTT Path"
                            value={newTagAssignment.mqttPath}
                            onChange={(e) =>
                              setNewTagAssignment({
                                ...newTagAssignment,
                                mqttPath: e.target.value,
                              })
                            }
                            placeholder="e.g., data.voltage"
                            helperText="JSON path to extract value from MQTT payload"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AssignIcon />}
                            onClick={handleAssignTag}
                            disabled={!newTagAssignment.tagId || !newTagAssignment.mqttPath}
                          >
                            Assign Tag
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Current Tag Assignments */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Current Tag Assignments
                      </Typography>
                      {assignmentLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : deviceTags.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Tag Name</TableCell>
                                <TableCell>Data Type</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell>MQTT Path</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {deviceTags.map((dt) => (
                                <TableRow key={dt.id}>
                                  <TableCell>
                                    <Chip label={dt.tag.name} size="small" color="primary" />
                                  </TableCell>
                                  <TableCell>{dt.tag.dataType}</TableCell>
                                  <TableCell>{dt.tag.unit || '-'}</TableCell>
                                  <TableCell>
                                    <code style={{ fontSize: '0.875rem' }}>{dt.mqttPath}</code>
                                  </TableCell>
                                  <TableCell>
                                    {canModify && (
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleRemoveTagAssignment(
                                            selectedDevice.id,
                                            dt.tag.id,
                                            dt.tag.name
                                          )
                                        }
                                        title="Remove"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">
                          No tags assigned to this device yet. Use the form above to assign tags.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        {/* Tab 3: MQTT Payload Tester */}
        <TabPanel value={tabValue} index={2}>
          <MqttPayloadTester />
        </TabPanel>
      </Card>

      {/* Tag Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Tag' : 'Edit Tag'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tag Name"
                  value={currentTag.name}
                  onChange={(e) => setCurrentTag({ ...currentTag, name: e.target.value })}
                  required
                  helperText="Unique identifier for this tag"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Data Type"
                  value={currentTag.dataType}
                  onChange={(e) => setCurrentTag({ ...currentTag, dataType: e.target.value })}
                  required
                >
                  {dataTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={currentTag.unit}
                  onChange={(e) => setCurrentTag({ ...currentTag, unit: e.target.value })}
                  placeholder="e.g., V, A, kW"
                  helperText="Measurement unit (optional)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Device Type"
                  value={currentTag.deviceType}
                  onChange={(e) => setCurrentTag({ ...currentTag, deviceType: e.target.value })}
                  required
                >
                  {deviceTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={currentTag.description}
                  onChange={(e) => setCurrentTag({ ...currentTag, description: e.target.value })}
                  placeholder="Describe what this tag measures..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveTag}
            variant="contained"
            disabled={!currentTag.name || !currentTag.dataType || !currentTag.deviceType}
          >
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default TagManagement;
