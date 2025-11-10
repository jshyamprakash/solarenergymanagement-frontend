/**
 * Alarms Slice
 * Redux slice for alarms state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as alarmService from '../../services/alarmService';

// Async thunks
export const fetchAlarms = createAsyncThunk(
  'alarms/fetchAlarms',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await alarmService.getAllAlarms(params);
      // The API returns an array directly, not wrapped in data
      return Array.isArray(data) ? { alarms: data, pagination: { total: data.length, page: params.page || 1, limit: params.limit || 10 } } : data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alarms');
    }
  }
);

export const fetchAlarmById = createAsyncThunk(
  'alarms/fetchAlarmById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await alarmService.getAlarmById(id);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alarm');
    }
  }
);

export const fetchAlarmStatistics = createAsyncThunk(
  'alarms/fetchAlarmStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await alarmService.getAlarmStatistics();
      // Return data as-is since the service already extracts it
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alarm statistics');
    }
  }
);

export const createAlarm = createAsyncThunk(
  'alarms/createAlarm',
  async (alarmData, { rejectWithValue }) => {
    try {
      const data = await alarmService.createAlarm(alarmData);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create alarm');
    }
  }
);

export const acknowledgeAlarm = createAsyncThunk(
  'alarms/acknowledgeAlarm',
  async ({ id, acknowledgedBy, notes }, { rejectWithValue }) => {
    try {
      const data = await alarmService.acknowledgeAlarm(id, acknowledgedBy, notes);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to acknowledge alarm');
    }
  }
);

export const resolveAlarm = createAsyncThunk(
  'alarms/resolveAlarm',
  async ({ id, resolvedBy, resolution }, { rejectWithValue }) => {
    try {
      const data = await alarmService.resolveAlarm(id, resolvedBy, resolution);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resolve alarm');
    }
  }
);

export const deleteAlarm = createAsyncThunk(
  'alarms/deleteAlarm',
  async (id, { rejectWithValue }) => {
    try {
      await alarmService.deleteAlarm(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete alarm');
    }
  }
);

// Initial state
const initialState = {
  alarms: [],
  currentAlarm: null,
  statistics: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    severity: '',
    status: '',
    plantId: '',
    search: '',
  },
  loading: false,
  error: null,
};

// Slice
const alarmsSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAlarm: (state) => {
      state.currentAlarm = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Alarms
      .addCase(fetchAlarms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlarms.fulfilled, (state, action) => {
        state.loading = false;
        state.alarms = action.payload.alarms || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAlarms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Alarm By ID
      .addCase(fetchAlarmById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlarmById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAlarm = action.payload;
      })
      .addCase(fetchAlarmById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Alarm Statistics
      .addCase(fetchAlarmStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlarmStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchAlarmStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Alarm
      .addCase(createAlarm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlarm.fulfilled, (state, action) => {
        state.loading = false;
        state.alarms.unshift(action.payload);
      })
      .addCase(createAlarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Acknowledge Alarm
      .addCase(acknowledgeAlarm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acknowledgeAlarm.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.alarms.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.alarms[index] = action.payload;
        }
        if (state.currentAlarm?.id === action.payload.id) {
          state.currentAlarm = action.payload;
        }
      })
      .addCase(acknowledgeAlarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resolve Alarm
      .addCase(resolveAlarm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveAlarm.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.alarms.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.alarms[index] = action.payload;
        }
        if (state.currentAlarm?.id === action.payload.id) {
          state.currentAlarm = action.payload;
        }
      })
      .addCase(resolveAlarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Alarm
      .addCase(deleteAlarm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlarm.fulfilled, (state, action) => {
        state.loading = false;
        state.alarms = state.alarms.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAlarm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectAlarms = (state) => state.alarms.alarms;
export const selectCurrentAlarm = (state) => state.alarms.currentAlarm;
export const selectAlarmStatistics = (state) => state.alarms.statistics;
export const selectAlarmsPagination = (state) => state.alarms.pagination;
export const selectAlarmsFilters = (state) => state.alarms.filters;
export const selectAlarmsLoading = (state) => state.alarms.loading;
export const selectAlarmsError = (state) => state.alarms.error;

// Actions
export const { clearError, clearCurrentAlarm, setFilters, setPagination } = alarmsSlice.actions;

// Reducer
export default alarmsSlice.reducer;
