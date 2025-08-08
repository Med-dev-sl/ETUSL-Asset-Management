import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format } from 'date-fns';

const ServiceRequests = () => {
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    assetId: '',
    issueType: '',
    description: '',
    priority: 'medium'
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'list'

  useEffect(() => {
    loadAssets();
    loadRequests();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'assets'));
      const loadedAssets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssets(loadedAssets);
    } catch (error) {
      showNotification('Error loading assets: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'serviceRequests'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedRequests = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        // Get asset details
        const assetDoc = await getDocs(doc(db, 'assets', data.assetId));
        const assetData = assetDoc.data();
        return {
          id: doc.id,
          ...data,
          asset: assetData ? {
            name: assetData.name,
            serialNumber: assetData.serialNumber
          } : null
        };
      }));
      setRequests(loadedRequests);
    } catch (error) {
      showNotification('Error loading service requests: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const validateForm = () => {
    const { assetId, issueType, description } = formData;
    if (!assetId || !issueType || !description) {
      showNotification('Please fill in all required fields', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const requestData = {
        ...formData,
        status: 'pending',
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };

      await addDoc(collection(db, 'serviceRequests'), requestData);
      showNotification('Service request submitted successfully', 'success');
      setFormData({
        assetId: '',
        issueType: '',
        description: '',
        priority: 'medium'
      });
      loadRequests();
    } catch (error) {
      showNotification('Error submitting service request: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setConfirmDialog(false);
    }
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading && assets.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Service Requests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setViewMode(viewMode === 'form' ? 'list' : 'form')}
        >
          {viewMode === 'form' ? 'View Requests' : 'New Request'}
        </Button>
      </Box>

      {viewMode === 'form' ? (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Asset"
                value={formData.assetId}
                onChange={handleInputChange('assetId')}
                required
              >
                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.name} - {asset.serialNumber}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Issue Type"
                value={formData.issueType}
                onChange={handleInputChange('issueType')}
                required
              >
                <MenuItem value="hardware">Hardware Issue</MenuItem>
                <MenuItem value="software">Software Issue</MenuItem>
                <MenuItem value="network">Network Issue</MenuItem>
                <MenuItem value="maintenance">Maintenance Required</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={handleInputChange('priority')}
                required
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setConfirmDialog(true)}
                disabled={loading}
              >
                Submit Request
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Issue Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.asset ? `${request.asset.name} - ${request.asset.serialNumber}` : 'Unknown Asset'}
                    </TableCell>
                    <TableCell>{request.issueType}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority}
                        color={request.priority === 'urgent' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(request.createdAt.toDate(), 'PPpp')}
                    </TableCell>
                    <TableCell>
                      {format(request.lastUpdated.toDate(), 'PPpp')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Service Request</DialogTitle>
        <DialogContent>
          Are you sure you want to submit this service request?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
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

export default ServiceRequests;
