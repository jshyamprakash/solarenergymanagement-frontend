/**
 * Masters Page
 * Unified page for all master data management with tabs
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Category as TemplateIcon,
  Label as TagIcon,
} from '@mui/icons-material';
import DeviceTypes from './DeviceTypes';
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
  const isAdmin = useSelector(selectIsAdmin);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Define tabs based on user role
  const getAvailableTabs = () => {
    const tabs = [
      {
        index: 0,
        label: 'Device Templates',
        icon: <TemplateIcon />,
        adminOnly: true,
        component: <DeviceTypes />
      },
      {
        index: 1,
        label: 'Tag Management',
        icon: <TagIcon />,
        adminOnly: true,
        component: <TagManagement />
      }
    ];

    // Filter tabs based on user role
    return tabs.filter(tab => !tab.adminOnly || isAdmin);
  };

  const availableTabs = getAvailableTabs();

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Master Data Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAdmin 
            ? 'Manage device templates and tags'
            : 'Device templates and tags require administrator privileges'
          }
        </Typography>
      </Box>

      {/* Admin Access Alert */}
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Device templates and tag management require administrator privileges. Contact your system administrator for access.
        </Alert>
      )}

      {/* Tabbed Interface */}
      {availableTabs.length > 0 ? (
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="master data tabs"
              variant="fullWidth"
            >
              {availableTabs.map((tab) => (
                <Tab
                  key={tab.index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  id={`masters-tab-${tab.index}`}
                  aria-controls={`masters-tabpanel-${tab.index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Panels */}
          {availableTabs.map((tab) => (
            <TabPanel key={tab.index} value={activeTab} index={tab.index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>
      ) : (
        <Alert severity="warning">
          You don't have permission to access any master data management features. Please contact your administrator.
        </Alert>
      )}
    </Box>
  );
};

export default Masters;
