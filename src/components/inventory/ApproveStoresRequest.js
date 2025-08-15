import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Snackbar, Alert, TextField, MenuItem } from '@mui/material';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import emailjs from 'emailjs-com';
import { db } from '../../firebase/config';

const approvalEmails = [
  { label: 'Head of Department', email: 'mohamedsallu24@gmail.com' },
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
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Helper to format timestamp
  const formatTimestamp = ts => {
    if (!ts) return '';
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return '';
  };

  useEffect(() => {
    getDocs(collection(db, 'storesRequests')).then(snapshot => {
      let reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Wide search filter
      if (search) {
        const s = search.toLowerCase();
        reqs = reqs.filter(r =>
          (r.departmentName && r.departmentName.toLowerCase().includes(s)) ||
          (r.applicant && r.applicant.toLowerCase().includes(s)) ||
          (r.purpose && r.purpose.toLowerCase().includes(s)) ||
          (r.status && r.status.toLowerCase().includes(s)) ||
          (r.approvals && r.approvals.some(a => a.status.toLowerCase().includes(s)))
        );
      }
      // Sort
      reqs = reqs.sort((a, b) => {
        let av = a[sortBy], bv = b[sortBy];
        if (sortBy === 'createdAt') {
          av = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          bv = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        }
        if (av === undefined) return 1;
        if (bv === undefined) return -1;
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
      setRequests(reqs);
      setLoading(false);
    });
  }, [search, sortBy, sortDir]);

  const handleApprove = async (req, approverIdx) => {
    if (!req.approvals || req.approvals[approverIdx].status !== 'pending') return;
    const newApprovals = req.approvals.map((a, idx) => {
      if (idx === approverIdx) return { ...a, status: 'approved', approvedAt: new Date().toISOString() };
      if (idx === approverIdx + 1) return { ...a, status: 'pending' };
      return a;
    });
    let newStatus = 'pending';
    let deductStock = false;
    if (approverIdx === approvalEmails.length - 1) {
      newStatus = 'approved';
      deductStock = true;
    }
    await updateDoc(doc(db, 'storesRequests', req.id), {
      approvals: newApprovals,
      status: newStatus
    });
    // Deduct stock if fully approved
    if (deductStock && Array.isArray(req.requests)) {
      for (const r of req.requests) {
        // r.inventoryId or r.inventoryName, r.quantity
        // Try to find by itemId or name
        let q = collection(db, 'inventory');
        let found = null;
        // Try by itemId
        if (r.inventoryId) {
          const invSnap = await getDocs(query(q, where('itemId', '==', r.inventoryId)));
          if (!invSnap.empty) found = invSnap.docs[0];
        }
        // Fallback by name
        if (!found && r.inventoryName) {
          const invSnap = await getDocs(query(q, where('name', '==', r.inventoryName)));
          if (!invSnap.empty) found = invSnap.docs[0];
        }
        if (found) {
          const invData = found.data();
          const newQty = Math.max(0, (parseInt(invData.quantity) || 0) - (parseInt(r.quantity) || 0));
          await updateDoc(doc(db, 'inventory', found.id), { quantity: newQty });
        }
      }
    }
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


  // Export to CSV
  const exportToCSV = () => {
    if (!requests.length) return;
    const headers = ['Timestamp', 'Department', 'Applicant', 'Purpose', 'Status', 'Approvals', 'Item Category', 'Inventory Item', 'Quantity'];
    let csv = headers.join(',') + '\n';
    requests.forEach(req => {
      const base = [
        formatTimestamp(req.createdAt),
        req.departmentName,
        req.applicant,
        req.purpose,
        req.status,
        req.approvals ? req.approvals.map((a, idx) => `${approvalEmails[idx].label}: ${a.status}`).join('; ') : ''
      ];
      if (Array.isArray(req.requests) && req.requests.length) {
        req.requests.forEach(r => {
          const row = [...base, r.category || '', r.inventoryName || '', r.quantity || ''];
          csv += row.map(x => '"' + (x ? String(x).replace(/"/g, '""') : '') + '"').join(',') + '\n';
        });
      } else {
        const row = [...base, '', '', ''];
        csv += row.map(x => '"' + (x ? String(x).replace(/"/g, '""') : '') + '"').join(',') + '\n';
      }
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, 'approve_stores_requests.csv');
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'approve_stores_requests.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!requests.length) return;
    // Flatten requests for Excel: one row per item
    const rows = [];
    requests.forEach(req => {
      const base = {
        Timestamp: formatTimestamp(req.createdAt),
        Department: req.departmentName,
        Applicant: req.applicant,
        Purpose: req.purpose,
        Status: req.status,
        Approvals: req.approvals ? req.approvals.map((a, idx) => `${approvalEmails[idx].label}: ${a.status}`).join('; ') : ''
      };
      if (Array.isArray(req.requests) && req.requests.length) {
        req.requests.forEach(r => {
          rows.push({ ...base, 'Item Category': r.category || '', 'Inventory Item': r.inventoryName || '', 'Quantity': r.quantity || '' });
        });
      } else {
        rows.push({ ...base, 'Item Category': '', 'Inventory Item': '', 'Quantity': '' });
      }
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requests');
    XLSX.writeFile(wb, 'approve_stores_requests.xlsx');
  };

  if (loading) return <Box sx={{ p: 3 }}>Loading...</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Approve Stores Requests</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          label="Wide Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          label="Sort By"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="createdAt">Date</MenuItem>
          <MenuItem value="departmentName">Department</MenuItem>
          <MenuItem value="applicant">Applicant</MenuItem>
          <MenuItem value="purpose">Purpose</MenuItem>
          <MenuItem value="status">Status</MenuItem>
        </TextField>
        <TextField
          select
          label="Sort Direction"
          value={sortDir}
          onChange={e => setSortDir(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="desc">Descending</MenuItem>
          <MenuItem value="asc">Ascending</MenuItem>
        </TextField>
        <Button variant="outlined" onClick={exportToCSV}>Export CSV</Button>
        <Button variant="outlined" onClick={exportToExcel}>Export Excel</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Applicant</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Approvals</TableCell>
              <TableCell>Item Category</TableCell>
              <TableCell>Inventory Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map(req => (
              Array.isArray(req.requests) && req.requests.length ? (
                req.requests.map((r, idx) => (
                  <TableRow key={req.id + '-' + idx}>
                    <TableCell>{formatTimestamp(req.createdAt)}</TableCell>
                    <TableCell>{req.departmentName}</TableCell>
                    <TableCell>{req.applicant}</TableCell>
                    <TableCell>{req.purpose}</TableCell>
                    <TableCell>
                      <Chip label={req.status} color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell>
                      {req.approvals && req.approvals.map((a, aidx) => (
                        <Chip
                          key={a.email}
                          label={`${approvalEmails[aidx].label}: ${a.status}`}
                          color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{r.category || ''}</TableCell>
                    <TableCell>{r.inventoryName || ''}</TableCell>
                    <TableCell>{r.quantity || ''}</TableCell>
                    <TableCell>
                      {req.approvals && req.approvals.map((a, aidx) => (
                        a.status === 'pending' ? (
                          <Button key={aidx} variant="contained" size="small" onClick={() => handleApprove(req, aidx)}>
                            Approve as {approvalEmails[aidx].label}
                          </Button>
                        ) : null
                      ))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow key={req.id}>
                  <TableCell>{formatTimestamp(req.createdAt)}</TableCell>
                  <TableCell>{req.departmentName}</TableCell>
                  <TableCell>{req.applicant}</TableCell>
                  <TableCell>{req.purpose}</TableCell>
                  <TableCell>
                    <Chip label={req.status} color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>
                    {req.approvals && req.approvals.map((a, aidx) => (
                      <Chip
                        key={a.email}
                        label={`${approvalEmails[aidx].label}: ${a.status}`}
                        color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    {req.approvals && req.approvals.map((a, aidx) => (
                      a.status === 'pending' ? (
                        <Button key={aidx} variant="contained" size="small" onClick={() => handleApprove(req, aidx)}>
                          Approve as {approvalEmails[aidx].label}
                        </Button>
                      ) : null
                    ))}
                  </TableCell>
                </TableRow>
              )
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
