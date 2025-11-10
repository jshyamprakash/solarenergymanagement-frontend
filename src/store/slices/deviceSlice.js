/**
 * Device Slice
 * Redux slice for device state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as deviceService from '../../services/deviceService';

// Async thunks
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await deviceService.getAllDevices(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch devices');
    }
  }
);

export const fetchDeviceById = createAsyncThunk(
  'devices/fetchDeviceById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await deviceService.getDeviceById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch device');
    }
  }
);

export const fetchDeviceHierarchy = createAsyncThunk(
  'devices/fetchDeviceHierarchy',
  async (plantId, { rejectWithValue }) => {
    try {
      const data = await deviceService.getDeviceHierarchy(plantId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch device hierarchy');
    }
  }
);

export const fetchDeviceChildren = createAsyncThunk(
  'devices/fetchDeviceChildren',
  async (id, { rejectWithValue }) => {
    try {
      const data = await deviceService.getDeviceChildren(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch device children');
    }
  }
);

export const createDevice = createAsyncThunk(
  'devices/createDevice',
  async (deviceData, { rejectWithValue }) => {
    try {
      const data = await deviceService.createDevice(deviceData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create device');
    }
  }
);

export const updateDevice = createAsyncThunk(
  'devices/updateDevice',
  async ({ id, deviceData }, { rejectWithValue }) => {
    try {
      const data = await deviceService.updateDevice(id, deviceData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update device');
    }
  }
);

export const deleteDevice = createAsyncThunk(
  'devices/deleteDevice',
  async (id, { rejectWithValue }) => {
    try {
      await deviceService.deleteDevice(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete device');
    }
  }
);

// Initial state
const initialState = {
  devices: [],
  currentDevice: null,
  deviceChildren: [],
  deviceHierarchy: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    plantId: '',
    deviceType: '',
    status: '',
    search: '',
  },
  loading: false,
  error: null,
};

// Slice
const deviceSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDevice: (state) => {
      state.currentDevice = null;
      state.deviceChildren = [];
    },
    clearDeviceHierarchy: (state) => {
      state.deviceHierarchy = [];
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
      // Fetch Devices
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Device By ID
      .addCase(fetchDeviceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDevice = action.payload;
      })
      .addCase(fetchDeviceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Device Hierarchy
      .addCase(fetchDeviceHierarchy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceHierarchy.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceHierarchy = action.payload;
      })
      .addCase(fetchDeviceHierarchy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Device Children
      .addCase(fetchDeviceChildren.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceChildren.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceChildren = action.payload;
      })
      .addCase(fetchDeviceChildren.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Device
      .addCase(createDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.devices.unshift(action.payload);
      })
      .addCase(createDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Device
      .addCase(updateDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDevice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.devices.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
        if (state.currentDevice?.id === action.payload.id) {
          state.currentDevice = action.payload;
        }
      })
      .addCase(updateDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Device
      .addCase(deleteDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.devices = state.devices.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectDevices = (state) => state.devices.devices;
export const selectCurrentDevice = (state) => state.devices.currentDevice;
export const selectDeviceChildren = (state) => state.devices.deviceChildren;
export const selectDeviceHierarchy = (state) => state.devices.deviceHierarchy;
export const selectDevicesPagination = (state) => state.devices.pagination;
export const selectDevicesFilters = (state) => state.devices.filters;
export const selectDevicesLoading = (state) => state.devices.loading;
export const selectDevicesError = (state) => state.devices.error;

// Actions
export const { clearError, clearCurrentDevice, clearDeviceHierarchy, setFilters, setPagination } = deviceSlice.actions;

// Reducer
export default deviceSlice.reducer;
