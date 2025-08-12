import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert
} from '@mui/material';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import emailjs from 'emailjs-com';
import { db } from '../../firebase/config';

const approvalEmails = [
  { label: 'Estate Officer', email: 'mohamedsallu24@gmail.com' },
  { label: 'Registrar', email: 'magbieprincess@gmail.com' },
  { label: 'Finance', email: 'princessmagbie20@gmail.com' },
  { label: 'Principal', email: 'etulearninghubetusl@gmail.com' }
];

const serviceID = 'service_4p60v4c';
const templateID = 'template_3fh9k8z';
const userID = '7nidvs03z4-xpHE5n';

const sendApprovalEmail = async (toEmail, toName, request) => {
  const templateParams = {
    to_email: toEmail,
    to_name: toName,
    applicant: request.applicant,
    department: request.departmentName,
    purpose: request.purpose,
    requests: request.requests.map(r => `${r.inventoryName} (${r.quantity})`).join(', '),
  };
  try {
    await emailjs.send(serviceID, templateID, templateParams, userID);
  } catch (err) {
    console.error('EmailJS error:', err);
  }
};

const ApproveStoresRequest = () => {
  const [requests, setRequests] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  const handleApprove = async (req, approverIdx) => {
    if (!req.approvals || req.approvals[approverIdx].status !== 'pending') return;
    const newApprovals = req.approvals.map((a, idx) => {
      if (idx === approverIdx) return { ...a, status: 'approved', approvedAt: new Date().toISOString() };
      if (idx === approverIdx + 1) return { ...a, status: 'pending' };
      return a;
    });
    let newStatus = 'pending';
    if (approverIdx === approvalEmails.length - 1) newStatus = 'approved';
    await updateDoc(doc(db, 'storesRequests', req.id), {
      approvals: newApprovals,
      status: newStatus
    });
    // Send email to next approver if not final
    if (approverIdx + 1 < approvalEmails.length) {
      const next = approvalEmails[approverIdx + 1];
      await sendApprovalEmail(next.email, next.label, req);
    }
    setNotification({ open: true, message: 'Approval recorded and next approver notified.', severity: 'success' });
    // Refresh requests
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  if (loading) return <Box sx={{ p: 3 }}>Loading...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Approve Stores Requests</Typography>
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
                  {req.approvals && req.approvals.map((a, idx) => (
                    <Chip
                      key={a.email}
                      label={`${approvalEmails[idx].label}: ${a.status}`}
                      color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  {req.approvals && req.approvals.map((a, idx) => (
                    a.status === 'pending' ? (
                      <Button key={idx} variant="contained" size="small" onClick={() => handleApprove(req, idx)}>
                        Approve as {approvalEmails[idx].label}
                      </Button>
                    ) : null
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

export default ApproveStoresRequest;
