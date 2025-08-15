import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { userService } from '../../services/userService';

const ListUsers = ({ onEdit }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showError = (message) => setSnackbar({ open: true, message, severity: 'error' });
  const showSuccess = (message) => setSnackbar({ open: true, message, severity: 'success' });

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      showError('Failed to load users');
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await userService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      showError('Failed to load roles');
    }
  }, []);

  useEffect(() => { loadUsers(); loadRoles(); }, [loadUsers, loadRoles]);

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      showSuccess('User deleted successfully');
      loadUsers();
    } catch (error) {
      showError(error.message || 'Failed to delete user');
    }
  };

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">List Users</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{(user.roles || []).map(roleId => roles.find(r => r.id === roleId)?.name).filter(Boolean).join(', ')}</TableCell>
                <TableCell>
                  <IconButton onClick={() => onEdit && onEdit(user)} color="primary"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(user.id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ListUsers;
