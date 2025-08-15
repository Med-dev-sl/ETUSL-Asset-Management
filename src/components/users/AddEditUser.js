import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert
} from '@mui/material';
import { userService } from '../../services/userService';

const AddEditUser = ({ user, onSuccess, onCancel }) => {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    password: '',
    confirmPassword: '',
    roles: user?.roles || []
  });
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const errors = [];
    if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!user) {
        if (formData.password !== formData.confirmPassword) {
          showError("Passwords don't match");
          return;
        }
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
          showError(passwordErrors.join('\n'));
          return;
        }
  // Only include password if present, and never send passwordHash unless set
  const userData = { ...formData, createdAt: new Date().toISOString() };
  delete userData.confirmPassword;
  if (formData.password) userData.password = formData.password;
        // Always remove passwordHash before saving
        delete userData.passwordHash;
        // Remove any undefined fields
        Object.keys(userData).forEach(key => {
          if (userData[key] === undefined) delete userData[key];
        });
        await userService.createUser(userData);
        showSuccess('User created successfully');
        if (onSuccess) onSuccess();
      } else {
        const userData = { ...formData };
        delete userData.password;
        delete userData.confirmPassword;
        await userService.updateUser(user.id, userData);
        showSuccess('User updated successfully');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      showError(error.message || 'Failed to save user');
    }
  };

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6">{user ? 'Edit User' : 'Add User'}</Typography>
      <Box component="form" sx={{ pt: 2 }} onSubmit={handleSubmit}>
        <TextField name="email" label="Email" fullWidth margin="normal" value={formData.email} onChange={handleChange} required />
        <TextField name="firstName" label="First Name" fullWidth margin="normal" value={formData.firstName} onChange={handleChange} required />
        <TextField name="lastName" label="Last Name" fullWidth margin="normal" value={formData.lastName} onChange={handleChange} required />
        {!user && (
          <>
            <TextField name="password" label="Password" type="password" fullWidth margin="normal" value={formData.password} onChange={handleChange} required error={formData.password !== formData.confirmPassword} helperText={formData.password !== formData.confirmPassword ? "Passwords don't match" : ''} />
            <TextField name="confirmPassword" label="Confirm Password" type="password" fullWidth margin="normal" value={formData.confirmPassword} onChange={handleChange} required error={formData.password !== formData.confirmPassword} />
          </>
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel>Roles</InputLabel>
          <Select name="roles" multiple value={formData.roles} onChange={handleChange} label="Roles" renderValue={(selected) => selected.map(roleId => roles.find(r => r.id === roleId)?.name).filter(Boolean).join(', ')}>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onCancel} sx={{ mr: 2 }}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">{user ? 'Update' : 'Create'}</Button>
        </Box>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AddEditUser;
