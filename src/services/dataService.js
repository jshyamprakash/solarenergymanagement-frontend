/**
 * Data API Service
 * Handles time-series data and analytics API calls
 */

import api from './api';

/**
 * Get time-series data for a device
 * @param {string} deviceId - Device ID
 * @param {Object} params - Query parameters (tagName, startTime, endTime, interval)
 */
export const getDeviceData = async (deviceId, params = {}) => {
  const response = await api.get(`/data/device/${deviceId}`, { params });
  return response.data;
};

/**
 * Get aggregated data for a plant
 * @param {string} plantId - Plant ID
 * @param {Object} params - Query parameters (startTime, endTime, interval)
 */
export const getPlantData = async (plantId, params = {}) => {
  const response = await api.get(`/data/plant/${plantId}`, { params });
  return response.data;
};

/**
 * Get latest readings for a device
 * @param {string} deviceId - Device ID
 */
export const getDeviceLatestData = async (deviceId) => {
  const response = await api.get(`/data/device/${deviceId}/latest`);
  return response.data;
};

/**
 * Get energy production summary for a plant
 * @param {string} plantId - Plant ID
 * @param {Object} params - Query parameters (startDate, endDate, groupBy)
 */
export const getPlantEnergySummary = async (plantId, params = {}) => {
  const response = await api.get(`/data/plant/${plantId}/energy`, { params });
  return response.data;
};

/**
 * Get performance metrics for a device
 * @param {string} deviceId - Device ID
 * @param {Object} params - Query parameters (startTime, endTime)
 */
export const getDevicePerformance = async (deviceId, params = {}) => {
  const response = await api.get(`/data/device/${deviceId}/performance`, { params });
  return response.data;
};

/**
 * Mock data generator for development (when backend endpoints are not ready)
 */
export const generateMockTimeSeriesData = (hours = 24, interval = 'hour') => {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // Simulate solar production curve (peak at noon)
    const sunFactor = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
    const randomVariation = 0.9 + Math.random() * 0.2;

    data.push({
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      activePower: Math.round(sunFactor * 1000 * randomVariation * 100) / 100,
      voltage: 230 + Math.random() * 10 - 5,
      current: Math.round(sunFactor * 50 * randomVariation * 100) / 100,
      energy: Math.round(sunFactor * 25 * randomVariation * 100) / 100,
      temperature: 25 + sunFactor * 15 + Math.random() * 5,
    });
  }

  return data;
};

/**
 * Generate mock energy summary data
 */
export const generateMockEnergySummary = (days = 7) => {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();

    // Lower production on weekends (for variety)
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    const randomVariation = 0.8 + Math.random() * 0.4;

    data.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      energy: Math.round(150 * weekendFactor * randomVariation * 100) / 100,
      peakPower: Math.round(1200 * weekendFactor * randomVariation),
      efficiency: Math.round((75 + Math.random() * 15) * 100) / 100,
    });
  }

  return data;
};
