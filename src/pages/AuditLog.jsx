/**
 * Audit Log Page
 * System audit log viewer with timeline and filters
 * Refactored to use Redux for state management
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  IconButton,
  Collapse,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Factory as PlantIcon,
  DeviceHub as DeviceIcon,
  Label as TagIcon,
  Warning as AlarmIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as AcknowledgeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { selectUser, selectIsAdmin } from '../store/slices/authSlice';
import {
  fetchUsers,
  selectUsers,
} from '../store/slices/usersSlice';
import {
  getAuditLogs,
  getAuditStats,
  exportAuditLogs,
  downloadBlob,
  getActionColor,
  getRelativeTime,
} from '../services/auditService';

const ENTITY_TYPES = ['User', 'Plant', 'Device', 'Tag', 'Alarm'];
const ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'ACKNOWLEDGE'];

const ENTITY_ICONS = {
  User: PersonIcon,
  Plant: PlantIcon,
  Device: DeviceIcon,
  Tag: TagIcon,
  Alarm: AlarmIcon,
};

const ACTION_ICONS = {
  CREATE: AddIcon,
  UPDATE: EditIcon,
  DELETE: DeleteIcon,
  ACKNOWLEDGE: AcknowledgeIcon,
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AuditLog = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const users = useSelector(selectUsers);

  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/unauthorized');
    }
  }, [isAdmin, navigate]);

  // Local state
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [entityId, setEntityId] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Expanded items
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUsers({ page: 1, limit: 1000 }));
      loadStats();
      loadAuditLogs(true);
    }
  }, [isAdmin, dispatch]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getAuditStats(buildFilters());
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const buildFilters = () => {
    const filters = {};
    if (entityType) filters.entityType = entityType;
    if (action) filters.action = action;
    if (selectedUser) filters.userId = selectedUser.userId;
    if (startDate) filters.startDate = startDate.toISOString();
    if (endDate) filters.endDate = endDate.toISOString();
    if (entityId) filters.entityId = entityId;
    return filters;
  };

  const loadAuditLogs = async (reset = false) => {
    try {
      setLoading(true);
      setError('');

      const currentPage = reset ? 1 : page;
      const filters = buildFilters();
      const data = await getAuditLogs(filters, currentPage, 50);

      if (reset) {
        setAuditLogs(data.logs || []);
        setPage(1);
      } else {
        setAuditLogs((prev) => [...prev, ...(data.logs || [])]);
      }

      setHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadAuditLogs(true);
    loadStats();
  };

  const handleClearFilters = () => {
    setEntityType('');
    setAction('');
    setSelectedUser(null);
    setStartDate(null);
    setEndDate(null);
    setEntityId('');
    setTimeout(() => {
      loadAuditLogs(true);
      loadStats();
    }, 100);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
    setTimeout(() => loadAuditLogs(false), 100);
  };

  const handleExport = async (format) => {
    try {
      const filters = buildFilters();
      const blob = await exportAuditLogs(format, filters);
      const filename = `audit-log-${dayjs().format('YYYY-MM-DD')}.${format.toLowerCase()}`;
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err.message || 'Failed to export audit logs');
    }
  };

  const toggleExpanded = (logId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const renderChanges = (log) => {
    if (!log.changes) return null;

    let changes;
    try {
      changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
    } catch (err) {
      return <Typography color="text.secondary">Unable to parse changes</Typography>;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Changes:
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            {changes.before && (
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Before:
                </Typography>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                  {JSON.stringify(changes.before, null, 2)}
                </pre>
              </Grid>
            )}
            {changes.after && (
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  After:
                </Typography>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
                  {JSON.stringify(changes.after, null, 2)}
                </pre>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderStatistics = () => {
    if (statsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!stats) return null;

    // Prepare data for charts
    const actionData = ACTION_TYPES.map((actionType) => ({
      name: actionType,
      value: stats.byAction?.[actionType] || 0,
    })).filter(item => item.value > 0);

    const userActivityData = Object.entries(stats.byUser || {})
      .map(([userName, count]) => ({ name: userName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Logs
              </Typography>
              <Typography variant="h3" color="primary">
                {stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Logs by Action
              </Typography>
              {actionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={actionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {actionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Active Users
              </Typography>
              {userActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={userActivityData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderTimeline = () => {
    if (loading && page === 1) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (auditLogs.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No audit logs found</Typography>
        </Paper>
      );
    }

    return (
      <Box>
        {auditLogs.map((log, index) => {
          const isExpanded = expandedItems.has(log.logId);
          const EntityIcon = ENTITY_ICONS[log.entityType] || PersonIcon;
          const ActionIcon = ACTION_ICONS[log.action] || EditIcon;

          return (
            <Paper key={log.logId} sx={{ mb: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => toggleExpanded(log.logId)}
              >
                {/* Avatar */}
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {log.user?.name?.charAt(0) || 'U'}
                </Avatar>

                {/* Content */}
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {log.user?.name || 'Unknown User'}
                    </Typography>
                    <Chip
                      icon={<ActionIcon />}
                      label={log.action}
                      size="small"
                      color={getActionColor(log.action)}
                    />
                    <Chip
                      icon={<EntityIcon />}
                      label={log.entityType}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {log.entityType} ID: {log.entityId}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {getRelativeTime(log.timestamp)}
                  </Typography>
                </Box>

                {/* Expand Icon */}
                <IconButton size="small">
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Expanded Content */}
              <Collapse in={isExpanded}>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        Timestamp:
                      </Typography>
                      <Typography variant="body2">
                        {dayjs(log.timestamp).format('MMM D, YYYY HH:mm:ss')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        User Email:
                      </Typography>
                      <Typography variant="body2">{log.user?.email || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        IP Address:
                      </Typography>
                      <Typography variant="body2">{log.ipAddress || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">
                        User Agent:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {log.userAgent || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {renderChanges(log)}
                </Box>
              </Collapse>
            </Paper>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Audit Log</Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('CSV')}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('JSON')}
          >
            Export JSON
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      {renderStatistics()}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Entity Type"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {ENTITY_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {ACTION_TYPES.map((actionType) => (
                    <MenuItem key={actionType} value={actionType}>
                      {actionType}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(option) => option.name}
                  value={selectedUser}
                  onChange={(event, newValue) => setSelectedUser(newValue)}
                  renderInput={(params) => <TextField {...params} label="User" />}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Entity ID"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="Search by ID..."
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={handleApplyFilters}
                    fullWidth
                  >
                    Apply Filters
                  </Button>
                  <Button variant="outlined" onClick={handleClearFilters} fullWidth>
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Timeline */}
      {renderTimeline()}
    </Box>
  );
};

export default AuditLog;
