/**
 * Device Template API Service
 * Handles all template-related API calls
 */

import api from './api';

/**
 * Get all device templates with optional filters and pagination
 */
export const getAllTemplates = async (params = {}) => {
  const response = await api.get('/templates', { params });
  return response.data;
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id) => {
  const response = await api.get(`/templates/${id}`);
  return response.data.data;
};

/**
 * Get template by shortform
 */
export const getTemplateByShortform = async (shortform) => {
  const response = await api.get(`/templates/shortform/${shortform}`);
  return response.data.data;
};

/**
 * Create a new device template
 */
export const createTemplate = async (templateData) => {
  const response = await api.post('/templates', templateData);
  return response.data.data;
};

/**
 * Update device template
 */
export const updateTemplate = async (id, templateData) => {
  const response = await api.put(`/templates/${id}`, templateData);
  return response.data.data;
};

/**
 * Delete device template
 */
export const deleteTemplate = async (id) => {
  const response = await api.delete(`/templates/${id}`);
  return response.data;
};

/**
 * Add tag to template
 */
export const addTagToTemplate = async (templateId, tagData) => {
  const response = await api.post(`/templates/${templateId}/tags`, tagData);
  return response.data.data;
};

/**
 * Update template tag
 */
export const updateTemplateTag = async (tagId, tagData) => {
  const response = await api.put(`/templates/tags/${tagId}`, tagData);
  return response.data.data;
};

/**
 * Delete template tag
 */
export const deleteTemplateTag = async (tagId) => {
  const response = await api.delete(`/templates/tags/${tagId}`);
  return response.data;
};

/**
 * Get hierarchy rules for template
 */
export const getHierarchyRules = async (templateId) => {
  const response = await api.get(`/templates/${templateId}/hierarchy-rules`);
  return response.data.data;
};

/**
 * Create hierarchy rule
 */
export const createHierarchyRule = async (ruleData) => {
  const response = await api.post('/templates/hierarchy-rules', ruleData);
  return response.data.data;
};

/**
 * Delete hierarchy rule
 */
export const deleteHierarchyRule = async (ruleId) => {
  const response = await api.delete(`/templates/hierarchy-rules/${ruleId}`);
  return response.data;
};
