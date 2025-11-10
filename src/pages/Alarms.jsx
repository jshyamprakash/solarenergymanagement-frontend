/**
 * Alarms Page
 * Displays and manages system alarms
 * Refactored to use Redux for state management
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  fetchAlarms,
  fetchAlarmStatistics,
  acknowledgeAlarm,
  resolveAlarm,
  selectAlarms,
  selectAlarmStatistics,
  selectAlarmsPagination,
  selectAlarmsFilters,
  selectAlarmsLoading,
  selectAlarmsError,
  setFilters,
  setPagination,
  clearError,
} from '../store/slices/alarmsSlice';
import { selectIsAdmin, selectIsPlantManager } from '../store/slices/authSlice';

// Severity colors
const SEVERITY_COLORS = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
  INFO: 'default',
};

// Severity icons
const SEVERITY_ICONS = {
  CRITICAL: <ErrorIcon />,
  HIGH: <WarningIcon />,
  MEDIUM: <WarningIcon />,
  LOW: <InfoIcon />,
  INFO: <InfoIcon />,
};

// Status colors
const STATUS_COLORS = {
  ACTIVE: 'error',
  ACKNOWLEDGED: 'warning',
  RESOLVED: 'success',
  IGNORED: 'default',
};

const Alarms = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const isAdmin = useSelector(selectIsAdmin);
  const isPlantManager = useSelector(selectIsPlantManager);
  const alarms = useSelector(selectAlarms);
  const statistics = useSelector(selectAlarmStatistics);
  const pagination = useSelector(selectAlarmsPagination);
  const filters = useSelector(selectAlarmsFilters);
  const loading = useSelector(selectAlarmsLoading);
  const error = useSelector(selectAlarmsError);

  const canManage = isAdmin || isPlantManager;

  // Local state for dialogs only
  const [acknowledgeDialog, setAcknowledgeDialog] = useState({ open: false, alarm: null });
  const [resolveDialog, setResolveDialog] = useState({ open: false, alarm: null });
  const [note, setNote] = useState('');

  // Load alarms and statistics when component mounts or filters/pagination change
  useEffect(() => {
    loadAlarms();
    loadStatistics();
  }, [pagination.page, pagination.limit, filters.severity, filters.status, filters.plantId]);

  const loadAlarms = () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      ),
    };

    dispatch(fetchAlarms(params));
  };

  const loadStatistics = () => {
    dispatch(fetchAlarmStatistics());
  };

  const handleRefresh = () => {
    dispatch(clearError());
    loadAlarms();
    loadStatistics();
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

  const handleFilterChange = (field, value) => {
    dispatch(setFilters({ [field]: value }));
    dispatch(setPagination({ page: 1 }));
  };

  const handleAcknowledge = (alarm) => {
    setAcknowledgeDialog({ open: true, alarm });
    setNote('');
  };

  const handleResolve = (alarm) => {
    setResolveDialog({ open: true, alarm });
    setNote('');
  };

  const confirmAcknowledge = async () => {
    try {
      await dispatch(acknowledgeAlarm({
        id: acknowledgeDialog.alarm.id,
        acknowledgedBy: 'current-user', // Should be taken from auth context
        notes: note
      })).unwrap();

      setAcknowledgeDialog({ open: false, alarm: null });
      setNote('');
      loadAlarms();
      loadStatistics();
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const confirmResolve = async () => {
    try {
      await dispatch(resolveAlarm({
        id: resolveDialog.alarm.id,
        resolvedBy: 'current-user', // Should be taken from auth context
        resolution: note
      })).unwrap();

      setResolveDialog({ open: false, alarm: null });
      setNote('');
      loadAlarms();
      loadStatistics();
    } catch (err) {
      // Error is handled by Redux
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Alarms
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Alarms
                </Typography>
                <Typography variant="h3">{statistics.total || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h3" color="error.main">
                  {statistics.byStatus?.active || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Acknowledged
                </Typography>
                <Typography variant="h3" color="warning.main">
                  {statistics.byStatus?.acknowledged || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Resolved
                </Typography>
                <Typography variant="h3" color="success.main">
                  {statistics.byStatus?.resolved || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  label="Severity"
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="INFO">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="ACKNOWLEDGED">Acknowledged</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alarms Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Plant</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Triggered At</TableCell>
                {canManage && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : alarms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} align="center">
                    <Typography color="text.secondary">No alarms found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                alarms.map((alarm) => (
                  <TableRow key={alarm.id} hover>
                    <TableCell>
                      <Chip
                        icon={SEVERITY_ICONS[alarm.severity]}
                        label={alarm.severity}
                        color={SEVERITY_COLORS[alarm.severity]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alarm.status}
                        color={STATUS_COLORS[alarm.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{alarm.message}</Typography>
                      {alarm.description && (
                        <Typography variant="caption" color="text.secondary">
                          {alarm.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alarm.plant?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alarm.device?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(alarm.triggeredAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          {alarm.status === 'ACTIVE' && (
                            <Tooltip title="Acknowledge">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleAcknowledge(alarm)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(alarm.status === 'ACTIVE' || alarm.status === 'ACKNOWLEDGED') && (
                            <Tooltip title="Resolve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleResolve(alarm)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
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
      </Card>

      {/* Acknowledge Dialog */}
      <Dialog open={acknowledgeDialog.open} onClose={() => setAcknowledgeDialog({ open: false, alarm: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Acknowledge Alarm</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to acknowledge this alarm?
          </Typography>
          {acknowledgeDialog.alarm && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Message:</strong> {acknowledgeDialog.alarm.message}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this acknowledgment..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcknowledgeDialog({ open: false, alarm: null })}>
            Cancel
          </Button>
          <Button onClick={confirmAcknowledge} variant="contained" color="warning">
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open: false, alarm: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Alarm</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to resolve this alarm?
          </Typography>
          {resolveDialog.alarm && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Message:</strong> {resolveDialog.alarm.message}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Resolution Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about how this was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, alarm: null })}>
            Cancel
          </Button>
          <Button onClick={confirmResolve} variant="contained" color="success">
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alarms;
