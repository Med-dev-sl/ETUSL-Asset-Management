import ApproveStoresRequest from './components/inventory/ApproveStoresRequest';
import StoresRequestStatus from './components/inventory/StoresRequestStatus';
import StoresRequest from './components/inventory/StoresRequest';
import AddDepartmentHead from './components/departments/AddDepartmentHead';
import ListDepartmentHeads from './components/departments/ListDepartmentHeads';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import AddNewAsset from './screens/assets/AddNewAsset';
import AssetManagement from './screens/assets/AssetManagement';
import AssetHistory from './screens/assets/AssetHistory';
import AssetHistoryList from './screens/assets/AssetHistoryList';
import AssetCategories from './screens/assets/AssetCategories';
import AssetDisposal from './screens/assets/AssetDisposal';
import AssignToDepartment from './screens/departments/AssignToDepartment';
import ViewByDepartment from './screens/departments/ViewByDepartment';
import ManageLocations from './screens/locations/ManageLocations';
// Import maintenance components
import ScheduleMaintenance from './screens/maintenance/ScheduleMaintenance';
import MaintenanceLogs from './screens/maintenance/MaintenanceLogs';
import ServiceRequests from './screens/maintenance/ServiceRequests';

// Import inventory components
import AddInventoryItem from './components/inventory/AddInventoryItem';
import StockLevels from './components/inventory/StockLevels';
import Consumables from './components/inventory/Consumables';
import InventoryAlerts from './components/inventory/InventoryAlerts';
import InventoryHistory from './components/inventory/InventoryHistory';
import CategoryManagement from './components/inventory/CategoryManagement';

// Import reports components
import GenerateReports from './components/reports/GenerateReports';
import AssetVerification from './components/reports/AssetVerification';
import AuditLogs from './components/reports/AuditLogs';
import ExportData from './components/reports/ExportData';

// Import procurement components
import RaiseRequest from './components/procurement/RaiseRequest';
import ViewRequests from './components/procurement/ViewRequests';
import ManageVendors from './components/procurement/ManageVendors';
import ApprovedPurchases from './components/procurement/ApprovedPurchases';

// Import settings components
import Profile from './components/settings/Profile';
import SystemSettings from './components/settings/SystemSettings';
import BackupRestore from './components/settings/BackupRestore';
import NotificationSettings from './components/settings/NotificationSettings';

// Import user management components
import ManageUsers from './components/users/ManageUsers';
import RoleManagement from './components/users/RoleManagement';
import AccessControl from './components/users/AccessControl';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users/manage" element={<ManageUsers />} />
                    <Route path="users/roles" element={<RoleManagement />} />
                    <Route path="users/access" element={<AccessControl />} />
                    <Route path="assets/new" element={<AddNewAsset />} />
                    <Route path="assets/manage" element={<AssetManagement />} />
                    <Route path="assets/history" element={<AssetHistoryList />} />
                    <Route path="assets/history/:id" element={<AssetHistory />} />
                    <Route path="assets/categories" element={<AssetCategories />} />
                    <Route path="assets/disposal" element={<AssetDisposal />} />
                    <Route path="departments/assign" element={<AssignToDepartment />} />
                    <Route path="departments/view" element={<ViewByDepartment />} />
                    <Route path="departments/add-head" element={<AddDepartmentHead />} />
                    <Route path="departments/list-heads" element={<ListDepartmentHeads />} />
                    <Route path="locations/manage" element={<ManageLocations />} />
                    <Route path="maintenance/schedule" element={<ScheduleMaintenance />} />
                    <Route path="maintenance/logs" element={<MaintenanceLogs />} />
                    <Route path="maintenance/requests" element={<ServiceRequests />} />
                    <Route path="inventory/add" element={<AddInventoryItem />} />
                    <Route path="inventory/request" element={<StoresRequest />} />
                    <Route path="inventory/request-status" element={<StoresRequestStatus />} />
                    <Route path="inventory/approve" element={<ApproveStoresRequest />} />
                    <Route path="inventory/stock" element={<StockLevels />} />
                    <Route path="inventory/consumables" element={<Consumables />} />
                    <Route path="inventory/alerts" element={<InventoryAlerts />} />
                    <Route path="inventory/history" element={<InventoryHistory />} />
                    <Route path="inventory/categories" element={<CategoryManagement />} />
                    <Route path="reports/generate" element={<GenerateReports />} />
                    <Route path="reports/verify" element={<AssetVerification />} />
                    <Route path="reports/audit" element={<AuditLogs />} />
                    <Route path="reports/export" element={<ExportData />} />
                    <Route path="procurement/request" element={<RaiseRequest />} />
                    <Route path="procurement/view" element={<ViewRequests />} />
                    <Route path="procurement/vendors" element={<ManageVendors />} />
                    <Route path="procurement/approved" element={<ApprovedPurchases />} />
                    <Route path="settings/profile" element={<Profile />} />
                    <Route path="settings/system" element={<SystemSettings />} />
                    <Route path="settings/backup" element={<BackupRestore />} />
                    <Route path="settings/notifications" element={<NotificationSettings />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />


          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
