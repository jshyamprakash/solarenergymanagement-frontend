/**
 * Management Page
 * Unified page for management operations with tabs
 * Includes Plant Management, User Management, and User-Plant Access
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Factory as PlantIcon,
  People as UserIcon,
  Assignment as UserPlantIcon,
  AccountTree as HierarchyIcon,
} from '@mui/icons-material';
import { selectIsAdmin } from '../store/slices/authSlice';
import Plants from './Plants';
import Users from './Users';
import UserPlantManagement from './UserPlantManagement';
import HierarchyBuilder from './HierarchyBuilder';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
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

const Management = () => {
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
        label: 'Plant Management',
        icon: <PlantIcon />,
        adminOnly: false, // All users can view plants
        component: <Plants />
      },
      {
        index: 1,
        label: 'User Management',
        icon: <UserIcon />,
        adminOnly: true,
        component: <Users />
      },
      {
        index: 2,
        label: 'User Plant Map',
        icon: <UserPlantIcon />,
        adminOnly: true,
        component: <UserPlantManagement />
      },
      {
        index: 3,
        label: 'Plant Hierarchy',
        icon: <HierarchyIcon />,
        adminOnly: true,
        component: <HierarchyBuilder />
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
          Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAdmin 
            ? 'Manage plants, users, user plant mappings, and plant hierarchy'
            : 'Manage your assigned plants and view plant information'
          }
        </Typography>
      </Box>

      {/* Admin Access Alert */}
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Some management features require administrator privileges. Contact your system administrator for access to user management and system configuration.
        </Alert>
      )}

      {/* Tabbed Interface */}
      {availableTabs.length > 0 ? (
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="management tabs"
              variant="fullWidth"
            >
              {availableTabs.map((tab) => (
                <Tab
                  key={tab.index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  id={`management-tab-${tab.index}`}
                  aria-controls={`management-tabpanel-${tab.index}`}
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
          You don't have permission to access any management features. Please contact your administrator.
        </Alert>
      )}
    </Box>
  );
};

export default Management;