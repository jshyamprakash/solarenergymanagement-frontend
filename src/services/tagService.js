/**
 * Tag API Service
 * Handles all tag-related API calls
 */

import api from './api';

/**
 * Get all tags with optional filters and pagination
 */
export const getAllTags = async (params = {}) => {
  const response = await api.get('/tags', { params });
  return response.data.data;
};

/**
 * Get tag by ID
 */
export const getTagById = async (id) => {
  const response = await api.get(`/tags/${id}`);
  return response.data.data;
};

/**
 * Create a new tag
 */
export const createTag = async (tagData) => {
  const response = await api.post('/tags', tagData);
  return response.data.data;
};

/**
 * Update tag
 */
export const updateTag = async (id, tagData) => {
  const response = await api.put(`/tags/${id}`, tagData);
  return response.data.data;
};

/**
 * Delete tag
 */
export const deleteTag = async (id) => {
  const response = await api.delete(`/tags/${id}`);
  return response.data;
};

/**
 * Get tags assigned to a device
 */
export const getDeviceTags = async (deviceId) => {
  const response = await api.get(`/tags/device/${deviceId}`);
  return response.data.data;
};

/**
 * Assign tag to device
 */
export const assignTagToDevice = async (deviceId, tagId, mqttPath) => {
  const response = await api.post(`/tags/assign`, {
    deviceId,
    tagId,
    mqttPath,
  });
  return response.data.data;
};

/**
 * Remove tag from device
 */
export const removeTagFromDevice = async (deviceId, tagId) => {
  const response = await api.delete(`/tags/assign/${deviceId}/${tagId}`);
  return response.data;
};

/**
 * Test MQTT payload extraction
 */
export const testMqttPayload = async (payload) => {
  const response = await api.post('/tags/test-extraction', { payload });
  return response.data.data;
};
