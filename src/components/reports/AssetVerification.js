import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
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
  Alert,
  Snackbar,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const AssetVerification = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [verificationNote, setVerificationNote] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const q = query(collection(db, 'assets'));
      const querySnapshot = await getDocs(q);
      const assetList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastVerified: doc.data().lastVerified?.toDate?.()?.toLocaleString() || 'Never'
      }));
      setAssets(assetList);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setErrorMessage('Failed to load assets');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to verify assets');
      }

      // Update asset verification status
      await updateDoc(doc(db, 'assets', selectedAsset.id), {
        lastVerified: serverTimestamp(),
        verificationStatus: 'verified',
        verifiedBy: {
          id: user.id,
          name: user.displayName || user.email,
          email: user.email
        }
      });

      // Create verification record
      await addDoc(collection(db, 'assetVerifications'), {
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        verifiedAt: serverTimestamp(),
        note: verificationNote,
        verifiedBy: {
          id: user.id,
          name: user.displayName || user.email,
          email: user.email
        }
      });

      setSuccessOpen(true);
      setSelectedAsset(null);
      setVerificationNote('');
      fetchAssets(); // Refresh asset list
    } catch (error) {
      console.error('Error verifying asset:', error);
      setErrorMessage(error.message || 'Failed to verify asset');
      setSnackbarOpen(true);
    } finally {
      setVerifying(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Asset Verification
        </Typography>

        <TextField
          fullWidth
          label="Search Assets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset Tag</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Last Verified</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.assetTag}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{asset.lastVerified}</TableCell>
                  <TableCell>
                    <Chip
                      label={asset.verificationStatus || 'pending'}
                      color={asset.verificationStatus === 'verified' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      Verify
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Verification Dialog */}
      <Dialog open={!!selectedAsset} onClose={() => setSelectedAsset(null)}>
        <DialogTitle>Verify Asset</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                Asset: {selectedAsset?.name}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Tag: {selectedAsset?.assetTag}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Verification Notes"
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAsset(null)}>Cancel</Button>
          <Button
            onClick={handleVerify}
            variant="contained"
            disabled={verifying}
          >
            {verifying ? <CircularProgress size={24} /> : 'Confirm Verification'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            Asset has been verified successfully.
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

export default AssetVerification;
