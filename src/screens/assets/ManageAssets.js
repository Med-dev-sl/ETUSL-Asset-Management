import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { getAssets, updateAsset, disposeAsset } from '../../firebase/assetService';

const assetCategories = [
  'Computer Equipment',
  'Office Furniture',
  'Vehicles',
  'Machinery',
  'Tools',
  'Communication Equipment',
  'Other'
];

const assetConditions = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Poor'
];

const ManageAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({
    open: false,
    asset: null
  });
  const [disposeDialog, setDisposeDialog] = useState({
    open: false,
    asset: null
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const fetchedAssets = await getAssets();
      setAssets(fetchedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
      setNotification({
        open: true,
        message: 'Failed to load assets: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (asset) => {
    setEditDialog({
      open: true,
      asset: { ...asset }
    });
  };

  const handleDisposeClick = (asset) => {
    setDisposeDialog({
      open: true,
      asset
    });
  };

  const handleEditSave = async () => {
    try {
      await updateAsset(editDialog.asset.id, editDialog.asset);
      await loadAssets(); // Reload the list
      setNotification({
        open: true,
        message: 'Asset updated successfully!',
        severity: 'success'
      });
      setEditDialog({ open: false, asset: null });
    } catch (error) {
      console.error('Error updating asset:', error);
      setNotification({
        open: true,
        message: 'Failed to update asset: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleDisposeSave = async () => {
    try {
      await disposeAsset(disposeDialog.asset.id, {
        reason: disposeDialog.asset.disposalReason,
        disposedBy: 'admin' // TODO: Get from auth context
      });
      await loadAssets(); // Reload the list
      setNotification({
        open: true,
        message: 'Asset marked as disposed successfully!',
        severity: 'success'
      });
      setDisposeDialog({ open: false, asset: null });
    } catch (error) {
      console.error('Error disposing asset:', error);
      setNotification({
        open: true,
        message: 'Failed to dispose asset: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditDialog(prev => ({
      ...prev,
      asset: {
        ...prev.asset,
        [name]: value
      }
    }));
  };

  const handleDisposeChange = (e) => {
    const { name, value } = e.target;
    setDisposeDialog(prev => ({
      ...prev,
      asset: {
        ...prev.asset,
        [name]: value
      }
    }));
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Assets
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Serial Number</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.category}</TableCell>
                <TableCell>{asset.serialNumber}</TableCell>
                <TableCell>{asset.condition}</TableCell>
                <TableCell>{asset.status}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditClick(asset)}
                    disabled={asset.status === 'disposed'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDisposeClick(asset)}
                    disabled={asset.status === 'disposed'}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    component="a"
                    href={`/admin/assets/history/${asset.id}`}
                  >
                    <HistoryIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, asset: null })}>
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Asset Name"
              name="name"
              value={editDialog.asset?.name || ''}
              onChange={handleEditChange}
            />
            <TextField
              fullWidth
              margin="normal"
              select
              label="Category"
              name="category"
              value={editDialog.asset?.category || ''}
              onChange={handleEditChange}
            >
              {assetCategories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              label="Serial Number"
              name="serialNumber"
              value={editDialog.asset?.serialNumber || ''}
              onChange={handleEditChange}
            />
            <TextField
              fullWidth
              margin="normal"
              select
              label="Condition"
              name="condition"
              value={editDialog.asset?.condition || ''}
              onChange={handleEditChange}
            >
              {assetConditions.map(condition => (
                <MenuItem key={condition} value={condition}>
                  {condition}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              label="Location"
              name="location"
              value={editDialog.asset?.location || ''}
              onChange={handleEditChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, asset: null })}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispose Dialog */}
      <Dialog open={disposeDialog.open} onClose={() => setDisposeDialog({ open: false, asset: null })}>
        <DialogTitle>Dispose Asset</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Are you sure you want to mark this asset as disposed?
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Disposal Reason"
            name="disposalReason"
            multiline
            rows={4}
            value={disposeDialog.asset?.disposalReason || ''}
            onChange={handleDisposeChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisposeDialog({ open: false, asset: null })}>Cancel</Button>
          <Button onClick={handleDisposeSave} variant="contained" color="error">
            Confirm Disposal
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageAssets;
