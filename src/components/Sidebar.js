import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  AddBox,
  List as ListIcon,
  History as HistoryIcon,
  AccountBox,
  Security,
  DeleteOutline,
  Business as BusinessIcon,
  AssignmentInd as AssignmentIndIcon,
  ListAlt as ListAltIcon,
  LocationOn as LocationOnIcon,
  Build as BuildIcon,
  Event as EventIcon,
  ShoppingCart as ShoppingCartIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  NotificationsActive as NotificationsActiveIcon,
  Assessment as AssessmentIcon,
  FactCheck as FactCheckIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  SaveAlt,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

const menuItems = [
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/admin/dashboard'
  },
  {
    title: 'Inventory',
    icon: <InventoryIcon />,
    submenu: [
      {
        title: 'Add Item',
        icon: <AddBox />,
        path: '/admin/inventory/add'
      },
      {
        title: 'Stores Request',
        icon: <AssignmentIcon />,
        path: '/admin/inventory/request'
      },
      {
        title: 'Request Status',
        icon: <FactCheckIcon />,
        path: '/admin/inventory/request-status'
      },
      {
        title: 'Approve Requests',
        icon: <CheckCircleOutlineIcon />,
        path: '/admin/inventory/approve'
      },
      {
        title: 'Stock Levels',
        icon: <ListAltIcon />,
        path: '/admin/inventory/stock'
      },
      {
        title: 'Consumables',
        icon: <ListIcon />,
        path: '/admin/inventory/consumables'
      },
      {
        title: 'Alerts',
        icon: <NotificationsActiveIcon />,
        path: '/admin/inventory/alerts'
      },
      {
        title: 'History',
        icon: <HistoryIcon />,
        path: '/admin/inventory/history'
      },
      {
        title: 'Categories',
        icon: <ListIcon />,
        path: '/admin/inventory/categories'
      }
    ]
  },
  {
    title: 'Audit & Reports',
    icon: <AssessmentIcon />,
    submenu: [
      {
        title: 'Generate Reports',
        icon: <AssessmentIcon />,
        path: '/admin/reports/generate'
      },
      {
        title: 'Asset Verification',
        icon: <FactCheckIcon />,
        path: '/admin/reports/verify'
      },
      {
        title: 'Audit Logs',
        icon: <VisibilityIcon />,
        path: '/admin/reports/audit'
      },
      {
        title: 'Export Data',
        icon: <FileDownloadIcon />,
        path: '/admin/reports/export'
      }
    ]
  },
  {
    title: 'Asset Management',
    icon: <InventoryIcon />,
    submenu: [
      {
        title: 'Add New Asset',
        icon: <AddBox />,
        path: '/admin/assets/new'
      },
      {
        title: 'View/Edit Assets',
        icon: <ListIcon />,
        path: '/admin/assets/manage'
      },
      {
        title: 'Asset History',
        icon: <HistoryIcon />,
        path: '/admin/assets/history'
      },
      {
        title: 'Asset Categories',
        icon: <ListIcon />,
        path: '/admin/assets/categories'
      },
      {
        title: 'Asset Disposal',
        icon: <DeleteOutline />,
        path: '/admin/assets/disposal'
      }
    ]
  },
  {
    title: 'Departments & Locations',
    icon: <BusinessIcon />,
    submenu: [
      {
        title: 'Assign to Department',
        icon: <AssignmentIndIcon />,
        path: '/admin/departments/assign'
      },
      {
        title: 'View by Department',
        icon: <ListAltIcon />,
        path: '/admin/departments/view'
      },
      {
        title: 'Add Department, Head & Dean',
        icon: <AddCircleOutlineIcon />,
        path: '/admin/departments/add-head'
      },
      {
        title: 'Departments, Heads & Deans',
        icon: <ListIcon />,
        path: '/admin/departments/list-heads'
      },
      {
        title: 'Manage Locations',
        icon: <LocationOnIcon />,
        path: '/admin/locations/manage'
      }
    ]
  },
  {
    title: 'User Management',
    icon: <PeopleIcon />,
    submenu: [
      {
        title: 'Manage Users',
        icon: <ListIcon />,
        path: '/admin/users/manage'
      },
      {
        title: 'User Roles',
        icon: <Security />,
        path: '/admin/users/roles'
      },
      {
        title: 'Access Control',
        icon: <Security />,
        path: '/admin/users/permissions'
      }
    ]
  },
  {
    title: 'Assignments',
    icon: <AssignmentIcon />,
    submenu: [
      {
        title: 'New Assignment',
        icon: <AddBox />,
        path: '/admin/assignments/new'
      },
      {
        title: 'Assignment List',
        icon: <ListIcon />,
        path: '/admin/assignments/list'
      },
      {
        title: 'Assignment History',
        icon: <HistoryIcon />,
        path: '/admin/assignments/history'
      }
    ]
  },
  {
    title: 'Maintenance',
    icon: <BuildIcon />,
    submenu: [
      {
        title: 'Schedule Maintenance',
        icon: <EventIcon />,
        path: '/admin/maintenance/schedule'
      },
      {
        title: 'Maintenance Logs',
        icon: <HistoryIcon />,
        path: '/admin/maintenance/logs'
      },
      {
        title: 'Service Requests',
        icon: <AssignmentIcon />,
        path: '/admin/maintenance/requests'
      }
    ]
  },
  {
    title: 'Procurement',
    icon: <ShoppingCartIcon />,
    submenu: [
      {
        title: 'Raise Request',
        icon: <AddCircleOutlineIcon />,
        path: '/admin/procurement/request'
      },
      {
        title: 'View Requests',
        icon: <ListAltIcon />,
        path: '/admin/procurement/view'
      },
      {
        title: 'Manage Vendors',
        icon: <BusinessIcon />,
        path: '/admin/procurement/vendors'
      },
      {
        title: 'Approved Purchases',
        icon: <CheckCircleOutlineIcon />,
        path: '/admin/procurement/approved'
      }
    ]
  },
  {
    title: 'Settings',
    icon: <SettingsIcon />,
    submenu: [
      {
        title: 'Profile',
        icon: <AccountBox />,
        path: '/admin/settings/profile'
      },
      {
        title: 'System Settings',
        icon: <SettingsIcon />,
        path: '/admin/settings/system'
      },
      {
        title: 'Backup & Restore',
        icon: <SaveAlt />,
        path: '/admin/settings/backup'
      },
      {
        title: 'Notifications',
        icon: <NotificationsIcon />,
        path: '/admin/settings/notifications'
      }
    ]
  }
];

