/**
 * Device API Service
 * Handles all device-related API calls
 */

import api from './api';

/**
 * Get all devices with optional filters and pagination
 */
export const getAllDevices = async (params = {}) => {
  const response = await api.get('/devices', { params });
  return response.data;
};

/**
 * Get device by ID
 */
export const getDeviceById = async (id) => {
  const response = await api.get(`/devices/${id}`);
  return response.data.data;
};

/**
 * Create a new device
 */
export const createDevice = async (deviceData) => {
  const response = await api.post('/devices', deviceData);
  return response.data.data;
};

/**
 * Create a new device from template
 */
export const createDeviceFromTemplate = async (deviceData) => {
  const response = await api.post('/devices/from-template', deviceData);
  return response.data.data;
};

/**
 * Update device
 */
export const updateDevice = async (id, deviceData) => {
  const response = await api.put(`/devices/${id}`, deviceData);
  return response.data.data;
};

/**
 * Delete device
 */
export const deleteDevice = async (id) => {
  const response = await api.delete(`/devices/${id}`);
  return response.data;
};

/**
 * Get device hierarchy for a plant
 */
export const getDeviceHierarchy = async (plantId) => {
  const response = await api.get(`/devices/hierarchy/${plantId}`);
  return response.data.data;
};

/**
 * Get device children
 */
export const getDeviceChildren = async (id) => {
  const response = await api.get(`/devices/${id}/children`);
  return response.data.data;
};
