import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Snackbar, Alert, TextField, MenuItem
} from '@mui/material';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const approvalSteps = [
  'Estate Officer',
  'Registrar',
  'Finance',
  'Principal'
];


const StoresRequestStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');

  useEffect(() => {
    // Fetch all unique applicants for filter
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      const all = snapshot.docs.map(doc => doc.data().applicant).filter(Boolean);
      setUsers(['all', ...Array.from(new Set(all))]);
    });
  }, []);

  useEffect(() => {
    let q = collection(db, 'storesRequests');
    if (selectedUser && selectedUser !== 'all') {
      q = query(q, where('applicant', '==', selectedUser));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    getDocs(q).then(snapshot => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
      // Show notification for any request with a new approval
      const notified = reqs.filter(r => r.approvals && r.approvals.some(a => a.status === 'approved' && a.notified !== true));
      if (notified.length > 0) {
        setNotification({ open: true, message: `Update: ${notified.length} request(s) have new approvals.`, severity: 'info' });
      }
      setLoading(false);
    });
  }, [selectedUser]);

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Stores Request Status</Typography>
      <TextField
        select
        label="Filter by Applicant"
        value={selectedUser}
        onChange={e => setSelectedUser(e.target.value)}
        sx={{ mb: 2, minWidth: 220 }}
      >
        {users.map(u => <MenuItem key={u} value={u}>{u === 'all' ? 'All Users' : u}</MenuItem>)}
      </TextField>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell>Applicant</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approvals</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map(req => (
              <TableRow key={req.id}>
                <TableCell>{req.departmentName}</TableCell>
                <TableCell>{req.applicant}</TableCell>
                <TableCell>{req.purpose}</TableCell>
                <TableCell>
                  <Chip label={req.status} color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'default'} />
                </TableCell>
                <TableCell>
                  {req.approvals && req.approvals.map((a, idx) => (
                    <Chip
                      key={a.email}
                      label={`${approvalSteps[idx]}: ${a.status}`}
                      color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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

export default StoresRequestStatus;
