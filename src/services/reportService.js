/**
 * Report Service
 * API calls for report generation and management
 */

import api from './api';

/**
 * Generate a report
 * @param {Object} reportData - Report parameters
 * @param {string} reportData.reportType - Type of report (PLANT_PERFORMANCE, DEVICE_PERFORMANCE, ALARM, ENERGY_PRODUCTION)
 * @param {string} reportData.format - Report format (PDF, EXCEL)
 * @param {string} reportData.startDate - Start date (ISO string)
 * @param {string} reportData.endDate - End date (ISO string)
 * @param {string} reportData.plantId - Plant ID (optional)
 * @param {string} reportData.deviceId - Device ID (optional)
 * @param {string[]} reportData.plantIds - Array of plant IDs for multi-plant reports (optional)
 * @param {string} reportData.severity - Alarm severity filter (optional)
 * @returns {Blob} - Report file blob
 */
export const generateReport = async (reportData) => {
  const response = await api.post('/reports/generate', reportData, {
    responseType: 'blob',
  });

  return response.data;
};

/**
 * Get report history
 * @param {Object} params - Query parameters
 * @returns {Array} - List of generated reports
 */
export const getReportHistory = async (params = {}) => {
  const response = await api.get('/reports', { params });
  return response.data.data;
};

/**
 * Download a specific report
 * @param {string} reportId - Report ID
 * @param {string} format - Report format
 * @returns {Blob} - Report file blob
 */
export const downloadReport = async (reportId, format) => {
  const response = await api.get(`/reports/${reportId}/download`, {
    params: { format },
    responseType: 'blob',
  });

  return response.data;
};

/**
 * Delete a report
 * @param {string} reportId - Report ID
 * @returns {Object} - Success response
 */
export const deleteReport = async (reportId) => {
  const response = await api.delete(`/reports/${reportId}`);
  return response.data;
};

/**
 * Get report preview data (without downloading)
 * @param {Object} reportData - Report parameters
 * @returns {Object} - Report preview data
 */
export const getReportPreview = async (reportData) => {
  const response = await api.post('/reports/preview', reportData);
  return response.data.data;
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
 * Generate filename for report
 * @param {string} reportType - Report type
 * @param {string} format - Report format
 * @returns {string} - Generated filename
 */
export const generateReportFilename = (reportType, format) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx';
  const type = reportType.toLowerCase().replace(/_/g, '-');
  return `${type}-report-${timestamp}.${extension}`;
};
