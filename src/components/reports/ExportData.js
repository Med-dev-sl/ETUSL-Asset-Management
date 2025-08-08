import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const dataTypes = [
  { value: 'assets', label: 'Assets' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'maintenance', label: 'Maintenance Records' },
  { value: 'departments', label: 'Departments' },
  { value: 'users', label: 'Users' }
];

const ExportData = () => {
  const [dataType, setDataType] = useState('');
  const [format, setFormat] = useState('excel');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});
  const [availableFields, setAvailableFields] = useState([]);

  const getAvailableFields = (type) => {
    switch (type) {
      case 'assets':
        return [
          'name', 'assetTag', 'category', 'status', 'location',
          'purchaseDate', 'purchasePrice', 'supplier', 'warranty'
        ];
      case 'inventory':
        return [
          'name', 'category', 'quantity', 'minStockLevel', 'unit',
          'location', 'supplier', 'status'
        ];
      case 'maintenance':
        return [
          'assetId', 'type', 'status', 'scheduledDate', 'completedDate',
          'technician', 'cost', 'notes'
        ];
      case 'departments':
        return [
          'name', 'manager', 'location', 'budget', 'assetCount'
        ];
      case 'users':
        return [
          'name', 'email', 'role', 'department', 'lastLogin'
        ];
      default:
        return [];
    }
  };

  const handleDataTypeChange = (e) => {
    const type = e.target.value;
    setDataType(type);
    const fields = getAvailableFields(type);
    setAvailableFields(fields);
    const initialSelectedFields = fields.reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {});
    setSelectedFields(initialSelectedFields);
  };

  const toggleField = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to export data');
      }

      const q = query(
        collection(db, dataType),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        // Filter fields based on selection
        return Object.keys(selectedFields)
          .reduce((acc, field) => {
            if (selectedFields[field]) {
              acc[field] = docData[field]?.toString() || '';
            }
            return acc;
          }, { id: doc.id });
      });

      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  const generateExcel = (data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${dataType}_export_${new Date().toISOString()}.xlsx`);
  };

  const generatePDF = (data) => {
    const doc = new jsPDF();
    const tableColumn = Object.keys(selectedFields)
      .filter(key => selectedFields[key])
      .map(key => key.charAt(0).toUpperCase() + key.slice(1));
    const tableRows = data.map(item =>
      Object.keys(selectedFields)
        .filter(key => selectedFields[key])
        .map(key => item[key])
    );

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 }
    });

    doc.text(`${dataType.toUpperCase()} EXPORT`, 14, 15);
    doc.save(`${dataType}_export_${new Date().toISOString()}.pdf`);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to export data');
      }

      const data = await fetchData();

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'export',
        dataType,
        format,
        timestamp: serverTimestamp(),
        userId: user.id,
        userName: user.displayName || user.email,
        userEmail: user.email,
        description: `Exported ${dataType} data in ${format} format`
      });

      if (format === 'excel') {
        generateExcel(data);
      } else {
        generatePDF(data);
      }

      setSuccessOpen(true);
    } catch (error) {
      console.error('Error exporting data:', error);
      setErrorMessage(error.message || 'Failed to export data');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Export Data
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={dataType}
                label="Data Type"
                onChange={handleDataTypeChange}
              >
                {dataTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e) => setFormat(e.target.value)}
              >
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {dataType && (
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select Fields to Export
              </Typography>
              <FormGroup>
                <Grid container spacing={2}>
                  {availableFields.map((field) => (
                    <Grid item xs={12} sm={6} md={4} key={field}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedFields[field] || false}
                            onChange={() => toggleField(field)}
                          />
                        }
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={loading || !dataType || Object.values(selectedFields).every(v => !v)}
            >
              {loading ? <CircularProgress size={24} /> : 'Export Data'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            Data has been exported successfully.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default ExportData;
