import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from '../Header';
import Sidebar from '../Sidebar';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${280}px)` },
          mt: '64px', // Height of AppBar
          ml: { sm: sidebarOpen ? `${280}px` : 0 },
          transition: theme =>
            theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
