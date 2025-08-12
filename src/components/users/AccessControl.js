import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  Button,
  Snackbar
} from '@mui/material';
import { userService } from '../../services/userService';

const AccessControl = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        userService.getAllRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);

      // Initialize permissions matrix
      const permissionsMatrix = {};
      usersData.forEach(user => {
        permissionsMatrix[user.id] = {};
        rolesData.forEach(role => {
          permissionsMatrix[user.id][role.id] = user.role === role.id;
        });
      });
      setPermissions(permissionsMatrix);
    } catch (error) {
      showError('Failed to load data');
    }
  };

  const handlePermissionChange = async (userId, roleId) => {
    try {
      const updatedPermissions = {
        ...permissions,
        [userId]: {
          ...permissions[userId],
          [roleId]: !permissions[userId][roleId]
        }
      };
      setPermissions(updatedPermissions);

      // Get the user and update their role
      const user = users.find(u => u.id === userId);
      if (user) {
        const newRoles = Object.entries(updatedPermissions[userId])
          .filter(([, hasRole]) => hasRole)
          .map(([roleId]) => roleId);

        await userService.updateUser(userId, {
          ...user,
          role: newRoles[0] || null // Set primary role
        });
        showSuccess('Access updated successfully');
      }
    } catch (error) {
      showError('Failed to update access');
      // Revert the change in UI
      loadData();
    }
  };

  const showSuccess = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  const showError = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Access Control Matrix
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              {roles.map(role => (
                <TableCell key={role.id} align="center">
                  {role.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell component="th" scope="row">
                  {`${user.firstName} ${user.lastName}`}
                  <Typography variant="caption" display="block" color="textSecondary">
                    {user.email}
                  </Typography>
                </TableCell>
                {roles.map(role => (
                  <TableCell key={role.id} align="center">
                    <Checkbox
                      checked={permissions[user.id]?.[role.id] || false}
                      onChange={() => handlePermissionChange(user.id, role.id)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccessControl;
