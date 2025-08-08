import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box
} from '@mui/material';
import { Menu as MenuIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';

const Header = ({ title, onMenuClick, onLogout }) => {
  return (
    <AppBar position="fixed" sx={{ backgroundColor: '#003366', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title || 'ETUSL Asset Management'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            color="inherit" 
            onClick={onLogout} 
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
