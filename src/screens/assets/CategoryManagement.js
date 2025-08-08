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
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const CategoryManagement = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoryRef = collection(db, 'assetCategories');
      const querySnapshot = await getDocs(categoryRef);
      
      if (querySnapshot.empty && onCategoryChange) {
        // If no categories exist, create default ones
        const defaultCategories = [
          'Computer Equipment',
          'Office Furniture',
          'Vehicles',
          'Machinery',
          'Tools',
          'Communication Equipment',
          'Other'
        ];

        const createPromises = defaultCategories.map(name => 
          addDoc(categoryRef, { 
            name,
            createdAt: new Date().toISOString()
          })
        );

        await Promise.all(createPromises);
        // Reload categories after creating defaults
        const newSnapshot = await getDocs(categoryRef);
        const loadedCategories = newSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(loadedCategories);
        if (onCategoryChange) {
          onCategoryChange(loadedCategories);
        }
      } else {
        const loadedCategories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(loadedCategories);
        if (onCategoryChange) {
          onCategoryChange(loadedCategories);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showNotification(
        error.code === 'permission-denied'
          ? 'You don\'t have permission to view categories'
          : 'Error loading categories: ' + error.message,
        'error'
      );
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const categoryRef = collection(db, 'assetCategories');
      const newCategoryData = {
        name: newCategory.trim(),
        createdAt: new Date().toISOString()
      };
      
      // Check if category already exists
      const snapshot = await getDocs(categoryRef);
      const exists = snapshot.docs.some(doc => 
        doc.data().name.toLowerCase() === newCategoryData.name.toLowerCase()
      );

      if (exists) {
        showNotification('Category already exists!', 'error');
        return;
      }

      await addDoc(categoryRef, newCategoryData);
      showNotification('Category added successfully!', 'success');
      setNewCategory('');
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      showNotification(
        error.code === 'permission-denied' 
          ? 'You don\'t have permission to add categories' 
          : 'Error adding category: ' + error.message,
        'error'
      );
    }
  };

  const handleEditClick = (category) => {
    setEditCategory(category);
    setDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editCategory || !editCategory.name.trim()) return;

    try {
      await updateDoc(doc(db, 'assetCategories', editCategory.id), {
        name: editCategory.name
      });
      showNotification('Category updated successfully!', 'success');
      setDialogOpen(false);
      loadCategories();
    } catch (error) {
      showNotification('Error updating category: ' + error.message, 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteDoc(doc(db, 'assetCategories', categoryId));
      showNotification('Category deleted successfully!', 'success');
      loadCategories();
    } catch (error) {
      showNotification('Error deleting category: ' + error.message, 'error');
    }
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Asset Categories
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
          >
            Add
          </Button>
        </Box>

        <List>
          {categories.map((category) => (
            <ListItem key={category.id} divider>
              <ListItemText primary={category.name} />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleEditClick(category)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={editCategory?.name || ''}
            onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryManagement;
