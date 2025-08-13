import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
// import emailjs from 'emailjs-com';
import { db } from '../../firebase/config';

const approvalEmails = [
  { label: 'Estate Officer', email: 'sllearninghub98@gmail.com' },
  { label: 'Registrar', email: 'magbieprincess@gmail.com' },
  { label: 'Finance', email: 'princessmagbie20@gmail.com' },
  { label: 'Principal', email: 'etulearninghubetusl@gmail.com' }
];

const StoresRequest = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [dean, setDean] = useState('');
  const [applicant, setApplicant] = useState('');
  const [purpose, setPurpose] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inventory, setInventory] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [requests, setRequests] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch departments
    getDocs(collection(db, 'locations')).then(snapshot => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // Fetch inventory categories from inventoryCategories collection
    getDocs(collection(db, 'inventoryCategories')).then(snapshot => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    if (selectedDept) {
      const dept = departments.find(d => d.id === selectedDept);
      setDeptHead(dept?.departmentHead || '');
      setDean(dept?.dean || '');
    } else {
      setDeptHead('');
      setDean('');
    }
  }, [selectedDept, departments]);

  useEffect(() => {
    if (selectedCategory) {
      // Fetch only inventory items with the selected category using Firestore query
      const q = query(collection(db, 'inventory'), where('category', '==', selectedCategory));
      getDocs(q).then(snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Selected Category:', selectedCategory);
        console.log('Fetched Inventory Items:', items);
        setInventory(items);
      });
    } else {
      setInventory([]);
    }
  }, [selectedCategory]);

  const handleAddRequest = () => {
    if (!selectedCategory || !selectedInventory || !quantity) return;
    const item = inventory.find(i => i.id === selectedInventory);
    setRequests(prev => [
      ...prev,
      {
        category: selectedCategory,
        categoryName: categories.find(c => c.id === selectedCategory)?.name || '',
        inventoryId: selectedInventory,
        inventoryName: item?.name || '',
        quantity,
        timestamp: new Date().toLocaleString()
      }
    ]);
    setSelectedCategory('');
    setSelectedInventory('');
    setQuantity('');
  };

  const handleRemoveRequest = idx => {
    setRequests(prev => prev.filter((_, i) => i !== idx));
  };



  const handleSubmit = async () => {
    if (!selectedDept || !applicant || !purpose || requests.length === 0) {
      setNotification({ open: true, message: 'Fill all required fields and add at least one request.', severity: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'storesRequests'), {
        departmentId: selectedDept,
        departmentName: departments.find(d => d.id === selectedDept)?.name || '',
        departmentHead: deptHead,
        dean,
        applicant,
        purpose,
        requests,
        approvals: approvalEmails.map((a, idx) => ({ ...a, status: idx === 0 ? 'pending' : 'waiting', approvedAt: null })),
        status: 'pending',
        createdAt: serverTimestamp()
      });
  setNotification({ open: true, message: 'Request submitted! Awaiting approvals.', severity: 'success' });
      setSelectedDept(''); setDeptHead(''); setDean(''); setApplicant(''); setPurpose(''); setRequests([]);
    } catch (e) {
      setNotification({ open: true, message: 'Error: ' + e.message, severity: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Stores Request</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          select
          label="Select Department"
          value={selectedDept}
          onChange={e => setSelectedDept(e.target.value)}
          fullWidth sx={{ mb: 2 }}
        >
          {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
        <TextField
          label="Department Head"
          value={deptHead}
          fullWidth sx={{ mb: 2 }}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Dean"
          value={dean}
          fullWidth sx={{ mb: 2 }}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Staff/Applicant Name"
          value={applicant}
          onChange={e => setApplicant(e.target.value)}
          fullWidth sx={{ mb: 2 }}
        />
        <TextField
          label="Purpose of Request"
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
          fullWidth sx={{ mb: 2 }}
        />
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Add Inventory Requests</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            select
            label="Category"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Inventory Item"
            value={selectedInventory}
            onChange={e => setSelectedInventory(e.target.value)}
            sx={{ minWidth: 180 }}
            disabled={!selectedCategory}
            helperText={!selectedCategory ? 'Select a category first' : (selectedCategory && inventory.length === 0 ? 'No items in this category' : '')}
          >
            {!selectedCategory ? (
              <MenuItem value="" disabled>
                Select a category first
              </MenuItem>
            ) : inventory.length === 0 ? (
              <MenuItem value="" disabled>
                No items in this category
              </MenuItem>
            ) : (
              inventory.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)
            )}
          </TextField>
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            sx={{ minWidth: 120 }}
            disabled={!selectedInventory}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddRequest} disabled={!selectedCategory || !selectedInventory || !quantity}>Add</Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Inventory Item</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req, idx) => (
                <TableRow key={idx}>
                  <TableCell>{req.categoryName}</TableCell>
                  <TableCell>{req.inventoryName}</TableCell>
                  <TableCell>{req.quantity}</TableCell>
                  <TableCell>{req.timestamp}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleRemoveRequest(idx)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Button variant="contained" color="primary" onClick={handleSubmit} disabled={submitting}>Submit Request</Button>
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

export default StoresRequest;
