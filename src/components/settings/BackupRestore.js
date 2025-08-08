import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Backup as BackupIcon 
} from '@mui/icons-material';

const BackupRestore = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const backupsRef = collection(db, 'backups');
      const q = query(backupsRef, orderBy('timestamp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      
      const backupsList = [];
      querySnapshot.forEach((doc) => {
        backupsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setBackups(backupsList);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setError('Failed to load backup history');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to create a backup');
      }

      // Fetch all collections data
      const collections = ['users', 'assets', 'transactions', 'settings'];
      const backupData = {};

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        backupData[collectionName] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Create backup record
      const backupRef = await addDoc(collection(db, 'backups'), {
        timestamp: serverTimestamp(),
        createdBy: {
          id: user.id,
          email: user.email
        },
        collections: collections,
        status: 'completed',
        dataSize: JSON.stringify(backupData).length
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'create',
        resource: 'backup',
        resourceId: backupRef.id,
        timestamp: serverTimestamp(),
        userId: user.id,
        userEmail: user.email,
        details: 'Created system backup'
      });

      // Update local state
      fetchBackups();
      setError('Backup created successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error creating backup:', error);
      setError(error.message || 'Failed to create backup');
      setSnackbarOpen(true);
    } finally {
      setCreating(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  const handleRestore = async (backupId) => {
    setRestoring(true);
    try {
      // Implementation of restore functionality would go here
      // This should be carefully implemented to avoid data corruption
      console.log('Restore functionality to be implemented');
      
      setError('Restore functionality not yet implemented');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error restoring backup:', error);
      setError(error.message || 'Failed to restore backup');
      setSnackbarOpen(true);
    } finally {
      setRestoring(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  const handleConfirmDialog = (type, backupId = null) => {
    setConfirmDialog({
      open: true,
      type,
      backupId
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">
            Backup & Restore
          </Typography>
          <Button
            variant="contained"
            startIcon={<BackupIcon />}
            onClick={() => handleConfirmDialog('backup')}
            disabled={creating}
          >
            {creating ? <CircularProgress size={24} /> : 'Create Backup'}
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Recent Backups
        </Typography>

        <List>
          {backups.map((backup) => (
            <ListItem
              key={backup.id}
              divider
              secondaryAction={
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadIcon />}
                  onClick={() => handleConfirmDialog('restore', backup.id)}
                  disabled={restoring}
                >
                  Restore
                </Button>
              }
            >
              <ListItemText
                primary={new Date(backup.timestamp?.seconds * 1000).toLocaleString()}
                secondary={`Created by: ${backup.createdBy.email}`}
              />
            </ListItem>
          ))}
        </List>

        {backups.length === 0 && (
          <Typography variant="body2" sx={{ textAlign: 'center', my: 3 }}>
            No backups available
          </Typography>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null })}
      >
        <DialogTitle>
          {confirmDialog.type === 'backup' ? 'Create Backup' : 'Restore Backup'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'backup'
              ? 'Are you sure you want to create a new backup? This will save the current state of all data.'
              : 'Are you sure you want to restore this backup? This will overwrite current data with the backup data.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, type: null })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.type === 'restore' ? 'error' : 'primary'}
            onClick={() => {
              if (confirmDialog.type === 'backup') {
                createBackup();
              } else {
                handleRestore(confirmDialog.backupId);
              }
            }}
          >
            {confirmDialog.type === 'backup' ? 'Create Backup' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error/Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={error.includes('success') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BackupRestore;
