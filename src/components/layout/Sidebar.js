import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';

import PeopleIcon from '@mui/icons-material/People';

const menuItems = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  {
    title: 'User Management',
    path: '/admin/users',
    icon: <PeopleIcon />,
    subItems: [
      { title: 'Add/Edit Users', path: '/admin/users/manage' },
      { title: 'Roles & Permissions', path: '/admin/users/roles' },
      { title: 'Access Control', path: '/admin/users/access' }
    ]
  },
  {
    title: 'Assets',
    path: '/admin/assets/manage',
    icon: <InventoryIcon />,
    subItems: [
      { title: 'Add New Asset', path: '/admin/assets/new' },
      { title: 'Asset Management', path: '/admin/assets/manage' },
      { title: 'Asset History', path: '/admin/assets/history' },
      { title: 'Categories', path: '/admin/assets/categories' },
      { title: 'Disposal', path: '/admin/assets/disposal' }
    ]
  },
  {
    title: 'Departments',
    path: '/admin/departments/view',
    icon: <BusinessIcon />,
    subItems: [
      { title: 'Assign Assets', path: '/admin/departments/assign' },
      { title: 'View by Department', path: '/admin/departments/view' }
    ]
  },
  {
    title: 'Maintenance',
    path: '/admin/maintenance/schedule',
    icon: <EngineeringIcon />,
    subItems: [
      { title: 'Schedule Maintenance', path: '/admin/maintenance/schedule' },
      { title: 'Maintenance Logs', path: '/admin/maintenance/logs' },
      { title: 'Service Requests', path: '/admin/maintenance/requests' }
    ]
  },
  {
    title: 'Reports',
    path: '/admin/reports/generate',
    icon: <AssessmentIcon />,
    subItems: [
      { title: 'Generate Reports', path: '/admin/reports/generate' },
      { title: 'Asset Verification', path: '/admin/reports/verify' },
      { title: 'Audit Logs', path: '/admin/reports/audit' },
      { title: 'Export Data', path: '/admin/reports/export' }
    ]
  },
  {
    title: 'Procurement',
    path: '/admin/procurement/request',
    icon: <ShoppingCartIcon />,
    subItems: [
      { title: 'Raise Request', path: '/admin/procurement/request' },
      { title: 'View Requests', path: '/admin/procurement/view' },
      { title: 'Manage Vendors', path: '/admin/procurement/vendors' },
      { title: 'Approved Purchases', path: '/admin/procurement/approved' }
    ]
  },
  {
    title: 'Settings',
    path: '/admin/settings/profile',
    icon: <SettingsIcon />,
    subItems: [
      { title: 'Profile', path: '/admin/settings/profile' },
      { title: 'System Settings', path: '/admin/settings/system' },
      { title: 'Backup & Restore', path: '/admin/settings/backup' },
      { title: 'Notifications', path: '/admin/settings/notifications' }
    ]
  }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleMenuClick = (item) => {
    if (item.subItems) {
      setOpenMenus(prev => ({
        ...prev,
        [item.title]: !prev[item.title]
      }));
    } else {
      handleNavigation(item.path);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white'
        }
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8 }}>
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.title}>
              <ListItem
                button
                onClick={() => handleMenuClick(item)}
                selected={location.pathname.startsWith(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: location.pathname.startsWith(item.path) ? 'bold' : 'normal' }}>
                      {item.title}
                    </Typography>
                  }
                />
                {item.subItems && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(item);
                    }}
                    sx={{ color: 'white', padding: 0 }}
                  >
                    {openMenus[item.title] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </ListItem>
              {item.subItems && (
                <Collapse in={openMenus[item.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map(subItem => (
                      <ListItem
                        key={subItem.path}
                        button
                        onClick={() => handleNavigation(subItem.path)}
                        selected={location.pathname === subItem.path}
                        sx={{
                          pl: 4,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)'
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: location.pathname === subItem.path ? 'bold' : 'normal' }}>
                              {subItem.title}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
              <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
