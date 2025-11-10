/**
 * Audit Service
 * API calls for audit log viewing
 */

import api from './api';

/**
 * Get audit logs with filters
 * @param {Object} filters - Filter parameters
 * @param {string} filters.entityType - Entity type (User, Plant, Device, Tag, Alarm)
 * @param {string} filters.action - Action type (CREATE, UPDATE, DELETE, ACKNOWLEDGE)
 * @param {string} filters.userId - User ID filter
 * @param {string} filters.startDate - Start date (ISO string)
 * @param {string} filters.endDate - End date (ISO string)
 * @param {string} filters.entityId - Entity ID filter
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - Audit logs with pagination
 */
export const getAuditLogs = async (filters = {}, page = 1, limit = 50) => {
  const params = {
    ...filters,
    page,
    limit,
  };

  const response = await api.get('/audit', { params });
  return response.data.data;
};

/**
 * Get audit statistics
 * @param {Object} filters - Optional filters
 * @returns {Object} - Statistics data
 */
export const getAuditStats = async (filters = {}) => {
  const response = await api.get('/audit/stats', { params: filters });
  return response.data.data;
};

/**
 * Get audit history for a specific entity
 * @param {string} entityType - Entity type (User, Plant, Device, Tag, Alarm)
 * @param {string} entityId - Entity ID
 * @returns {Array} - Audit log entries for the entity
 */
export const getEntityAuditHistory = async (entityType, entityId) => {
  const response = await api.get(`/audit/entity/${entityType}/${entityId}`);
  return response.data.data;
};

/**
 * Export audit logs
 * @param {string} format - Export format (CSV, JSON)
 * @param {Object} filters - Filter parameters
 * @returns {Blob} - Export file blob
 */
export const exportAuditLogs = async (format, filters = {}) => {
  const response = await api.post('/audit/export', {
    format,
    ...filters,
  }, {
    responseType: 'blob',
  });

  return response.data;
};

/**
 * Helper function to download blob as file
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Format change data for display
 * @param {Object} changes - Changes object
 * @returns {Object} - Formatted changes
 */
export const formatChanges = (changes) => {
  if (!changes) return null;

  try {
    return typeof changes === 'string' ? JSON.parse(changes) : changes;
  } catch (err) {
    console.error('Failed to parse changes:', err);
    return changes;
  }
};

/**
 * Get action color based on action type
 * @param {string} action - Action type
 * @returns {string} - Material-UI color
 */
export const getActionColor = (action) => {
  switch (action) {
    case 'CREATE':
      return 'success';
    case 'UPDATE':
      return 'info';
    case 'DELETE':
      return 'error';
    case 'ACKNOWLEDGE':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get relative time string
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return time.toLocaleDateString();
};
