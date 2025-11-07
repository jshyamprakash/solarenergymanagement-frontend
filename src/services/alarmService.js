/**
 * Alarm API Service
 * Handles HTTP requests for alarm management
 */

import api from './api';

/**
 * Get all alarms with filters and pagination
 * @param {Object} params - Query parameters
 */
export const getAllAlarms = async (params = {}) => {
  const response = await api.get('/alarms', { params });
  return response.data.data;
};

/**
 * Get alarm by ID
 * @param {string} alarmId - Alarm ID
 */
export const getAlarmById = async (alarmId) => {
  const response = await api.get(`/alarms/${alarmId}`);
  return response.data.data;
};

/**
 * Create a new alarm
 * @param {Object} alarmData - Alarm data
 */
export const createAlarm = async (alarmData) => {
  const response = await api.post('/alarms', alarmData);
  return response.data.data;
};

/**
 * Acknowledge an alarm
 * @param {string} alarmId - Alarm ID
 * @param {Object} data - Acknowledgment data (note, etc.)
 */
export const acknowledgeAlarm = async (alarmId, data = {}) => {
  const response = await api.put(`/alarms/${alarmId}/acknowledge`, data);
  return response.data.data;
};

/**
 * Resolve an alarm
 * @param {string} alarmId - Alarm ID
 * @param {Object} data - Resolution data (note, etc.)
 */
export const resolveAlarm = async (alarmId, data = {}) => {
  const response = await api.put(`/alarms/${alarmId}/resolve`, data);
  return response.data.data;
};

/**
 * Get alarms for a specific plant
 * @param {string} plantId - Plant ID
 * @param {Object} params - Query parameters
 */
export const getPlantAlarms = async (plantId, params = {}) => {
  const response = await api.get(`/plants/${plantId}/alarms`, { params });
  return response.data.data;
};

/**
 * Get alarms for a specific device
 * @param {string} deviceId - Device ID
 * @param {Object} params - Query parameters
 */
export const getDeviceAlarms = async (deviceId, params = {}) => {
  const response = await api.get(`/devices/${deviceId}/alarms`, { params });
  return response.data.data;
};

/**
 * Get alarm statistics
 * @param {string} plantId - Optional plant ID filter
 */
export const getAlarmStatistics = async (plantId = null) => {
  const params = plantId ? { plantId } : {};
  const response = await api.get('/alarms/statistics', { params });
  return response.data.data;
};
