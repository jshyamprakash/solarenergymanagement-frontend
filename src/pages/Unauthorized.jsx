/**
 * Unauthorized Page
 * Shown when user doesn't have required permissions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

const Unauthorized = () => {
  const navigate = useNavigate();

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
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have permission to access this page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;
