import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button, Snackbar, Alert } from '@mui/material';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const InventoryCategoryAdmin = () => {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getDocs(collection(db, 'inventory')).then(snapshot => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    getDocs(collection(db, 'inventoryCategories')).then(snapshot => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleUpdate = async () => {
    if (!selectedItem || !selectedCategory) return;
    try {
      await updateDoc(doc(db, 'inventory', selectedItem), { category: selectedCategory });
      setNotification({ open: true, message: 'Category updated!', severity: 'success' });
      setSelectedItem('');
      setSelectedCategory('');
      // Refresh inventory
      getDocs(collection(db, 'inventory')).then(snapshot => {
        setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    } catch (e) {
      setNotification({ open: true, message: 'Error: ' + e.message, severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Assign/Update Inventory Category</Typography>
        <TextField
          select
          label="Select Inventory Item"
          value={selectedItem}
          onChange={e => setSelectedItem(e.target.value)}
          sx={{ mb: 2, minWidth: 300 }}
        >
          {inventory.map(i => (
            <MenuItem key={i.id} value={i.id}>
              {i.name} ({i.id})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Select Category"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          sx={{ mb: 2, minWidth: 300 }}
        >
          {categories.map(c => (
            <MenuItem key={c.id} value={c.id}>
              {c.name} ({c.id})
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleUpdate} disabled={!selectedItem || !selectedCategory}>
          Update Category
        </Button>
      </Paper>
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

export default InventoryCategoryAdmin;
