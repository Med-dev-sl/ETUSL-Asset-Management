

import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Snackbar, Alert } from '@mui/material';


const approvalEmails = [
  { label: 'Department', role: 'Department' },
  { label: 'Logistics Manager', role: 'Logistics Manager' },
  { label: 'Finance Officer', role: 'Finance Officer' },
  { label: 'Registrar', role: 'Registrar' },
  { label: 'Principal', role: 'Principal' }
];

const ICTDirectorateDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Simulate current user role
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const currentRole = currentUser.role;
  const currentDepartment = currentUser.department;

  useEffect(() => {
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      const filtered = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.departmentName === 'ICT Directorate');
      setRequests(filtered);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (req, approverIdx) => {
    if (!req.approvals || req.approvals[approverIdx].status !== 'pending') return;
    let newApprovals = req.approvals.map((a, idx) => {
      if (idx === approverIdx) return { ...a, status: 'approved', approvedAt: new Date().toISOString(), note: note[`${req.id}_${approverIdx}`] || '' };
      if (idx === approverIdx + 1) return { ...a, status: 'pending' };
      return a;
    });
    let newStatus = req.status;
    if (approverIdx === approvalEmails.length - 1) {
      newStatus = 'approved';
    } else if (req.status !== 'rejected') {
      newStatus = 'pending';
    }
    await updateDoc(doc(db, 'storesRequests', req.id), {
      approvals: newApprovals,
      status: newStatus
    });
    setNotification({ open: true, message: 'Approval recorded.', severity: 'success' });
    // Refresh requests
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      const filtered = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.departmentName === 'ICT Directorate');
      setRequests(filtered);
    });
    setNote(prev => ({ ...prev, [`${req.id}_${approverIdx}`]: '' }));
  };

  const handleReject = async (req, approverIdx) => {
    if (!req.approvals || req.approvals[approverIdx].status !== 'pending') return;
    const rejectionNote = note[`${req.id}_${approverIdx}`] || '';
    const newApprovals = req.approvals.map((a, idx) => {
      if (idx === approverIdx) return { ...a, status: 'rejected', rejectedAt: new Date().toISOString(), note: rejectionNote };
      return a;
    });
    await updateDoc(doc(db, 'storesRequests', req.id), {
      approvals: newApprovals,
      status: 'rejected'
    });
    setNotification({ open: true, message: 'Request rejected.', severity: 'error' });
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      const filtered = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.departmentName === 'ICT Directorate');
      setRequests(filtered);
    });
    setNote(prev => ({ ...prev, [`${req.id}_${approverIdx}`]: '' }));
  };

  if (loading) return <Box sx={{ p: 3 }}>Loading...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>ICT Directorate Requests</Typography>
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
            {requests.map(req => (
              <TableRow key={req.id}>
                <TableCell>{req.departmentName}</TableCell>
                <TableCell>{req.applicant}</TableCell>
                <TableCell>{req.purpose}</TableCell>
                <TableCell>
                  <Chip label={req.status} color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'default'} />
                </TableCell>
                <TableCell>
                  {approvalEmails.map((step, idx) => {
                    const a = req.approvals && req.approvals[idx];
                    return (
                      <Chip
                        key={step.label}
                        label={`${step.label}: ${a ? a.status : 'pending'}`}
                        color={a && a.status === 'approved' ? 'success' : a && a.status === 'pending' ? 'warning' : a && a.status === 'rejected' ? 'error' : 'default'}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    );
                  })}
                </TableCell>
                <TableCell>
                  {approvalEmails.map((step, idx) => {
                    const a = req.approvals && req.approvals[idx];
                    // For Department: allow if first pending and user's department matches request's department
                    let isCurrentApprover = false;
                    if (a && a.status === 'pending' && (idx === 0 || req.approvals.slice(0, idx).every(prev => prev.status !== 'pending'))) {
                      if (step.role === 'Department') {
                        // Allow if user is Department and their department is ICT Directorate
                        isCurrentApprover = currentRole === 'Department' && currentDepartment === 'ICT Directorate' && req.departmentName === 'ICT Directorate';
                      } else {
                        isCurrentApprover = currentRole === step.role;
                      }
                    }
                    return isCurrentApprover ? (
                      <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <input
                          type="text"
                          placeholder="Optional note (if rejecting)"
                          value={note[`${req.id}_${idx}`] || ''}
                          onChange={e => setNote(prev => ({ ...prev, [`${req.id}_${idx}`]: e.target.value }))}
                          style={{ marginBottom: 4, padding: 4, borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }}
                        />
                        <Button variant="contained" size="small" color="success" onClick={() => handleApprove(req, idx)}>
                          Approve as {step.label}
                        </Button>
                        <Button variant="outlined" size="small" color="error" onClick={() => handleReject(req, idx)}>
                          Reject as {step.label}
                        </Button>
                      </Box>
                    ) : null;
                  })}
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

export default ICTDirectorateDashboard;
