import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import { userService } from '../../services/userService';

const ManageRoles = () => {
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSuccess = (message) => setSnackbar({ open: true, message, severity: 'success' });
  const showError = (message) => setSnackbar({ open: true, message, severity: 'error' });

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await userService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      showError('Failed to load roles');
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleOpen = (role = null) => {
    setSelectedRole(role);
    setFormData(role ? { name: role.name, description: role.description } : { name: '', description: '' });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRole(null);
    setFormData({ name: '', description: '' });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!selectedRole) {
        await userService.createRole(formData);
        showSuccess('Role created successfully');
      } else {
        await userService.updateRole(selectedRole.id, formData);
        showSuccess('Role updated successfully');
      }
      handleClose();
      loadRoles();
    } catch (error) {
      showError(error.message || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await userService.deleteRole(roleId);
      showSuccess('Role deleted successfully');
      loadRoles();
    } catch (error) {
      showError(error.message || 'Failed to delete role');
    }
  };

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Manage Roles</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2 }}>Add New Role</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpen(role)} color="primary">Edit</Button>
                  <Button onClick={() => handleDelete(role.id)} color="error">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }} onSubmit={handleSubmit}>
            <TextField name="name" label="Role Name" fullWidth margin="normal" value={formData.name} onChange={handleChange} required />
            <TextField name="description" label="Description" fullWidth margin="normal" value={formData.description} onChange={handleChange} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{selectedRole ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageRoles;
