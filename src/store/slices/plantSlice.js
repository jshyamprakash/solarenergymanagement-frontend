/**
 * Plant Slice
 * Redux slice for plant state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as plantService from '../../services/plantService';

// Async thunks
export const fetchPlants = createAsyncThunk(
  'plants/fetchPlants',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await plantService.getAllPlants(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plants');
    }
  }
);

export const fetchPlantById = createAsyncThunk(
  'plants/fetchPlantById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await plantService.getPlantById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plant');
    }
  }
);

export const fetchPlantStats = createAsyncThunk(
  'plants/fetchPlantStats',
  async (id, { rejectWithValue }) => {
    try {
      const data = await plantService.getPlantStats(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch plant stats');
    }
  }
);

export const createPlant = createAsyncThunk(
  'plants/createPlant',
  async (plantData, { rejectWithValue }) => {
    try {
      const data = await plantService.createPlant(plantData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create plant');
    }
  }
);

export const updatePlant = createAsyncThunk(
  'plants/updatePlant',
  async ({ id, plantData }, { rejectWithValue }) => {
    try {
      const data = await plantService.updatePlant(id, plantData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update plant');
    }
  }
);

export const deletePlant = createAsyncThunk(
  'plants/deletePlant',
  async (id, { rejectWithValue }) => {
    try {
      await plantService.deletePlant(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete plant');
    }
  }
);

// Initial state
const initialState = {
  plants: [],
  currentPlant: null,
  currentPlantStats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

// Slice
const plantSlice = createSlice({
  name: 'plants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPlant: (state) => {
      state.currentPlant = null;
      state.currentPlantStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Plants
      .addCase(fetchPlants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlants.fulfilled, (state, action) => {
        state.loading = false;
        state.plants = action.payload.plants || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPlants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Plant By ID
      .addCase(fetchPlantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlantById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlant = action.payload;
      })
      .addCase(fetchPlantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Plant Stats
      .addCase(fetchPlantStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlantStats.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlantStats = action.payload;
      })
      .addCase(fetchPlantStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Plant
      .addCase(createPlant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlant.fulfilled, (state, action) => {
        state.loading = false;
        state.plants.unshift(action.payload);
      })
      .addCase(createPlant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Plant
      .addCase(updatePlant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlant.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.plants.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.plants[index] = action.payload;
        }
        if (state.currentPlant?.id === action.payload.id) {
          state.currentPlant = action.payload;
        }
      })
      .addCase(updatePlant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Plant
      .addCase(deletePlant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlant.fulfilled, (state, action) => {
        state.loading = false;
        state.plants = state.plants.filter((p) => p.id !== action.payload);
      })
      .addCase(deletePlant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectPlants = (state) => state.plants.plants;
export const selectCurrentPlant = (state) => state.plants.currentPlant;
export const selectCurrentPlantStats = (state) => state.plants.currentPlantStats;
export const selectPlantsPagination = (state) => state.plants.pagination;
export const selectPlantsLoading = (state) => state.plants.loading;
export const selectPlantsError = (state) => state.plants.error;

// Actions
export const { clearError, clearCurrentPlant } = plantSlice.actions;

// Reducer
export default plantSlice.reducer;
