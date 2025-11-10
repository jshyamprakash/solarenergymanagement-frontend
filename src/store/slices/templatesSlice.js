/**
 * Templates Slice
 * Redux slice for device templates state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as templateService from '../../services/templateService';

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await templateService.getAllTemplates(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'templates/fetchTemplateById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await templateService.getTemplateById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template');
    }
  }
);

export const fetchTemplateByShortform = createAsyncThunk(
  'templates/fetchTemplateByShortform',
  async (shortform, { rejectWithValue }) => {
    try {
      const data = await templateService.getTemplateByShortform(shortform);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const data = await templateService.createTemplate(templateData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create template');
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ id, templateData }, { rejectWithValue }) => {
    try {
      const data = await templateService.updateTemplate(id, templateData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (id, { rejectWithValue }) => {
    try {
      await templateService.deleteTemplate(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete template');
    }
  }
);

export const addTagToTemplate = createAsyncThunk(
  'templates/addTagToTemplate',
  async ({ templateId, tagData }, { rejectWithValue }) => {
    try {
      const data = await templateService.addTagToTemplate(templateId, tagData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add tag to template');
    }
  }
);

export const updateTemplateTag = createAsyncThunk(
  'templates/updateTemplateTag',
  async ({ tagId, tagData }, { rejectWithValue }) => {
    try {
      const data = await templateService.updateTemplateTag(tagId, tagData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update template tag');
    }
  }
);

export const deleteTemplateTag = createAsyncThunk(
  'templates/deleteTemplateTag',
  async (tagId, { rejectWithValue }) => {
    try {
      await templateService.deleteTemplateTag(tagId);
      return tagId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete template tag');
    }
  }
);

// Initial state
const initialState = {
  templates: [],
  currentTemplate: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    name: '',
    deviceType: '',
    isActive: '',
    search: '',
  },
  loading: false,
  error: null,
};

// Slice
const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
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
      // Fetch Templates
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Template By ID
      .addCase(fetchTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Template By Shortform
      .addCase(fetchTemplateByShortform.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplateByShortform.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchTemplateByShortform.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Template
      .addCase(createTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates.unshift(action.payload);
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Template
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.templates.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.currentTemplate?.id === action.payload.id) {
          state.currentTemplate = action.payload;
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Template
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Tag to Template
      .addCase(addTagToTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTagToTemplate.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTemplate) {
          if (!state.currentTemplate.tags) {
            state.currentTemplate.tags = [];
          }
          state.currentTemplate.tags.push(action.payload);
        }
      })
      .addCase(addTagToTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Template Tag
      .addCase(updateTemplateTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTemplateTag.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTemplate?.tags) {
          const index = state.currentTemplate.tags.findIndex((t) => t.id === action.payload.id);
          if (index !== -1) {
            state.currentTemplate.tags[index] = action.payload;
          }
        }
      })
      .addCase(updateTemplateTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Template Tag
      .addCase(deleteTemplateTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplateTag.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentTemplate?.tags) {
          state.currentTemplate.tags = state.currentTemplate.tags.filter(
            (t) => t.id !== action.payload
          );
        }
      })
      .addCase(deleteTemplateTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectTemplates = (state) => state.templates.templates;
export const selectCurrentTemplate = (state) => state.templates.currentTemplate;
export const selectTemplatesPagination = (state) => state.templates.pagination;
export const selectTemplatesFilters = (state) => state.templates.filters;
export const selectTemplatesLoading = (state) => state.templates.loading;
export const selectTemplatesError = (state) => state.templates.error;

// Actions
export const { clearError, clearCurrentTemplate, setFilters, setPagination } = templatesSlice.actions;

// Reducer
export default templatesSlice.reducer;
