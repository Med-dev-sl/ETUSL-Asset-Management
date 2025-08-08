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
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ViewByDepartment = () => {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadDepartmentAssets(selectedDepartment);
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'locations'));
      const loadedDepartments = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().departmentName || doc.data().name,
        ...doc.data()
      })).filter(dept => dept.name); // only include locations with names
      setDepartments(loadedDepartments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading departments:', error);
      showNotification('Error loading departments: ' + error.message, 'error');
      setLoading(false);
    }
  };

  const loadDepartmentAssets = async (departmentId) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'assets'),
        where('locationId', '==', departmentId) // using locationId for consistency
      );
      const snapshot = await getDocs(q);
      const loadedAssets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        location: departments.find(d => d.id === doc.data().locationId)?.name || 'Not specified'
      }));
      setAssets(loadedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
      showNotification('Error loading assets: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  if (loading && !selectedDepartment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        View Assets by Department
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          select
          label="Select Department"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {selectedDepartment && (
        <Paper sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset Name</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.serialNumber}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>{asset.status || 'Active'}</TableCell>
                        <TableCell>{asset.location || 'Not specified'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No assets found for this department
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

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

export default ViewByDepartment;
