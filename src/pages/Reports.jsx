/**
 * Reports Page
 * Report generation and viewing interface
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
  TextField,
  MenuItem,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Assessment as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { selectUser } from '../store/slices/authSlice';
import {
  fetchPlants,
  selectPlants,
  selectPlantsLoading,
} from '../store/slices/plantSlice';
import {
  fetchDevices,
  selectDevices,
  selectDevicesLoading,
} from '../store/slices/deviceSlice';
import {
  generateReport,
  fetchReportHistory,
  downloadReport,
  deleteReport as deleteReportAction,
  selectReportHistory,
  selectGeneratedBlob,
  selectDownloadedBlob,
  selectReportsLoading,
  selectReportsGenerating,
  selectReportsDownloading,
  selectReportsError,
  selectReportsSuccessMessage,
  clearError,
  clearSuccessMessage,
  clearGeneratedBlob,
  clearDownloadedBlob,
  setFilters,
  setPagination,
} from '../store/slices/reportsSlice';
import { downloadBlob, generateReportFilename } from '../services/reportService';

const REPORT_TYPES = [
  { value: 'PLANT_PERFORMANCE', label: 'Plant Performance Report' },
  { value: 'DEVICE_PERFORMANCE', label: 'Device Performance Report' },
  { value: 'ALARM', label: 'Alarm Report' },
  { value: 'ENERGY_PRODUCTION', label: 'Energy Production Report' },
];

const FORMATS = [
  { value: 'PDF', label: 'PDF', icon: <PdfIcon /> },
  { value: 'EXCEL', label: 'Excel', icon: <ExcelIcon /> },
];

const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const Reports = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const user = useSelector(selectUser);
  const plants = useSelector(selectPlants);
  const plantsLoading = useSelector(selectPlantsLoading);
  const devices = useSelector(selectDevices);
  const devicesLoading = useSelector(selectDevicesLoading);
  const reportHistory = useSelector(selectReportHistory);
  const generatedBlob = useSelector(selectGeneratedBlob);
  const downloadedBlob = useSelector(selectDownloadedBlob);
  const loading = useSelector(selectReportsLoading);
  const generating = useSelector(selectReportsGenerating);
  const downloading = useSelector(selectReportsDownloading);
  const error = useSelector(selectReportsError);
  const successMessage = useSelector(selectReportsSuccessMessage);

  // Local UI state
  const [activeTab, setActiveTab] = useState(0);

  // Generate Report Tab State (UI-specific, not API data)
  const [reportType, setReportType] = useState('PLANT_PERFORMANCE');
  const [format, setFormat] = useState('PDF');
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'days'));
  const [endDate, setEndDate] = useState(dayjs());
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [severity, setSeverity] = useState('');

  // Report History Tab State (UI-specific)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // Load plants and devices using Redux
  useEffect(() => {
    dispatch(fetchPlants({ page: 1, limit: 1000 }));
    dispatch(fetchDevices({ page: 1, limit: 1000 }));
  }, [dispatch]);

  // Load report history when switching to history tab
  useEffect(() => {
    if (activeTab === 1) {
      dispatch(fetchReportHistory());
    }
  }, [activeTab, dispatch]);

  // Handle generated blob download
  useEffect(() => {
    if (generatedBlob) {
      const filename = generateReportFilename(reportType, format);
      downloadBlob(generatedBlob, filename);
      // Clear blob after download
      dispatch(clearGeneratedBlob());
    }
  }, [generatedBlob, reportType, format, dispatch]);

  // Handle downloaded blob
  useEffect(() => {
    if (downloadedBlob) {
      // The filename will be handled in the download action
      // Clear blob after download
      dispatch(clearDownloadedBlob());
    }
  }, [downloadedBlob, dispatch]);

  const handleGenerateReport = async () => {
    // Build report data
    const reportData = {
      reportType,
      format,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    // Add type-specific parameters
    if (reportType === 'PLANT_PERFORMANCE' || reportType === 'ENERGY_PRODUCTION') {
      if (selectedPlants.length === 1) {
        reportData.plantId = selectedPlants[0].plantId;
      } else if (selectedPlants.length > 1) {
        reportData.plantIds = selectedPlants.map(p => p.plantId);
      }
    }

    if (reportType === 'DEVICE_PERFORMANCE' && selectedDevice) {
      reportData.deviceId = selectedDevice.deviceId;
      reportData.plantId = selectedDevice.plantId;
    }

    if (reportType === 'ALARM' && severity) {
      reportData.severity = severity;
      if (selectedPlants.length > 0) {
        reportData.plantIds = selectedPlants.map(p => p.plantId);
      }
    }

    // Generate report via Redux
    await dispatch(generateReport(reportData)).unwrap();

    // Refresh history if on that tab
    if (activeTab === 1) {
      dispatch(fetchReportHistory());
    }
  };

  const handleDownloadReport = async (reportId, reportFormat) => {
    const result = await dispatch(downloadReport({ reportId, format: reportFormat })).unwrap();
    if (result.blob) {
      const filename = generateReportFilename('downloaded', reportFormat);
      downloadBlob(result.blob, filename);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    await dispatch(deleteReportAction(reportId)).unwrap();
  };

  const isFormValid = () => {
    if (!startDate || !endDate) return false;
    if (startDate.isAfter(endDate)) return false;

    if (reportType === 'DEVICE_PERFORMANCE' && !selectedDevice) {
      return false;
    }

    return true;
  };

  // Filter report history
  const filteredHistory = reportHistory.filter(report => {
    if (filterType && report.reportType !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.reportType.toLowerCase().includes(query) ||
        (report.generatedBy?.name || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const paginatedHistory = filteredHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderGenerateReportForm = () => (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => dispatch(clearSuccessMessage())}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Report Type */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Report Type"
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setSelectedPlants([]);
              setSelectedDevice(null);
              setSeverity('');
            }}
          >
            {REPORT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Format */}
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {FORMATS.map((fmt) => (
              <MenuItem key={fmt.value} value={fmt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {fmt.icon}
                  {fmt.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Date Range */}
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Plant Selection (for Plant Performance, Energy Production, Alarm Reports) */}
        {(reportType === 'PLANT_PERFORMANCE' ||
          reportType === 'ENERGY_PRODUCTION' ||
          reportType === 'ALARM') && (
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={plants}
              getOptionLabel={(option) => option.name}
              value={selectedPlants}
              onChange={(event, newValue) => setSelectedPlants(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Plants"
                  placeholder="Select one or more plants"
                />
              )}
              loading={plantsLoading}
            />
          </Grid>
        )}

        {/* Device Selection (for Device Performance Report) */}
        {reportType === 'DEVICE_PERFORMANCE' && (
          <Grid item xs={12}>
            <Autocomplete
              options={devices}
              getOptionLabel={(option) => `${option.name} (${option.deviceType})`}
              value={selectedDevice}
              onChange={(event, newValue) => setSelectedDevice(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Device"
                  placeholder="Select a device"
                  required
                />
              )}
              loading={devicesLoading}
            />
          </Grid>
        )}

        {/* Severity Filter (for Alarm Reports) */}
        {reportType === 'ALARM' && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severity}
                label="Severity"
                onChange={(e) => setSeverity(e.target.value)}
              >
                <MenuItem value="">All Severities</MenuItem>
                {SEVERITY_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Generate Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            startIcon={generating ? <CircularProgress size={20} /> : <ReportIcon />}
            onClick={handleGenerateReport}
            disabled={!isFormValid() || generating}
            fullWidth
          >
            {generating ? 'Generating Report...' : 'Generate Report'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderReportHistory = () => (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search"
            placeholder="Search by type or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Filter by Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            {REPORT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* History Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report Type</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell>Generated At</TableCell>
                  <TableCell>Generated By</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No reports found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistory.map((report) => (
                    <TableRow key={report.reportId}>
                      <TableCell>
                        <Chip
                          label={report.reportType.replace(/_/g, ' ')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {dayjs(report.startDate).format('MMM D, YYYY')} -{' '}
                        {dayjs(report.endDate).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>
                        {dayjs(report.createdAt).format('MMM D, YYYY HH:mm')}
                      </TableCell>
                      <TableCell>{report.generatedBy?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={report.format === 'PDF' ? <PdfIcon /> : <ExcelIcon />}
                          label={report.format}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadReport(report.reportId, report.format)}
                          title="Download"
                          disabled={downloading}
                        >
                          {downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteReport(report.reportId)}
                          title="Delete"
                          color="error"
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredHistory.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Generate Report" />
            <Tab label="Report History" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && renderGenerateReportForm()}
            {activeTab === 1 && renderReportHistory()}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
