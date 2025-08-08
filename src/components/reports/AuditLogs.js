import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const actionTypes = [
  'all',
  'create',
  'update',
  'delete',
  'verify',
  'login',
  'export'
];

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisible, setLastVisible] = useState(null);
  const [filterAction, setFilterAction] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [filterAction, startDate, endDate, rowsPerPage]);

  const fetchLogs = async (startAfterDoc = null) => {
    try {
      let baseQuery = collection(db, 'auditLogs');
      let constraints = [orderBy('timestamp', 'desc')];

      if (filterAction !== 'all') {
        constraints.push(where('action', '==', filterAction));
      }

      if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      constraints.push(limit(rowsPerPage));

      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      const q = query(baseQuery, ...constraints);
      const querySnapshot = await getDocs(q);

      const logData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toLocaleString() || 'N/A'
      }));

      setLogs(logData);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

      // Get total count
      const countQuery = filterAction === 'all'
        ? collection(db, 'auditLogs')
        : query(collection(db, 'auditLogs'), where('action', '==', filterAction));

      const countSnapshot = await getDocs(countQuery);
      setTotalCount(countSnapshot.size);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setErrorMessage('Failed to load audit logs');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = async (event, newPage) => {
    if (newPage > page && lastVisible) {
      await fetchLogs(lastVisible);
    }
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'primary';
      case 'delete':
        return 'error';
      case 'verify':
        return 'info';
      case 'login':
        return 'warning';
      case 'export':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs.filter(log =>
    log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Audit Logs
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filterAction}
                  label="Action Type"
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  {actionTypes.map((action) => (
                    <MenuItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        color={getActionColor(log.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.userName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.userEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details, null, 2)
                          : log.details}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>

        {/* Error Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;
