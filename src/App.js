import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
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

// Import procurement components
import RaiseRequest from './components/procurement/RaiseRequest';
import ViewRequests from './components/procurement/ViewRequests';
import ManageVendors from './components/procurement/ManageVendors';
import ApprovedPurchases from './components/procurement/ApprovedPurchases';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets/new"
            element={
              <ProtectedRoute>
                <AddNewAsset />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets/manage"
            element={
              <ProtectedRoute>
                <AssetManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets/history"
            element={
              <ProtectedRoute>
                <AssetHistoryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets/history/:id"
            element={
              <ProtectedRoute>
                <AssetHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets/categories"
            element={
              <ProtectedRoute>
                <AssetCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets/disposal"
            element={
              <ProtectedRoute>
                <AssetDisposal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments/assign"
            element={
              <ProtectedRoute>
                <AssignToDepartment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments/view"
            element={
              <ProtectedRoute>
                <ViewByDepartment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations/manage"
            element={
              <ProtectedRoute>
                <ManageLocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/maintenance/schedule"
            element={
              <ProtectedRoute>
                <ScheduleMaintenance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/maintenance/logs"
            element={
              <ProtectedRoute>
                <MaintenanceLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/maintenance/requests"
            element={
              <ProtectedRoute>
                <ServiceRequests />
              </ProtectedRoute>
            }
          />
          {/* Inventory Routes */}
          <Route
            path="/admin/inventory/add"
            element={
              <ProtectedRoute>
                <AddInventoryItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory/stock"
            element={
              <ProtectedRoute>
                <StockLevels />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory/consumables"
            element={
              <ProtectedRoute>
                <Consumables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory/alerts"
            element={
              <ProtectedRoute>
                <InventoryAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory/history"
            element={
              <ProtectedRoute>
                <InventoryHistory />
              </ProtectedRoute>
            }
          />

          {/* Procurement Routes */}
          <Route
            path="/admin/procurement/request"
            element={
              <ProtectedRoute>
                <RaiseRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/procurement/view"
            element={
              <ProtectedRoute>
                <ViewRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/procurement/vendors"
            element={
              <ProtectedRoute>
                <ManageVendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/procurement/approved"
            element={
              <ProtectedRoute>
                <ApprovedPurchases />
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
