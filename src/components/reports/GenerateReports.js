import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const reportTypes = [
  { value: 'usage', label: 'Usage Report' },
  { value: 'maintenance', label: 'Maintenance Report' },
  { value: 'assets', label: 'Asset Status Report' },
  { value: 'inventory', label: 'Inventory Report' }
];

const GenerateReports = () => {
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [format, setFormat] = useState('excel');

  const validateForm = () => {
    if (!reportType) throw new Error('Please select a report type');
    if (!startDate || !endDate) throw new Error('Please select date range');
    if (endDate < startDate) throw new Error('End date must be after start date');
  };

  const fetchReportData = async () => {
    let collectionName;
    switch (reportType) {
      case 'usage':
        collectionName = 'assetHistory';
        break;
      case 'maintenance':
        collectionName = 'maintenance';
        break;
      case 'assets':
        collectionName = 'assets';
        break;
      case 'inventory':
        collectionName = 'inventory';
        break;
      default:
        throw new Error('Invalid report type');
    }

    const q = query(
      collection(db, collectionName),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toLocaleString() || 'N/A'
    }));
  };

  const generateExcel = (data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report_${new Date().toISOString()}.xlsx`);
  };

  const generatePDF = (data) => {
    const doc = new jsPDF();
    const title = `${reportType.toUpperCase()} REPORT`;
    const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(dateRange, 14, 25);

    // Prepare table data
    const tableColumn = Object.keys(data[0]).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1)
    );
    const tableRows = data.map(item =>
      Object.keys(item).map(key => item[key])
    );

    // Add table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 30 }
    });

    doc.save(`${reportType}_report_${new Date().toISOString()}.pdf`);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Validate form
      validateForm();

      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to generate reports');
      }

      // Fetch data
      const data = await fetchReportData();

      // Generate report in selected format
      if (format === 'excel') {
        generateExcel(data);
      } else {
        await generatePDF(data);
      }

      setSuccessOpen(true);
    } catch (error) {
      console.error('Error generating report:', error);
      setErrorMessage(error.message || 'Failed to generate report');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Generate Reports
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map((type) => (
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

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Success Dialog */}
        <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
          <DialogTitle>Success</DialogTitle>
          <DialogContent>
            <Typography>
              Report has been generated successfully.
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
    </LocalizationProvider>
  );
};

export default GenerateReports;
