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
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  TablePagination,
  TextField,
  MenuItem
} from '@mui/material';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const InventoryHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [lastVisible, setLastVisible] = useState(null);

  const itemCategories = [
    'all',
    'Office Supplies',
    'Lab Supplies',
    'IT Consumables',
    'Cleaning Supplies',
    'Medical Supplies',
    'Other'
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setErrorMessage('User not authenticated');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    try {
      // Create base query
      let baseQuery = query(
        collection(db, 'inventoryHistory'),
        orderBy('timestamp', 'desc'),
        limit(rowsPerPage)
      );

      // Add category filter if not 'all'
      if (filterCategory !== 'all') {
        baseQuery = query(
          collection(db, 'inventoryHistory'),
          where('category', '==', filterCategory),
          orderBy('timestamp', 'desc'),
          limit(rowsPerPage)
        );
      }

      const unsubscribe = onSnapshot(baseQuery, {
        next: (snapshot) => {
          const historyData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toLocaleString() || 'N/A'
          }));
          setHistory(historyData);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setLoading(false);

          // Get total count for pagination
          const countQuery = filterCategory === 'all'
            ? collection(db, 'inventoryHistory')
            : query(collection(db, 'inventoryHistory'), where('category', '==', filterCategory));

          getDocs(countQuery).then(snap => {
            setTotalCount(snap.size);
          });
        },
        error: (error) => {
          console.error("Error fetching history:", error);
          setErrorMessage('Failed to load inventory history');
          setSnackbarOpen(true);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      setErrorMessage('Error setting up history listener');
      setSnackbarOpen(true);
      setLoading(false);
    }
  }, [filterCategory, rowsPerPage]);

  const handleChangePage = async (event, newPage) => {
    if (newPage > page && lastVisible) {
      setLoading(true);
      try {
        let nextQuery = query(
          collection(db, 'inventoryHistory'),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(rowsPerPage)
        );

        if (filterCategory !== 'all') {
          nextQuery = query(
            collection(db, 'inventoryHistory'),
            where('category', '==', filterCategory),
            orderBy('timestamp', 'desc'),
            startAfter(lastVisible),
            limit(rowsPerPage)
          );
        }

        const snapshot = await getDocs(nextQuery);
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toLocaleString() || 'N/A'
        }));
        setHistory(historyData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setPage(newPage);
      } catch (error) {
        console.error("Error fetching next page:", error);
        setErrorMessage('Failed to load more history');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'primary';
      case 'deleted':
        return 'error';
      case 'adjusted':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && history.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Inventory History
          </Typography>
          <TextField
            select
            label="Filter by Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            sx={{ width: 200 }}
          >
            {itemCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Changed By</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.itemId || '-'}</TableCell>
                  <TableCell>{record.itemName}</TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.action}
                      color={getActionColor(record.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {record.details}
                    {record.quantityChange && (
                      <Typography variant="body2" color="textSecondary">
                        {`${record.previousQuantity} → ${record.newQuantity} ${record.unit}`}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.updatedBy?.name || 'System'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {record.updatedBy?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.timestamp}</TableCell>
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
  );
};

export default InventoryHistory;
