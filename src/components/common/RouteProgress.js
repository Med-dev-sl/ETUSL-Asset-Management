import React from 'react';
import { LinearProgress, Box } from '@mui/material';
import { useRouteTransition } from '../../hooks/useRouteTransition';

const RouteProgress = () => {
  const { isTransitioning } = useRouteTransition();

  if (!isTransitioning) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}
    >
      <LinearProgress color="primary" />
    </Box>
  );
};

export default RouteProgress;
