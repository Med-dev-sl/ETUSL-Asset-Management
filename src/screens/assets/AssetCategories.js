import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import CategoryManagement from './CategoryManagement';

const AssetCategories = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset Categories
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <CategoryManagement />
      </Paper>
    </Box>
  );
};

export default AssetCategories;
