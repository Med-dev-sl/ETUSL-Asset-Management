import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, []);

  const loadAssets = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'assets'));
      const loadedAssets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssets(loadedAssets);
    } catch (error) {
      showNotification('Error loading assets: ' + error.message, 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'assetCategories'));
      const loadedCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(loadedCategories);
    } catch (error) {
      showNotification('Error loading categories: ' + error.message, 'error');
    }
  };

  const handleEdit = async () => {
    if (!selectedAsset) return;

    try {
      const assetRef = doc(db, 'assets', selectedAsset.id);
      await updateDoc(assetRef, {
        name: selectedAsset.name,
        category: selectedAsset.category,
        serialNumber: selectedAsset.serialNumber,
        condition: selectedAsset.condition,
        location: selectedAsset.location,
        description: selectedAsset.description
      });

      showNotification('Asset updated successfully!', 'success');
      setEditDialogOpen(false);
      loadAssets();
    } catch (error) {
      showNotification('Error updating asset: ' + error.message, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedAsset(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset Management
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Search Assets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: <SearchIcon color="action" />
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
                  <TableCell>{asset.status || 'Active'}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setEditDialogOpen(true);
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

      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Asset Name"
              name="name"
              value={selectedAsset?.name || ''}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={selectedAsset?.category || ''}
              onChange={handleInputChange}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Serial Number"
              name="serialNumber"
              value={selectedAsset?.serialNumber || ''}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={selectedAsset?.location || ''}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              name="description"
              value={selectedAsset?.description || ''}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">Save Changes</Button>
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

export default AssetManagement;
