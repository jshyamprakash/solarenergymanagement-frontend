/**
 * Reusable Bar Chart Component
 * Uses Recharts for rendering categorical data
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const BarChartComponent = ({
  data = [],
  title,
  xDataKey = 'label',
  bars = [],
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
          <BarChart data={data}>
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
            {bars.map((bar, index) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name || bar.dataKey}
                fill={bar.color || theme.palette.primary.main}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default BarChartComponent;
