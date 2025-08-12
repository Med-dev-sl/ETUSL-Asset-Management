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
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'inventoryCategories'));
      const cats = [];
      querySnapshot.forEach(doc => {
        cats.push({ id: doc.id, ...doc.data() });
      });
      setCategories(cats);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch categories', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setSnackbar({ open: true, message: 'Category name is required', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'inventoryCategories'), {
        name: newCategory.trim(),
        createdAt: serverTimestamp()
      });
      setSnackbar({ open: true, message: 'Category added successfully', severity: 'success' });
      setNewCategory('');
      fetchCategories();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to add category', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add New Category</Typography>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 16 }}>
          <TextField
            label="Category Name"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            required
            sx={{ flex: 1 }}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </form>
      </Paper>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Categories</Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {categories.map(cat => (
              <ListItem key={cat.id}>
                <ListItemText primary={cat.name} />
              </ListItem>
            ))}
            {categories.length === 0 && <Typography>No categories found.</Typography>}
          </List>
        )}
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryManagement;
