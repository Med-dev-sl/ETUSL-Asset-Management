import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

const Breadcrumbs = () => {
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  // Map of route segments to display names
  const routeNames = {
    admin: 'Dashboard',
    assets: 'Assets',
    inventory: 'Inventory',
    departments: 'Departments',
    locations: 'Locations',
    maintenance: 'Maintenance',
    reports: 'Reports',
    procurement: 'Procurement',
    settings: 'Settings',
    new: 'Add New',
    manage: 'Manage',
    history: 'History',
    categories: 'Categories',
    disposal: 'Disposal',
    assign: 'Assign',
    view: 'View',
    schedule: 'Schedule',
    logs: 'Logs',
    requests: 'Requests',
    add: 'Add',
    stock: 'Stock Levels',
    consumables: 'Consumables',
    alerts: 'Alerts',
    generate: 'Generate',
    verify: 'Verify',
    audit: 'Audit Logs',
    export: 'Export',
    request: 'Request',
    vendors: 'Vendors',
    approved: 'Approved',
    profile: 'Profile',
    system: 'System Settings',
    backup: 'Backup & Restore',
    notifications: 'Notifications'
  };

  return (
    <MuiBreadcrumbs 
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 3 }}
    >
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = routeNames[value] || value;

        return last ? (
          <Typography color="text.primary" key={to}>
            {displayName}
          </Typography>
        ) : (
          <Link
            component={RouterLink}
            color="inherit"
            to={to}
            key={to}
            sx={{ 
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {displayName}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
