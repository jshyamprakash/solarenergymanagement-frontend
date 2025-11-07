/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated, selectAuthLoading } from '../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
