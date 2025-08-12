import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 400,
      width: '100%'
    }}
  >
    <CircularProgress />
  </Box>
);

export default PageLoader;
