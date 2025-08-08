import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    building: ''
  });
  const [editLocation, setEditLocation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'locations'));
      const loadedLocations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(loadedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
      showNotification('Error loading locations: ' + error.message, 'error');
    }
  };

  const handleAddLocation = async () => {
    try {
      if (!newLocation.name.trim()) return;

      await addDoc(collection(db, 'locations'), {
        ...newLocation,
        createdAt: new Date().toISOString()
      });

      setNewLocation({ name: '', description: '', building: '' });
      showNotification('Location added successfully!', 'success');
      loadLocations();
    } catch (error) {
      console.error('Error adding location:', error);
      showNotification('Error adding location: ' + error.message, 'error');
    }
  };

  const handleEditClick = (location) => {
    setEditLocation(location);
    setDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      if (!editLocation?.name.trim()) return;

      await updateDoc(doc(db, 'locations', editLocation.id), {
        name: editLocation.name,
        description: editLocation.description,
        building: editLocation.building,
        updatedAt: new Date().toISOString()
      });

      showNotification('Location updated successfully!', 'success');
      setDialogOpen(false);
      loadLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      showNotification('Error updating location: ' + error.message, 'error');
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      await deleteDoc(doc(db, 'locations', locationId));
      showNotification('Location deleted successfully!', 'success');
      loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      showNotification('Error deleting location: ' + error.message, 'error');
    }
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Manage Locations
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Location
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Location Name"
            value={newLocation.name}
            onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Building"
            value={newLocation.building}
            onChange={(e) => setNewLocation(prev => ({ ...prev, building: e.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={newLocation.description}
            onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
          />
          <Button
            variant="contained"
            onClick={handleAddLocation}
            disabled={!newLocation.name.trim()}
          >
            Add Location
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Existing Locations
        </Typography>
        <List>
          {locations.map((location) => (
            <ListItem key={location.id} divider>
              <ListItemText
                primary={location.name}
                secondary={`${location.building}${location.description ? ` - ${location.description}` : ''}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleEditClick(location)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteLocation(location.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Location</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Location Name"
              value={editLocation?.name || ''}
              onChange={(e) => setEditLocation(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Building"
              value={editLocation?.building || ''}
              onChange={(e) => setEditLocation(prev => ({ ...prev, building: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={editLocation?.description || ''}
              onChange={(e) => setEditLocation(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
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

export default ManageLocations;
