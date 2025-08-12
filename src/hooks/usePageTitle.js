import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/assets/new': 'Add New Asset',
  '/admin/assets/manage': 'Manage Assets',
  '/admin/assets/history': 'Asset History',
  '/admin/assets/categories': 'Asset Categories',
  '/admin/assets/disposal': 'Asset Disposal',
  '/admin/departments/assign': 'Assign to Department',
  '/admin/departments/view': 'View by Department',
  '/admin/locations/manage': 'Manage Locations',
  '/admin/maintenance/schedule': 'Schedule Maintenance',
  '/admin/maintenance/logs': 'Maintenance Logs',
  '/admin/maintenance/requests': 'Service Requests',
  '/admin/inventory/add': 'Add Inventory Item',
  '/admin/inventory/stock': 'Stock Levels',
  '/admin/inventory/consumables': 'Consumables',
  '/admin/inventory/alerts': 'Inventory Alerts',
  '/admin/inventory/history': 'Inventory History',
  '/admin/reports/generate': 'Generate Reports',
  '/admin/reports/verify': 'Asset Verification',
  '/admin/reports/audit': 'Audit Logs',
  '/admin/reports/export': 'Export Data',
  '/admin/procurement/request': 'Raise Request',
  '/admin/procurement/view': 'View Requests',
  '/admin/procurement/vendors': 'Manage Vendors',
  '/admin/procurement/approved': 'Approved Purchases',
  '/admin/settings/profile': 'Profile Settings',
  '/admin/settings/system': 'System Settings',
  '/admin/settings/backup': 'Backup & Restore',
  '/admin/settings/notifications': 'Notification Settings'
};

const defaultTitle = 'ETUSL Asset Management';

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = pageTitles[path] || defaultTitle;

    // Handle dynamic routes
    if (path.match(/\/admin\/assets\/history\/\d+/)) {
      title = 'Asset Details';
    }

    // Set the document title
    document.title = `${title} | ${defaultTitle}`;

    return () => {
      document.title = defaultTitle;
    };
  }, [location]);

  return null;
};
