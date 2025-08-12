import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../screens/Dashboard';
import CategoryManagement from '../components/inventory/CategoryManagement';
import NewAsset from '../screens/assets/NewAsset';
import ManageAssets from '../screens/assets/ManageAssets';
import AssetHistory from '../screens/assets/AssetHistory';
import AssetCategories from '../screens/assets/AssetCategories';
import AssetDisposal from '../screens/assets/AssetDisposal';
import AssignToDepartment from '../screens/departments/AssignToDepartment';
import ViewByDepartment from '../screens/departments/ViewByDepartment';
import ManageLocations from '../screens/locations/ManageLocations';
import AddUser from '../screens/users/AddUser';
import UserList from '../screens/users/UserList';
import UserRoles from '../screens/users/UserRoles';
import NewAssignment from '../screens/assignments/NewAssignment';
import AssignmentList from '../screens/assignments/AssignmentList';
import AssignmentHistory from '../screens/assignments/AssignmentHistory';
import Profile from '../screens/settings/Profile';
import SystemSettings from '../screens/settings/SystemSettings';
// Import maintenance components
import ScheduleMaintenance from '../screens/maintenance/ScheduleMaintenance';
import MaintenanceLogs from '../screens/maintenance/MaintenanceLogs';
import ServiceRequests from '../screens/maintenance/ServiceRequests';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/dashboard" element={<Dashboard />} />
      
  {/* Asset Management Routes */}
  <Route path="/admin/assets/new" element={<NewAsset />} />
  <Route path="/admin/assets/manage" element={<ManageAssets />} />
  <Route path="/admin/assets/history" element={<AssetHistory />} />
  <Route path="/admin/assets/categories" element={<AssetCategories />} />
  <Route path="/admin/assets/disposal" element={<AssetDisposal />} />

  {/* Inventory Category Route */}
  <Route path="/admin/inventory/categories" element={<CategoryManagement />} />
      
      {/* Department Routes */}
      <Route path="/admin/departments/assign" element={<AssignToDepartment />} />
      <Route path="/admin/departments/view" element={<ViewByDepartment />} />
      <Route path="/admin/locations/manage" element={<ManageLocations />} />
      
      {/* User Management Routes */}
      <Route path="/admin/users/new" element={<AddUser />} />
      <Route path="/admin/users/list" element={<UserList />} />
      <Route path="/admin/users/roles" element={<UserRoles />} />
      
      {/* Assignment Routes */}
      <Route path="/admin/assignments/new" element={<NewAssignment />} />
      <Route path="/admin/assignments/list" element={<AssignmentList />} />
      <Route path="/admin/assignments/history" element={<AssignmentHistory />} />
      
      {/* Maintenance Routes */}
      <Route path="/admin/maintenance/schedule" element={<ScheduleMaintenance />} />
      <Route path="/admin/maintenance/logs" element={<MaintenanceLogs />} />
      <Route path="/admin/maintenance/requests" element={<ServiceRequests />} />
      
      {/* Settings Routes */}
      <Route path="/admin/settings/profile" element={<Profile />} />
      <Route path="/admin/settings/system" element={<SystemSettings />} />
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
