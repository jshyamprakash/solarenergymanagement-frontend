/**
 * Plant Service
 * API calls for plant management
 */

import api from './api';

/**
 * Get all plants with filters and pagination (Admin only)
 */
export const getAllPlants = async (params = {}) => {
  const response = await api.get('/plants', { params });
  return response.data.data;
};

/**
 * Get accessible plants for current user (respects permissions)
 */
export const getAccessiblePlants = async (params = {}) => {
  const response = await api.get('/user-plant-map/accessible', { params });
  return response.data.data;
};

/**
 * Get plant by ID
 */
export const getPlantById = async (plantId, includeDevices = false) => {
  const response = await api.get(`/plants/${plantId}`, {
    params: { includeDevices },
  });
  return response.data.data.plant;
};

/**
 * Create a new plant
 */
export const createPlant = async (plantData) => {
  const response = await api.post('/plants', plantData);
  return response.data.data.plant;
};

/**
 * Update a plant
 */
export const updatePlant = async (plantId, plantData) => {
  const response = await api.put(`/plants/${plantId}`, plantData);
  return response.data.data.plant;
};

/**
 * Delete a plant
 */
export const deletePlant = async (plantId) => {
  const response = await api.delete(`/plants/${plantId}`);
  return response.data.data;
};

/**
 * Get plant statistics
 */
export const getPlantStats = async (plantId) => {
  const response = await api.get(`/plants/${plantId}/stats`);
  return response.data.data.stats;
};
