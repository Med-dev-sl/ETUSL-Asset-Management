import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AddDepartmentHead = () => {
  const [form, setForm] = useState({
    name: '',
    building: '',
    description: '',
    departmentHead: '',
    dean: ''
  });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'locations'), {
        ...form,
        createdAt: new Date().toISOString()
      });
      setForm({ name: '', building: '', description: '', departmentHead: '', dean: '' });
      setNotification({ open: true, message: 'Department added!', severity: 'success' });
    } catch (error) {
      setNotification({ open: true, message: 'Error: ' + error.message, severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Add Department, Head & Dean</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Department Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Building"
            name="building"
            value={form.building}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            sx={{ mb: 2 }}
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Department Head"
            name="departmentHead"
            value={form.departmentHead}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Dean"
            name="dean"
            value={form.dean}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained">Add Department</Button>
        </form>
      </Paper>
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

export default AddDepartmentHead;