const Sidebar = ({ open, onClose, width = 280 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const handleSubmenuClick = (title) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleMenuItemClick = (path) => {
    navigate(path); // Use React Router navigation instead of window.location
  };

  const renderMenuItem = (item) => {
    if (item.submenu) {
      return (
        <React.Fragment key={item.title}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleSubmenuClick(item.title)}>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}
              />
              {expandedItems[item.title] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu.map((subItem) => (
                <ListItem key={subItem.title} disablePadding>
                  <ListItemButton 
                    sx={{ 
                      pl: 4,
                      backgroundColor: location.pathname === subItem.path ? 'rgba(0, 51, 102, 0.08)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 51, 102, 0.12)'
                      }
                    }}
                    onClick={() => handleMenuItemClick(subItem.path)}
                  >
                    <ListItemIcon sx={{ color: location.pathname === subItem.path ? 'primary.main' : 'inherit' }}>
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={subItem.title}
                      sx={{ 
                        '& .MuiTypography-root': { 
                          color: location.pathname === subItem.path ? 'primary.main' : 'inherit',
                          fontWeight: location.pathname === subItem.path ? 600 : 400
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.title} disablePadding>
        <ListItemButton 
          onClick={() => handleMenuItemClick(item.path)}
          sx={{ 
            backgroundColor: location.pathname === item.path ? 'rgba(0, 51, 102, 0.08)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 51, 102, 0.12)'
            }
          }}
        >
          <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.title}
            sx={{ 
              '& .MuiTypography-root': { 
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                fontWeight: location.pathname === item.path ? 600 : 500 
              } 
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid rgba(0, 51, 102, 0.12)',
          mt: '64px', // Height of AppBar
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 8px',
          borderBottom: '1px solid rgba(0, 51, 102, 0.12)'
        }}
      >
        <Typography variant="h6" sx={{ color: 'primary.main', ml: 2 }}>
          Menu
        </Typography>
        <IconButton onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </Box>
      <List sx={{ mt: 1 }}>
        {menuItems.map(renderMenuItem)}
      </List>
    </Drawer>
  );
};

export default Sidebar;
