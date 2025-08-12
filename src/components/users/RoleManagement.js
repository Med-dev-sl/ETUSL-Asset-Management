import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  Grid
} from '@mui/material';
import { userService } from '../../services/userService';

const permissions = {
  users: ['view', 'create', 'update', 'delete'],
  assets: ['view', 'create', 'update', 'delete'],
  inventory: ['view', 'create', 'update', 'delete'],
  maintenance: ['view', 'create', 'update', 'delete'],
  reports: ['view', 'create', 'export'],
  departments: ['view', 'create', 'update', 'delete'],
  dashboard: ['view'],
  procurement: ['view', 'create', 'update', 'delete'],
  settings: ['view', 'update']
};

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {}
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await userService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      showError('Failed to load roles');
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Initialize empty permissions object based on permission structure
  const getInitialPermissions = () => {
    const initial = {};
    Object.entries(permissions).forEach(([module, actions]) => {
      actions.forEach(action => {
        initial[`${module}.${action}`] = false;
      });
    });
    return initial;
  };

  const handleOpen = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions || getInitialPermissions()
      });
    } else {
      setSelectedRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: getInitialPermissions()
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: getInitialPermissions()
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [`${module}.${action}`]: !prev.permissions[`${module}.${action}`]
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (selectedRole) {
        await userService.updateRole(selectedRole.id, formData);
        showSuccess('Role updated successfully');
      } else {
        await userService.createRole(formData);
        showSuccess('Role created successfully');
      }
      handleClose();
      loadRoles();
    } catch (error) {
      showError(error.message);
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

  const renderPermissionsSection = (module, actions) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{module.toUpperCase()}</Typography>
      <Grid container spacing={2}>
        {actions.map(action => (
          <Grid item xs={3} key={`${module}-${action}`}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData.permissions[`${module}.${action}`]}
                  onChange={() => handlePermissionChange(module, action)}
                />
              }
              label={action.charAt(0).toUpperCase() + action.slice(1)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Role Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
        >
          Add New Role
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
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
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpen(role)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              name="name"
              label="Role Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              name="description"
              label="Description"
              fullWidth
              margin="normal"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
            />
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Permissions</Typography>
            {Object.entries(permissions).map(([module, actions]) => (
              renderPermissionsSection(module, actions)
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default RoleManagement;
