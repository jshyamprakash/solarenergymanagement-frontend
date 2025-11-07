/**
 * Authentication Service
 * API calls for authentication
 */

import api from './api';

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken) => {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data.data;
};
