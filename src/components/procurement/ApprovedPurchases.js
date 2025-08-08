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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ApprovedPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [formData, setFormData] = useState({
    requestId: '',
    vendorId: '',
    actualCost: '',
    purchaseDate: '',
    deliveryDate: '',
    status: 'ordered',
    invoiceNumber: '',
    notes: ''
  });

  const purchaseStatuses = [
    'ordered',
    'shipped',
    'delivered',
    'completed',
    'cancelled'
  ];

  useEffect(() => {
    let isMounted = true;
    let unsubscribeRequests = null;
    let unsubscribePurchases = null;
    let unsubscribeVendors = null;
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setErrorMessage('User not authenticated');
      setSnackbarOpen(true);
      setLoading(false);
      return () => { isMounted = false; };
    }

    try {
      // First, fetch vendors as they're needed for display
      const vendorsQuery = query(collection(db, 'vendors'), orderBy('name'));
      unsubscribeVendors = onSnapshot(
        vendorsQuery, 
        {
          next: (snapshot) => {
            if (!isMounted) return;
            const vendorsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setVendors(vendorsData);
          },
          error: (error) => {
            console.error("Error fetching vendors:", error);
            if (isMounted) {
              setErrorMessage('Failed to load vendors: ' + error.message);
              setSnackbarOpen(true);
            }
          }
        }
      );

      // Then fetch approved procurement requests
      const requestsQuery = query(
        collection(db, 'procurementRequests'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );

      unsubscribeRequests = onSnapshot(
        requestsQuery,
        {
          next: (requestsSnapshot) => {
            if (!isMounted) return;
            const requestsData = requestsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Now fetch purchases
            const purchasesQuery = query(
              collection(db, 'purchases'),
              orderBy('createdAt', 'desc')
            );

            if (unsubscribePurchases) {
              unsubscribePurchases();
            }

            unsubscribePurchases = onSnapshot(
              purchasesQuery,
              {
                next: (purchasesSnapshot) => {
                  if (!isMounted) return;
                  const purchasesData = purchasesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                      id: doc.id,
                      ...data,
                      createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
                    };
                  });

                  // Merge request data with purchase data
                  const mergedData = purchasesData.map(purchase => {
                    const request = requestsData.find(req => req.id === purchase.requestId);
                    return {
                      ...purchase,
                      requestDetails: request || null
                    };
                  });

                  setPurchases(mergedData);
                  setLoading(false);
                },
                error: (error) => {
                  console.error("Error fetching purchases:", error);
                  if (isMounted) {
                    setErrorMessage('Failed to load purchases: ' + error.message);
                    setSnackbarOpen(true);
                    setLoading(false);
                  }
                }
              }
            );
          },
          error: (error) => {
            console.error("Error fetching requests:", error);
            if (isMounted) {
              setErrorMessage('Failed to load requests: ' + error.message);
              setSnackbarOpen(true);
              setLoading(false);
            }
          }
        }
      );
    } catch (error) {
      console.error("Error setting up listeners:", error);
      if (isMounted) {
        setErrorMessage('Error setting up data listeners');
        setSnackbarOpen(true);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      try {
        if (unsubscribeRequests) unsubscribeRequests();
        if (unsubscribePurchases) unsubscribePurchases();
        if (unsubscribeVendors) unsubscribeVendors();
      } catch (error) {
        console.error("Error cleaning up listeners:", error);
      }
    };
  }, []);

  const handleOpenDialog = (purchase = null, view = false) => {
    setViewMode(view);
    if (purchase) {
      setFormData({
        requestId: purchase.requestId,
        vendorId: purchase.vendorId,
        actualCost: purchase.actualCost,
        purchaseDate: purchase.purchaseDate,
        deliveryDate: purchase.deliveryDate || '',
        status: purchase.status,
        invoiceNumber: purchase.invoiceNumber,
        notes: purchase.notes || ''
      });
      setSelectedPurchase(purchase);
    } else {
      setFormData({
        requestId: '',
        vendorId: '',
        actualCost: '',
        purchaseDate: '',
        deliveryDate: '',
        status: 'ordered',
        invoiceNumber: '',
        notes: ''
      });
      setSelectedPurchase(null);
    }
    setDialogOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to perform this action');
      }

      // Get current user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      
      // Validate admin role
      if (!userData.role || userData.role !== 'admin') {
        throw new Error('Only administrators can manage purchases');
      }

      // Validate required fields
      if (!userData.email) {
        throw new Error('User profile is incomplete: Email is missing');
      }

      // Create currentUser object with fallback for name
      const currentUser = {
        id: user.id,
        name: userData.displayName || userData.email.split('@')[0], // Use email username as fallback
        email: userData.email,
        role: userData.role
      };

      const purchaseData = {
        ...formData,
        updatedBy: currentUser,
        updatedAt: serverTimestamp()
      };

      if (selectedPurchase) {
        await updateDoc(doc(db, 'purchases', selectedPurchase.id), purchaseData);
      } else {
        purchaseData.createdAt = serverTimestamp();
        purchaseData.createdBy = purchaseData.updatedBy;
        await addDoc(collection(db, 'purchases'), purchaseData);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving purchase:', error);
      setErrorMessage(error.message || 'Failed to save purchase');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">
            Approved Purchases
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Purchase Record
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell>Actual Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    {purchase.requestDetails?.itemName || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {vendors.find(v => v.id === purchase.vendorId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{purchase.invoiceNumber}</TableCell>
                  <TableCell>{purchase.purchaseDate}</TableCell>
                  <TableCell>${purchase.actualCost}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {purchase.status}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(purchase, true)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog(purchase, false)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {viewMode ? 'View Purchase Details' : (selectedPurchase ? 'Edit Purchase' : 'Add Purchase')}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Vendor"
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleChange}
                  disabled={viewMode}
                >
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Invoice Number"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  disabled={viewMode}
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
                  disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Delivery Date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  disabled={viewMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Actual Cost"
                  name="actualCost"
                  value={formData.actualCost}
                  onChange={handleChange}
                  disabled={viewMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={viewMode}
                >
                  {purchaseStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={viewMode}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            )}
          </DialogActions>
        </form>
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

export default ApprovedPurchases;
