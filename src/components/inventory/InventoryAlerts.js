import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Warning as WarningIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const InventoryAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setErrorMessage('User not authenticated');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    try {
      // Query items with low stock
      const q = query(
        collection(db, 'inventory'),
        where('status', '==', 'low'),
        orderBy('quantity')
      );

      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastUpdated: doc.data().updatedAt?.toDate?.()?.toLocaleString() || 'N/A'
          }));

          // Separate out of stock items
          const outOfStock = items.filter(item => item.quantity === 0);
          const lowStock = items.filter(item => item.quantity > 0);

          setOutOfStockItems(outOfStock);
          setLowStockItems(lowStock);
          setLoading(false);
        },
        error: (error) => {
          console.error("Error fetching alerts:", error);
          setErrorMessage('Failed to load inventory alerts');
          setSnackbarOpen(true);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      setErrorMessage('Error setting up alerts listener');
      setSnackbarOpen(true);
      setLoading(false);
    }
  }, []);

  const handleUpdateStock = async () => {
    if (!selectedItem || !adjustQuantity) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to update stock');
      }

      // Get user data and verify admin role
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      if (!userData.role || userData.role !== 'admin') {
        throw new Error('Only administrators can update stock levels');
      }

      const currentUser = {
        id: user.id,
        name: userData.displayName || userData.email.split('@')[0],
        email: userData.email,
        role: userData.role
      };

      // Update stock level
      const newQuantity = parseInt(adjustQuantity);
      if (newQuantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      // Update the item in Firestore
      await updateDoc(doc(db, 'inventory', selectedItem.id), {
        quantity: newQuantity,
        status: newQuantity <= selectedItem.minStockLevel ? 'low' : 'normal',
        updatedBy: currentUser,
        updatedAt: serverTimestamp(),
        lastStockUpdate: {
          previousQuantity: selectedItem.quantity,
          newQuantity: newQuantity,
          timestamp: serverTimestamp(),
          updatedBy: currentUser
        }
      });

      setSuccessOpen(true);
      setDialogOpen(false);
      setAdjustQuantity('');
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      setErrorMessage(error.message || 'Failed to update stock');
      setSnackbarOpen(true);
    }
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
      <Grid container spacing={3}>
        {/* Out of Stock Items */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Out of Stock Items ({outOfStockItems.length})
              </Typography>
              <List>
                {outOfStockItems.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.name}
                      secondary={`Category: ${item.category} | Min. Level: ${item.minStockLevel} ${item.unit}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedItem(item);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Items */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="h6" color="warning.dark" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Low Stock Items ({lowStockItems.length})
              </Typography>
              <List>
                {lowStockItems.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.name}
                          <Chip
                            size="small"
                            label={`${item.quantity} ${item.unit}`}
                            color="warning"
                          />
                        </Box>
                      }
                      secondary={`Min. Level: ${item.minStockLevel} ${item.unit} | Category: ${item.category}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedItem(item);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update Stock Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Update Stock: {selectedItem?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="New Quantity"
            type="number"
            value={adjustQuantity}
            onChange={(e) => setAdjustQuantity(e.target.value)}
            inputProps={{ min: "0" }}
            helperText={`Current: ${selectedItem?.quantity} ${selectedItem?.unit} | Min. Level: ${selectedItem?.minStockLevel} ${selectedItem?.unit}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStock} variant="contained" color="primary">
            Update Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            Stock level has been updated successfully.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryAlerts;
