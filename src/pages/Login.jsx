/**
 * Login Page
 * User authentication page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LightMode as SunIcon } from '@mui/icons-material';
import { login as loginAction, selectIsAuthenticated, selectAuthError, selectAuthLoading } from '../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const authLoading = useSelector(selectAuthLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const resultAction = await dispatch(loginAction({ email, password }));

    if (loginAction.fulfilled.match(resultAction)) {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SunIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Solar Energy Monitor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {/* Error Alert */}
          {authError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={authLoading}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={authLoading}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={authLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {authLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Demo Credentials:
            </Typography>
            <Typography variant="caption" display="block">
              Admin: admin@solar.com / Admin123!
            </Typography>
            <Typography variant="caption" display="block">
              Manager: manager@solar.com / Manager123!
            </Typography>
            <Typography variant="caption" display="block">
              Viewer: viewer@solar.com / Viewer123!
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
