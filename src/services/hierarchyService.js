/**
 * Hierarchy Service
 * API calls for device hierarchy management
 */

import api from './api';

/**
 * Get complete plant hierarchy with all devices
 */
export const getPlantHierarchy = async (plantId) => {
  const response = await api.get(`/hierarchy/plant/${plantId}`);
  return response.data.data;
};

/**
 * Get hierarchical tree structure (nested format)
 */
export const getHierarchyTree = async (plantId) => {
  const response = await api.get(`/hierarchy/tree/${plantId}`);
  return response.data.data;
};

/**
 * Assign a parent device to a device
 */
export const assignParent = async (deviceId, parentId) => {
  const response = await api.post('/hierarchy/assign-parent', {
    deviceId,
    parentId,
  });
  return response.data.data;
};

/**
 * Remove parent from a device (make it root level)
 */
export const removeParent = async (deviceId) => {
  const response = await api.post('/hierarchy/remove-parent', {
    deviceId,
  });
  return response.data.data;
};

/**
 * Validate hierarchy operation (prevent cycles)
 */
export const validateHierarchy = async (deviceId, parentId) => {
  const response = await api.post('/hierarchy/validate', {
    deviceId,
    parentId,
  });
  return response.data.data;
};

/**
 * Bulk assign parent to multiple devices
 */
export const bulkAssignParent = async (deviceIds, parentId) => {
  const promises = deviceIds.map((deviceId) =>
    assignParent(deviceId, parentId)
  );
  return Promise.all(promises);
};

/**
 * Bulk remove parent from multiple devices
 */
export const bulkRemoveParent = async (deviceIds) => {
  const promises = deviceIds.map((deviceId) =>
    removeParent(deviceId)
  );
  return Promise.all(promises);
};
