/**
 * Reports Slice
 * Redux slice for reports state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as reportService from '../../services/reportService';

// Async thunks
export const generateReport = createAsyncThunk(
  'reports/generateReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const blob = await reportService.generateReport(reportData);
      // Return both blob and metadata for handling in component
      return { blob, reportData };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate report');
    }
  }
);

export const fetchReportHistory = createAsyncThunk(
  'reports/fetchReportHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await reportService.getReportHistory(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report history');
    }
  }
);

export const downloadReport = createAsyncThunk(
  'reports/downloadReport',
  async ({ reportId, format }, { rejectWithValue }) => {
    try {
      const blob = await reportService.downloadReport(reportId, format);
      return { blob, reportId, format };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download report');
    }
  }
);

export const deleteReport = createAsyncThunk(
  'reports/deleteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      await reportService.deleteReport(reportId);
      return reportId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete report');
    }
  }
);

export const getReportPreview = createAsyncThunk(
  'reports/getReportPreview',
  async (reportData, { rejectWithValue }) => {
    try {
      const data = await reportService.getReportPreview(reportData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get report preview');
    }
  }
);

// Initial state
const initialState = {
  reportHistory: [],
  currentReport: null,
  previewData: null,
  generatedBlob: null, // Store blob from generate operation
  downloadedBlob: null, // Store blob from download operation
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    reportType: '',
    search: '',
  },
  loading: false,
  generating: false,
  downloading: false,
  error: null,
  successMessage: null,
};

// Slice
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
      state.previewData = null;
    },
    clearGeneratedBlob: (state) => {
      state.generatedBlob = null;
    },
    clearDownloadedBlob: (state) => {
      state.downloadedBlob = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Report
      .addCase(generateReport.pending, (state) => {
        state.generating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.generating = false;
        state.generatedBlob = action.payload.blob;
        state.successMessage = 'Report generated successfully';
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload || 'Failed to generate report';
      })

      // Fetch Report History
      .addCase(fetchReportHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.reportHistory = action.payload.reports || action.payload || [];
        // Update pagination if provided
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }
      })
      .addCase(fetchReportHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch report history';
      })

      // Download Report
      .addCase(downloadReport.pending, (state) => {
        state.downloading = true;
        state.error = null;
      })
      .addCase(downloadReport.fulfilled, (state, action) => {
        state.downloading = false;
        state.downloadedBlob = action.payload.blob;
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload || 'Failed to download report';
      })

      // Delete Report
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        // Remove deleted report from history
        state.reportHistory = state.reportHistory.filter(
          (report) => report.reportId !== action.payload
        );
        state.successMessage = 'Report deleted successfully';
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete report';
      })

      // Get Report Preview
      .addCase(getReportPreview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReportPreview.fulfilled, (state, action) => {
        state.loading = false;
        state.previewData = action.payload;
      })
      .addCase(getReportPreview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to get report preview';
      });
  },
});

// Selectors
export const selectReportHistory = (state) => state.reports.reportHistory;
export const selectCurrentReport = (state) => state.reports.currentReport;
export const selectPreviewData = (state) => state.reports.previewData;
export const selectGeneratedBlob = (state) => state.reports.generatedBlob;
export const selectDownloadedBlob = (state) => state.reports.downloadedBlob;
export const selectReportsPagination = (state) => state.reports.pagination;
export const selectReportsFilters = (state) => state.reports.filters;
export const selectReportsLoading = (state) => state.reports.loading;
export const selectReportsGenerating = (state) => state.reports.generating;
export const selectReportsDownloading = (state) => state.reports.downloading;
export const selectReportsError = (state) => state.reports.error;
export const selectReportsSuccessMessage = (state) => state.reports.successMessage;

// Actions
export const {
  clearError,
  clearSuccessMessage,
  clearCurrentReport,
  clearGeneratedBlob,
  clearDownloadedBlob,
  setFilters,
  setPagination,
  resetFilters,
} = reportsSlice.actions;

// Reducer
export default reportsSlice.reducer;
