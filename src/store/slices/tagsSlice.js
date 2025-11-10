/**
 * Tags Slice
 * Redux slice for tags state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as tagService from '../../services/tagService';

// Async thunks
export const fetchTags = createAsyncThunk(
  'tags/fetchTags',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await tagService.getAllTags(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tags');
    }
  }
);

export const fetchTagById = createAsyncThunk(
  'tags/fetchTagById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await tagService.getTagById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tag');
    }
  }
);

export const createTag = createAsyncThunk(
  'tags/createTag',
  async (tagData, { rejectWithValue }) => {
    try {
      const data = await tagService.createTag(tagData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tag');
    }
  }
);

export const updateTag = createAsyncThunk(
  'tags/updateTag',
  async ({ id, tagData }, { rejectWithValue }) => {
    try {
      const data = await tagService.updateTag(id, tagData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tag');
    }
  }
);

export const deleteTag = createAsyncThunk(
  'tags/deleteTag',
  async (id, { rejectWithValue }) => {
    try {
      await tagService.deleteTag(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tag');
    }
  }
);

export const fetchDeviceTags = createAsyncThunk(
  'tags/fetchDeviceTags',
  async (deviceId, { rejectWithValue }) => {
    try {
      const data = await tagService.getDeviceTags(deviceId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch device tags');
    }
  }
);

export const assignTagToDevice = createAsyncThunk(
  'tags/assignTagToDevice',
  async ({ deviceId, tagId, mqttPath }, { rejectWithValue }) => {
    try {
      const data = await tagService.assignTagToDevice(deviceId, tagId, mqttPath);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign tag to device');
    }
  }
);

export const removeTagFromDevice = createAsyncThunk(
  'tags/removeTagFromDevice',
  async ({ deviceId, tagId }, { rejectWithValue }) => {
    try {
      await tagService.removeTagFromDevice(deviceId, tagId);
      return { deviceId, tagId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove tag from device');
    }
  }
);

// Initial state
const initialState = {
  tags: [],
  currentTag: null,
  deviceTags: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    name: '',
    dataType: '',
    search: '',
  },
  loading: false,
  error: null,
};

// Slice
const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTag: (state) => {
      state.currentTag = null;
    },
    clearDeviceTags: (state) => {
      state.deviceTags = [];
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
      // Fetch Tags
      .addCase(fetchTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = action.payload.tags || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Tag By ID
      .addCase(fetchTagById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTagById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTag = action.payload;
      })
      .addCase(fetchTagById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Tag
      .addCase(createTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.loading = false;
        state.tags.unshift(action.payload);
      })
      .addCase(createTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Tag
      .addCase(updateTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tags.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tags[index] = action.payload;
        }
        if (state.currentTag?.id === action.payload.id) {
          state.currentTag = action.payload;
        }
      })
      .addCase(updateTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Tag
      .addCase(deleteTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.loading = false;
        state.tags = state.tags.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Device Tags
      .addCase(fetchDeviceTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeviceTags.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceTags = action.payload;
      })
      .addCase(fetchDeviceTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Assign Tag to Device
      .addCase(assignTagToDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTagToDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceTags.push(action.payload);
      })
      .addCase(assignTagToDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove Tag from Device
      .addCase(removeTagFromDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeTagFromDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceTags = state.deviceTags.filter(
          (dt) => !(dt.deviceId === action.payload.deviceId && dt.tagId === action.payload.tagId)
        );
      })
      .addCase(removeTagFromDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectTags = (state) => state.tags.tags;
export const selectCurrentTag = (state) => state.tags.currentTag;
export const selectDeviceTags = (state) => state.tags.deviceTags;
export const selectTagsPagination = (state) => state.tags.pagination;
export const selectTagsFilters = (state) => state.tags.filters;
export const selectTagsLoading = (state) => state.tags.loading;
export const selectTagsError = (state) => state.tags.error;

// Actions
export const { clearError, clearCurrentTag, clearDeviceTags, setFilters, setPagination } = tagsSlice.actions;

// Reducer
export default tagsSlice.reducer;
