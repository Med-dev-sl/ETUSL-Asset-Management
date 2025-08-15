

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';


const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  // Start with sidebar closed

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/';
  };

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header 
        title="ETUSL Asset Management - Admin Dashboard"
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
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
          mt: 8,
          transition: 'margin 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
          marginLeft: sidebarOpen ? '280px' : 0
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h4" gutterBottom>
                Welcome, Admin
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your asset management system from this dashboard.
              </Typography>
            </Paper>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
              <Typography variant="h6" gutterBottom>
                Total Assets
              </Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                0
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
              <Typography variant="h6" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                0
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
              <Typography variant="h6" gutterBottom>
                Pending Requests
              </Typography>
              <Typography variant="h3" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                0
              </Typography>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent activity to display
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
