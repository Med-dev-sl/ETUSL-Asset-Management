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
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem
} from '@mui/material';
import { Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { format } from 'date-fns';

const statusColors = {
  scheduled: 'info',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'error'
};

const MaintenanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    notes: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadMaintenanceLogs();
  }, []);

  const loadMaintenanceLogs = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'maintenance'), orderBy('scheduledDate', 'desc'));
      const snapshot = await getDocs(q);
      const loadedLogs = await Promise.all(snapshot.docs.map(async maintenanceDoc => {
        const data = maintenanceDoc.data();
        // Get asset details
        const assetRef = doc(db, 'assets', data.assetId);
        const assetDoc = await getDoc(assetRef);
        const assetData = assetDoc.exists() ? assetDoc.data() : null;
        return {
          id: maintenanceDoc.id,
          ...data,
          asset: assetData ? {
            name: assetData.name,
            serialNumber: assetData.serialNumber
          } : null
        };
      }));
      setLogs(loadedLogs);
    } catch (error) {
      showNotification('Error loading maintenance logs: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedLog) return;

    try {
      setLoading(true);

      // Check user role
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to update maintenance logs');
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        throw new Error('Only administrators can update maintenance logs');
      }

      const maintenanceRef = doc(db, 'maintenance', selectedLog.id);
      await updateDoc(maintenanceRef, {
        status: editData.status,
        notes: editData.notes,
        lastUpdated: new Date(),
        updatedBy: {
          id: user.id,
          email: userDoc.data().email,
          timestamp: new Date()
        }
      });
      
      showNotification('Maintenance log updated successfully', 'success');
      loadMaintenanceLogs();
      setEditDialog(false);
    } catch (error) {
      showNotification('Error updating maintenance log: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setSelectedLog(log);
    setEditData({
      status: log.status,
      notes: log.notes || ''
    });
    setEditDialog(true);
  };

  const handleView = (log) => {
    setSelectedLog(log);
    setViewDialog(true);
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  if (loading && logs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Maintenance Logs
      </Typography>

      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.asset ? `${log.asset.name} - ${log.asset.serialNumber}` : 'Unknown Asset'}
                  </TableCell>
                  <TableCell>{log.maintenanceType}</TableCell>
                  <TableCell>
                    {format(log.scheduledDate.toDate(), 'PPpp')}
                  </TableCell>
                  <TableCell>{log.assignedTo}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={statusColors[log.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.priority}
                      color={log.priority === 'urgent' ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleView(log)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEdit(log)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Maintenance Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Asset:</strong> {selectedLog.asset?.name} - {selectedLog.asset?.serialNumber}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Type:</strong> {selectedLog.maintenanceType}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Scheduled Date:</strong> {format(selectedLog.scheduledDate.toDate(), 'PPpp')}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Assigned To:</strong> {selectedLog.assignedTo}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong> {selectedLog.status}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Priority:</strong> {selectedLog.priority}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedLog.description}
              </Typography>
              {selectedLog.notes && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Notes:</strong>
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedLog.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Update Maintenance Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={editData.status}
              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
              sx={{ mb: 2 }}
            >
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Update
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

export default MaintenanceLogs;
