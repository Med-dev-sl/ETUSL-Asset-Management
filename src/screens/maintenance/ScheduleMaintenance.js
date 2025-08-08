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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ScheduleMaintenance = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    assetId: '',
    maintenanceType: '',
    scheduledDate: null,
    description: '',
    assignedTo: '',
    priority: 'medium'
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    loadAssets();
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

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      scheduledDate: date
    }));
  };

  const validateForm = () => {
    const { assetId, maintenanceType, scheduledDate, description, assignedTo } = formData;
    if (!assetId || !maintenanceType || !scheduledDate || !description || !assignedTo) {
      showNotification('Please fill in all required fields', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const maintenanceData = {
        ...formData,
        status: 'scheduled',
        scheduledDate: Timestamp.fromDate(formData.scheduledDate),
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };

      await addDoc(collection(db, 'maintenance'), maintenanceData);
      showNotification('Maintenance scheduled successfully', 'success');
      setFormData({
        assetId: '',
        maintenanceType: '',
        scheduledDate: null,
        description: '',
        assignedTo: '',
        priority: 'medium'
      });
    } catch (error) {
      showNotification('Error scheduling maintenance: ' + error.message, 'error');
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

  if (loading && !formData.assetId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schedule Maintenance
      </Typography>

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
              label="Maintenance Type"
              value={formData.maintenanceType}
              onChange={handleInputChange('maintenanceType')}
              required
            >
              <MenuItem value="routine">Routine Check</MenuItem>
              <MenuItem value="preventive">Preventive Maintenance</MenuItem>
              <MenuItem value="repair">Repair</MenuItem>
              <MenuItem value="replacement">Part Replacement</MenuItem>
              <MenuItem value="calibration">Calibration</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Scheduled Date and Time"
                value={formData.scheduledDate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDateTime={new Date()}
              />
            </LocalizationProvider>
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

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Assigned To"
              value={formData.assignedTo}
              onChange={handleInputChange('assignedTo')}
              required
            />
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
              Schedule Maintenance
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Maintenance Schedule</DialogTitle>
        <DialogContent>
          Are you sure you want to schedule this maintenance?
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

export default ScheduleMaintenance;
