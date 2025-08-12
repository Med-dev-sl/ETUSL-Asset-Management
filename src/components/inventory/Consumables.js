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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Remove as RemoveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const Consumables = () => {
  const [items, setItems] = useState([]);
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
      // Query only consumable items
      const q = query(
        collection(db, 'inventory'),
        orderBy('name')
      );

      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const consumables = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastUpdated: doc.data().updatedAt?.toDate?.()?.toLocaleString() || 'N/A'
          }));
          setItems(consumables);
          setLoading(false);
        },
        error: (error) => {
          console.error("Error fetching consumables:", error);
          setErrorMessage('Failed to load consumables');
          setSnackbarOpen(true);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      setErrorMessage('Error setting up consumables listener');
      setSnackbarOpen(true);
      setLoading(false);
    }
  }, []);

  const handleAdjustQuantity = async () => {
    if (!selectedItem || !adjustQuantity) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to adjust quantities');
      }

      // Get user data and verify admin role
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      if (!userData.role || userData.role !== 'admin') {
        throw new Error('Only administrators can adjust inventory quantities');
      }

      const currentUser = {
        id: user.id,
        name: userData.displayName || userData.email.split('@')[0],
        email: userData.email,
        role: userData.role
      };

      // Calculate new quantity
      const adjustment = parseInt(adjustQuantity);
      const newQuantity = selectedItem.quantity + adjustment;
      
      if (newQuantity < 0) {
        throw new Error('Resulting quantity cannot be negative');
      }

      // Update the item in Firestore
      await updateDoc(doc(db, 'inventory', selectedItem.id), {
        quantity: newQuantity,
        status: newQuantity <= selectedItem.minStockLevel ? 'low' : 'normal',
        updatedBy: currentUser,
        updatedAt: serverTimestamp(),
        lastAdjustment: {
          amount: adjustment,
          timestamp: serverTimestamp(),
          adjustedBy: currentUser
        }
      });

      setSuccessOpen(true);
      setDialogOpen(false);
      setAdjustQuantity('');
      setSelectedItem(null);
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      setErrorMessage(error.message || 'Failed to adjust quantity');
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
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Consumable Items
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Min. Level</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow 
                  key={item.id}
                  sx={{
                    backgroundColor: item.quantity <= item.minStockLevel 
                      ? 'rgba(255, 0, 0, 0.05)' 
                      : 'inherit'
                  }}
                >
                  <TableCell>{item.itemId || '-'}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.minStockLevel}</TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary"
                      onClick={() => {
                        setSelectedItem(item);
                        setDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Adjust Quantity Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Adjust Quantity: {selectedItem?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography>
              Current Quantity: {selectedItem?.quantity} {selectedItem?.unit}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              color="error" 
              onClick={() => setAdjustQuantity(prev => (parseInt(prev || 0) - 1).toString())}
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              autoFocus
              type="number"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              sx={{ width: 100 }}
            />
            <IconButton 
              color="primary" 
              onClick={() => setAdjustQuantity(prev => (parseInt(prev || 0) + 1).toString())}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjustQuantity} variant="contained">
            Update Quantity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            Quantity has been updated successfully.
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

export default Consumables;
