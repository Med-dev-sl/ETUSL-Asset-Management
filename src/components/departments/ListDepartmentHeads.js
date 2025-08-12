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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ListDepartmentHeads = () => {
  const [departments, setDepartments] = useState([]);
  const [editDept, setEditDept] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'locations'));
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(loaded);
    } catch (error) {
      setNotification({ open: true, message: 'Error loading departments: ' + error.message, severity: 'error' });
    }
  };

  const handleEditClick = (dept) => {
    setEditDept(dept);
    setDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, 'locations', editDept.id), {
        departmentHead: editDept.departmentHead,
        dean: editDept.dean
      });
      setDialogOpen(false);
      setNotification({ open: true, message: 'Updated successfully!', severity: 'success' });
      loadDepartments();
    } catch (error) {
      setNotification({ open: true, message: 'Error updating: ' + error.message, severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Departments, Heads & Deans</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell>Head</TableCell>
              <TableCell>Dean</TableCell>
              <TableCell>Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.name}</TableCell>
                <TableCell>{dept.departmentHead || '-'}</TableCell>
                <TableCell>{dept.dean || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(dept)}><EditIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Department Head & Dean</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Department Head"
            value={editDept?.departmentHead || ''}
            onChange={e => setEditDept(prev => ({ ...prev, departmentHead: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Dean"
            value={editDept?.dean || ''}
            onChange={e => setEditDept(prev => ({ ...prev, dean: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
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

export default ListDepartmentHeads;
