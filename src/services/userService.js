/**
 * User Service
 * API calls for user management
 */

import api from './api';

/**
 * Get all users with filters, pagination, and search
 */
export const getAllUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data.data.user;
};

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data.data.user;
};

/**
 * Update a user
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data.data.user;
};

/**
 * Delete a user (soft delete)
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data.data;
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/users/${userId}/role`, { role });
  return response.data.data.user;
};

/**
 * Assign plants to user
 */
export const assignPlants = async (userId, plantIds) => {
  const response = await api.post(`/users/${userId}/plants`, { plantIds });
  return response.data.data;
};

/**
 * Get user's plants
 */
export const getUserPlants = async (userId, params = {}) => {
  const response = await api.get(`/users/${userId}/plants`, { params });
  return response.data.data;
};
