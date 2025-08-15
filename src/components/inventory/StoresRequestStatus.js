import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Snackbar, Alert, TextField, MenuItem, Button } from '@mui/material';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const approvalSteps = [
  'Head of Department',
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
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

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
      // Show notification for any request with a new approval
      const notified = reqs.filter(r => r.approvals && r.approvals.some(a => a.status === 'approved' && a.notified !== true));
      if (notified.length > 0) {
        setNotification({ open: true, message: `Update: ${notified.length} request(s) have new approvals.`, severity: 'info' });
      }
      setLoading(false);
    });
  }, [selectedUser, search, sortBy, sortDir]);

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;

  // Helper to format timestamp
  const formatTimestamp = ts => {
    if (!ts) return '';
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return '';
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
        req.approvals ? req.approvals.map((a, idx) => `${approvalSteps[idx]}: ${a.status}`).join('; ') : ''
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
      window.navigator.msSaveBlob(blob, 'stores_requests.csv');
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'stores_requests.csv');
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
        Approvals: req.approvals ? req.approvals.map((a, idx) => `${approvalSteps[idx]}: ${a.status}`).join('; ') : ''
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
    XLSX.writeFile(wb, 'stores_requests.xlsx');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Stores Request Status</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Filter by Applicant"
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {users.map(u => <MenuItem key={u} value={u}>{u === 'all' ? 'All Users' : u}</MenuItem>)}
        </TextField>
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
                          label={`${approvalSteps[aidx]}: ${a.status}`}
                          color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{r.category || ''}</TableCell>
                    <TableCell>{r.inventoryName || ''}</TableCell>
                    <TableCell>{r.quantity || ''}</TableCell>
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
                        label={`${approvalSteps[aidx]}: ${a.status}`}
                        color={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
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

export default StoresRequestStatus;
