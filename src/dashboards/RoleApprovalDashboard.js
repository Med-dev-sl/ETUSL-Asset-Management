import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert } from '@mui/material';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Map role to approval index in approvals array
const roleApprovalIndex = {
  'Estate Officer': 0,
  'Registrar': 1,
  'Finance Officer': 2,
  'Principal': 3,
  // Add more roles as needed
};

const RoleApprovalDashboard = ({ role }) => {
  const [requests, setRequests] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const approvalIdx = roleApprovalIndex[role];

  useEffect(() => {
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  const handleApprove = async (req) => {
    if (!req.approvals || req.approvals[approvalIdx].status !== 'pending') return;
    const newApprovals = req.approvals.map((a, idx) => {
      if (idx === approvalIdx) return { ...a, status: 'approved', approvedAt: new Date().toISOString() };
      if (idx === approvalIdx + 1) return { ...a, status: 'pending' };
      return a;
    });
    let newStatus = 'pending';
    if (approvalIdx === req.approvals.length - 1) newStatus = 'approved';
    await updateDoc(doc(db, 'storesRequests', req.id), {
      approvals: newApprovals,
      status: newStatus
    });
    setNotification({ open: true, message: 'Approval recorded.', severity: 'success' });
    // Refresh requests
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  if (loading) return <Box sx={{ p: 3 }}>Loading...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>{role} Dashboard</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell>Applicant</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approvals</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.filter(req => req.approvals && req.approvals[approvalIdx] && req.approvals[approvalIdx].status === 'pending').map(req => (
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
                      label={`${a.label}: ${a.status}`}
                      color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Button variant="contained" size="small" onClick={() => handleApprove(req)}>
                    Approve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" sx={{ mt: 4 }}>Approved Requests</Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
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
            {requests.filter(req => req.approvals && req.approvals[approvalIdx] && req.approvals[approvalIdx].status === 'approved').map(req => (
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
                      label={`${a.label}: ${a.status}`}
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

export default RoleApprovalDashboard;
