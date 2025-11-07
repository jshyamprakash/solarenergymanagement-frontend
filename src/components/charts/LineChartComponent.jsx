/**
 * Reusable Line Chart Component
 * Uses Recharts for rendering time-series data
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const LineChartComponent = ({
  data = [],
  title,
  xDataKey = 'time',
  lines = [],
  height = 300,
  showLegend = true,
  showGrid = true,
}) => {
  const theme = useTheme();

  return (
    <Paper sx={{ p: 3 }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis
              dataKey={xDataKey}
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
              }}
            />
            {showLegend && <Legend />}
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name || line.dataKey}
                stroke={line.color || theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default LineChartComponent;
