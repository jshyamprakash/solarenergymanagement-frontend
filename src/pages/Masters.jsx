/**
 * Masters Page
 * Unified page for all master data management with tabs
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Category as TemplateIcon,
  AccountTree as HierarchyIcon,
  Label as TagIcon,
} from '@mui/icons-material';
import DeviceTypes from './DeviceTypes';
import HierarchyBuilder from './HierarchyBuilder';
import TagManagement from './TagManagement';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`masters-tabpanel-${index}`}
      aria-labelledby={`masters-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Masters = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Master Data Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage device templates, hierarchy rules, and tags
        </Typography>
      </Box>

      {/* Tabbed Interface */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="master data tabs"
            variant="fullWidth"
          >
            <Tab
              icon={<TemplateIcon />}
              iconPosition="start"
              label="Device Templates"
              id="masters-tab-0"
              aria-controls="masters-tabpanel-0"
            />
            <Tab
              icon={<HierarchyIcon />}
              iconPosition="start"
              label="Hierarchy Viewer"
              id="masters-tab-1"
              aria-controls="masters-tabpanel-1"
            />
            <Tab
              icon={<TagIcon />}
              iconPosition="start"
              label="Tag Management"
              id="masters-tab-2"
              aria-controls="masters-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <DeviceTypes />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <HierarchyBuilder />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TagManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Masters;
