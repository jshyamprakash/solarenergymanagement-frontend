/**
 * MQTT Payload Tester Component
 * Test tag extraction from MQTT JSON payloads
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { PlayArrow as TestIcon } from '@mui/icons-material';
import { testMqttPayload } from '../../services/tagService';

const MqttPayloadTester = () => {
  const [payload, setPayload] = useState('{\n  "voltage": 230.5,\n  "current": 12.3,\n  "power": 2835.15,\n  "timestamp": "2024-01-15T10:30:00Z"\n}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  const handleTest = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate JSON
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (err) {
        setError('Invalid JSON format. Please check your payload syntax.');
        return;
      }

      // Call API to test extraction
      const result = await testMqttPayload(parsedPayload);
      setExtractedData(result);
    } catch (err) {
      setError(err.message || 'Failed to test payload extraction');
      setExtractedData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          MQTT Payload Tester
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Test how tags will be extracted from your MQTT JSON payloads. Paste a sample payload below and click Test Extraction.
        </Typography>

        {/* Payload Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="MQTT JSON Payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{\n  "voltage": 230.5,\n  "current": 12.3\n}'
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        </Box>

        {/* Test Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <TestIcon />}
            onClick={handleTest}
            disabled={loading || !payload.trim()}
          >
            {loading ? 'Testing...' : 'Test Extraction'}
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {extractedData && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Extraction Results
            </Typography>

            {extractedData.extracted && extractedData.extracted.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Tag Name</strong></TableCell>
                      <TableCell><strong>MQTT Path</strong></TableCell>
                      <TableCell><strong>Extracted Value</strong></TableCell>
                      <TableCell><strong>Data Type</strong></TableCell>
                      <TableCell><strong>Unit</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {extractedData.extracted.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.tagName}</TableCell>
                        <TableCell>
                          <code style={{ fontSize: '0.875rem' }}>{item.mqttPath}</code>
                        </TableCell>
                        <TableCell>
                          <strong>{formatValue(item.value)}</strong>
                        </TableCell>
                        <TableCell>{item.dataType}</TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No tags were extracted from this payload. Make sure you have tags configured with matching MQTT paths.
              </Alert>
            )}

            {/* Show parsed payload structure */}
            {extractedData.payloadStructure && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Payload Structure (Available Paths)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{ fontFamily: 'monospace', fontSize: '0.875rem', m: 0 }}
                  >
                    {JSON.stringify(extractedData.payloadStructure, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MqttPayloadTester;
