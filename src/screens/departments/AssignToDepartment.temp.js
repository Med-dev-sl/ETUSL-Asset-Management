import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AssignToDepartment = () => {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get all departments from locations collection
      const locationsSnapshot = await getDocs(collection(db, 'locations'));
      const loadedDepartments = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().departmentName || doc.data().name,
        ...doc.data()
      })).filter(dept => dept.name);

      setDepartments(loadedDepartments);

      // Get assets with their current department assignments
      const assetsSnapshot = await getDocs(collection(db, 'assets'));
      const loadedAssets = assetsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          departmentName: loadedDepartments.find(d => d.id === data.departmentId)?.name || 'Unassigned'
        };
      });
      setAssets(loadedAssets);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAsset?.id || !selectedAsset?.departmentId) {
      showNotification('Please select a location', 'error');
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const selectedDepartment = departments.find(d => d.id === selectedAsset.departmentId);
      
      if (!selectedDepartment) {
        showNotification('Selected location not found', 'error');
        return;
      }
      
      // Update asset with location assignment
      await updateDoc(doc(db, 'assets', selectedAsset.id), {
        departmentId: selectedAsset.departmentId,
        locationId: selectedAsset.departmentId,
        departmentName: selectedDepartment.name,
        updatedAt: timestamp
      });

      // Record the assignment in assetDepartments collection
      await addDoc(collection(db, 'assetDepartments'), {
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        departmentId: selectedAsset.departmentId,
        locationId: selectedAsset.departmentId,
        departmentName: selectedDepartment.name,
        assignedAt: timestamp
      });

      showNotification('Asset assigned successfully!', 'success');
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error assigning asset:', error);
      showNotification('Error assigning asset: ' + error.message, 'error');
    }
  };

  const handleEditClick = (asset) => {
    setSelectedAsset(asset);
    setDialogOpen(true);
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
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
        Assign Assets to Locations
      </Typography>

      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset Name</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Current Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No assets found</TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.serialNumber}</TableCell>
                    <TableCell>
                      <Typography 
                        color={asset.departmentId ? 'primary' : 'text.secondary'}
                        fontWeight={asset.departmentId ? 500 : 400}
                      >
                        {asset.departmentName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditClick(asset)}
                        disabled={departments.length === 0}
                        title={departments.length === 0 ? 'No locations available' : 'Assign to location'}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Assign to Location</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Location"
              value={selectedAsset?.departmentId || ''}
              onChange={(e) => setSelectedAsset(prev => ({
                ...prev,
                departmentId: e.target.value
              }))}
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained" color="primary">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignToDepartment;
