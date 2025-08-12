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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/config';


// Categories will be fetched from Firestore

const AddInventoryItem = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '',
    minStockLevel: '',
    unit: '',
    location: '',
    supplier: '',
    notes: ''
  });
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    // Fetch categories from Firestore (inventoryCategories collection)
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'inventoryCategories'));
        const cats = snapshot.docs.map(doc => doc.data().name);
        setCategories(cats);
      } catch (error) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastItemId, setLastItemId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'category', 'quantity', 'minStockLevel', 'unit'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      throw new Error('Please fill in all required fields: ' + missingFields.join(', '));
    }

    if (parseInt(formData.quantity) < 0) {
      throw new Error('Quantity cannot be negative');
    }

    if (parseInt(formData.minStockLevel) < 0) {
      throw new Error('Minimum stock level cannot be negative');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Validate form
      validateForm();

      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to add inventory items');
      }

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      if (!userData.role || userData.role !== 'admin') {
        throw new Error('Only administrators can add inventory items');
      }

      // Create current user object
      const currentUser = {
        id: user.id,
        name: userData.displayName || userData.email.split('@')[0],
        email: userData.email,
        role: userData.role
      };

      // Generate readable itemId (ETUSTORES000001+)
      const itemId = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'inventoryMeta', 'itemIdCounter');
        const counterSnap = await transaction.get(counterRef);
        let nextNumber = 1;
        if (counterSnap.exists()) {
          nextNumber = counterSnap.data().lastNumber + 1;
        }
        transaction.set(counterRef, { lastNumber: nextNumber });
        // Format: ETUSTORES + 6-digit number, zero-padded
        return `ETUSTORES${String(nextNumber).padStart(6, '0')}`;
      });

      // Prepare inventory item data
      const inventoryData = {
        ...formData,
        itemId,
        quantity: parseInt(formData.quantity),
        minStockLevel: parseInt(formData.minStockLevel),
        status: parseInt(formData.quantity) <= parseInt(formData.minStockLevel) ? 'low' : 'normal',
        createdBy: currentUser,
        createdAt: serverTimestamp(),
        updatedBy: currentUser,
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'inventory'), inventoryData);

      // Create history record
      await addDoc(collection(db, 'inventoryHistory'), {
        itemId,
        itemName: formData.name,
        category: formData.category,
        action: 'created',
        details: `Initial quantity: ${formData.quantity} ${formData.unit}`,
        previousQuantity: null,
        newQuantity: parseInt(formData.quantity),
        quantityChange: parseInt(formData.quantity),
        unit: formData.unit,
        timestamp: serverTimestamp(),
        updatedBy: currentUser
      });

  // Show success message and display itemId
  setLastItemId(itemId);
  setSuccessOpen(true);

      // Reset form
      setFormData({
        name: '',
        category: '',
        description: '',
        quantity: '',
        minStockLevel: '',
        unit: '',
        location: '',
        supplier: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding inventory item:', error);
      setErrorMessage(error.message || 'Failed to add inventory item');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Add Inventory Item
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.length === 0 ? (
                  <MenuItem value="" disabled>No categories found</MenuItem>
                ) : (
                  categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                type="number"
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                inputProps={{ min: "0" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                type="number"
                label="Minimum Stock Level"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                inputProps={{ min: "0" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., pieces, boxes, liters"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Storage Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Item'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Inventory item has been added successfully.
          </Typography>
          {lastItemId && (
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Item ID: <span style={{ color: '#1976d2' }}>{lastItemId}</span>
            </Typography>
          )}
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

export default AddInventoryItem;
