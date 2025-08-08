import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AssetDisposal = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [disposalReason, setDisposalReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'assets'));
      const loadedAssets = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(asset => asset.status !== 'disposed'); // Only show active assets
      setAssets(loadedAssets);
    } catch (error) {
      showNotification('Error loading assets: ' + error.message, 'error');
    }
  };

  const handleDispose = async () => {
    if (!selectedAsset || !disposalReason) return;

    try {
      const assetRef = doc(db, 'assets', selectedAsset.id);
      await updateDoc(assetRef, {
        status: 'disposed',
        disposalDate: new Date(),
        disposalReason: disposalReason
      });

      showNotification('Asset disposed successfully!', 'success');
      setDialogOpen(false);
      setDisposalReason('');
      setSelectedAsset(null);
      loadAssets();
    } catch (error) {
      showNotification('Error disposing asset: ' + error.message, 'error');
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset Disposal
      </Typography>

      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
                  <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                  <TableCell>{asset.condition}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setDialogOpen(true);
                      }}
                    >
                      Dispose
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Dispose Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Are you sure you want to dispose of this asset?
            </Typography>
            <Typography variant="body2" gutterBottom>
              Asset: {selectedAsset?.name}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Disposal Reason"
              value={disposalReason}
              onChange={(e) => setDisposalReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDispose}
            variant="contained"
            color="error"
            disabled={!disposalReason}
          >
            Dispose Asset
          </Button>
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

export default AssetDisposal;
