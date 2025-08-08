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
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ViewRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view'); // 'view' or 'approve'
  const [approvalNote, setApprovalNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    let unsubscribe;
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      setErrorMessage('User not authenticated');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'procurementRequests'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          try {
            const requestsData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'N/A'
              };
            });
            setRequests(requestsData);
          } catch (err) {
            console.error("Error processing request data:", err);
            setErrorMessage('Error processing request data');
            setSnackbarOpen(true);
          }
          setLoading(false);
        },
        error: (error) => {
          console.error("Error fetching requests:", error);
          setErrorMessage('Failed to load requests: ' + error.message);
          setSnackbarOpen(true);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Error setting up listener:", error);
      setErrorMessage('Error setting up data listener');
      setSnackbarOpen(true);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      }
    };
  }, []);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setDialogMode('view');
    setDialogOpen(true);
  };

  const handleApproveDialog = (request) => {
    setSelectedRequest(request);
    setDialogMode('approve');
    setDialogOpen(true);
  };

  const handleRequestAction = async (status) => {
    if (!selectedRequest) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) throw new Error('You must be logged in to perform this action');

      // Get current user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      if (!userData.email) {
        throw new Error('User email not found');
      }

      // Use displayName as fallback
      const displayName = userData.displayName || userData.email.split('@')[0];

      await updateDoc(doc(db, 'procurementRequests', selectedRequest.id), {
        status,
        approvedBy: {
          id: user.id,
          name: displayName,
          email: userData.email,
          role: userData.role
        },
        approvalNote,
        updatedAt: serverTimestamp()
      });

      setDialogOpen(false);
      setApprovalNote('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request:', error);
      setErrorMessage(error.message || 'Failed to update request');
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
          Procurement Requests
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.itemName}</TableCell>
                  <TableCell>{request.category}</TableCell>
                  <TableCell>{request.requestedBy.name}</TableCell>
                  <TableCell>{request.requestedBy.department}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {request.priority}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {request.status}
                  </TableCell>
                  <TableCell>{request.createdAt}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewRequest(request)}>
                      <ViewIcon />
                    </IconButton>
                    {request.status === 'pending' && (
                      <IconButton onClick={() => handleApproveDialog(request)} color="primary">
                        <EditIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* View/Approve Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'view' ? 'Request Details' : 'Update Request Status'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Item:</strong> {selectedRequest.itemName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {selectedRequest.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Quantity:</strong> {selectedRequest.quantity}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Estimated Cost:</strong> ${selectedRequest.estimatedCost}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Justification:</strong> {selectedRequest.justification}
              </Typography>

              {dialogMode === 'approve' && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Approval/Rejection Note"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  sx={{ mt: 2 }}
                  required
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {dialogMode === 'approve' && (
            <>
              <Button
                onClick={() => handleRequestAction('approved')}
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
              >
                Approve
              </Button>
              <Button
                onClick={() => handleRequestAction('rejected')}
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
              >
                Reject
              </Button>
            </>
          )}
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
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

export default ViewRequests;
