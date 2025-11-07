/**
 * Authentication Context
 * Manages authentication state across the app
 */

import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // Restore user from localStorage
        setUser(JSON.parse(storedUser));

        // Optionally verify token is still valid
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (err) {
          // Token invalid, clear auth state
          handleLogout();
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const data = await authService.login(email, password);

      // Store tokens and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);

      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear state
      setUser(null);
      setError(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isPlantManager: user?.role === 'PLANT_MANAGER',
    isViewer: user?.role === 'VIEWER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
