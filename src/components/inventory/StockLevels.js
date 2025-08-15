import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert, Snackbar, TextField, Button, MenuItem } from '@mui/material';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const StockLevels = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setErrorMessage('User not authenticated');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'inventory'),
        orderBy('name')
      );

      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          let items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString() || 'N/A'
          }));
          // Wide search filter
          if (search) {
            const s = search.toLowerCase();
            items = items.filter(item =>
              (item.itemId && item.itemId.toLowerCase().includes(s)) ||
              (item.name && item.name.toLowerCase().includes(s)) ||
              (item.category && item.category.toLowerCase().includes(s)) ||
              (item.unit && item.unit.toLowerCase().includes(s)) ||
              (item.location && item.location.toLowerCase().includes(s))
            );
          }
          // Sort
          items = items.sort((a, b) => {
            let av = a[sortBy], bv = b[sortBy];
            if (sortBy === 'createdAt') {
              av = a.createdAt || '';
              bv = b.createdAt || '';
            }
            if (av === undefined) return 1;
            if (bv === undefined) return -1;
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });
          setInventory(items);
          setLoading(false);
        },
        error: (error) => {
          console.error("Error fetching inventory:", error);
          setErrorMessage('Failed to load inventory items');
          setSnackbarOpen(true);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up listener:", error);
      setErrorMessage('Error setting up inventory listener');
      setSnackbarOpen(true);
      setLoading(false);
    }
  }, [search, sortBy, sortDir]);

  const getStockStatus = (item) => {
    if (item.quantity <= 0) {
      return { label: 'Out of Stock', color: 'error' };
    } else if (item.quantity <= item.minStockLevel) {
      return { label: 'Low Stock', color: 'warning' };
    } else {
      return { label: 'In Stock', color: 'success' };
    }
  };


  // Export to CSV
  const exportToCSV = () => {
    if (!inventory.length) return;
    const headers = ['Item ID', 'Item Name', 'Category', 'Current Stock', 'Min. Level', 'Unit', 'Status', 'Location'];
    const rows = inventory.map(item => [
      item.itemId || '-',
      item.name,
      item.category,
      item.quantity,
      item.minStockLevel,
      item.unit,
      getStockStatus(item).label,
      item.location || 'N/A'
    ]);
    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(x => '"' + (x ? String(x).replace(/"/g, '""') : '') + '"').join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, 'stock_levels.csv');
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'stock_levels.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!inventory.length) return;
    const ws = XLSX.utils.json_to_sheet(inventory.map(item => ({
      'Item ID': item.itemId || '-',
      'Item Name': item.name,
      'Category': item.category,
      'Current Stock': item.quantity,
      'Min. Level': item.minStockLevel,
      'Unit': item.unit,
      'Status': getStockStatus(item).label,
      'Location': item.location || 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Levels');
    XLSX.writeFile(wb, 'stock_levels.xlsx');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Stock Levels
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField
            label="Wide Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="name">Item Name</MenuItem>
            <MenuItem value="category">Category</MenuItem>
            <MenuItem value="quantity">Current Stock</MenuItem>
            <MenuItem value="minStockLevel">Min. Level</MenuItem>
            <MenuItem value="unit">Unit</MenuItem>
            <MenuItem value="location">Location</MenuItem>
            <MenuItem value="createdAt">Date</MenuItem>
          </TextField>
          <TextField
            select
            label="Sort Direction"
            value={sortDir}
            onChange={e => setSortDir(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={exportToCSV}>Export CSV</Button>
          <Button variant="outlined" onClick={exportToExcel}>Export Excel</Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Min. Level</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.itemId || '-'}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.minStockLevel}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Chip 
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.location || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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

export default StockLevels;
