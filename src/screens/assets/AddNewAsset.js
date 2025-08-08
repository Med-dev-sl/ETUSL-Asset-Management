import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
  Divider
} from '@mui/material';
import { addAsset } from '../../firebase/assetService';
import CategoryManagement from './CategoryManagement';

const assetConditions = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Poor'
];

const AddNewAsset = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    condition: '',
    location: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = ['name', 'category', 'serialNumber', 'purchaseDate', 'purchasePrice', 'condition'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Validate purchase price as a positive number
      if (isNaN(formData.purchasePrice) || parseFloat(formData.purchasePrice) <= 0) {
        throw new Error('Purchase price must be a positive number');
      }

      const result = await addAsset({
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        createdBy: 'admin', // TODO: Get from auth context
      });

      setNotification({
        open: true,
        message: 'Asset added successfully!',
        severity: 'success'
      });

      // Clear form
      setFormData({
        name: '',
        category: '',
        serialNumber: '',
        purchaseDate: '',
        purchasePrice: '',
        condition: '',
        location: '',
        description: ''
      });

    } catch (error) {
      console.error('Error adding asset:', error);
      setNotification({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleCategoryChange = (newCategories) => {
    setCategories(newCategories);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New Asset
      </Typography>

      <CategoryManagement onCategoryChange={handleCategoryChange} />

      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Asset Name"
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
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Serial Number"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Purchase Date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Purchase Price"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                InputProps={{
                  startAdornment: 'SLe',
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                {assetConditions.map(condition => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
              >
                {loading ? 'Adding Asset...' : 'Add Asset'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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

export default AddNewAsset;
