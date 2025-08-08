import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const timeZones = [
  'UTC',
  'UTC+1',
  'UTC+2',
  'UTC+3',
  'UTC+4',
  'UTC+5',
  // Add more as needed
];

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    universityName: '',
    timeZone: '',
    emailDomain: '',
    logo: null,
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'systemSettings', 'general'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
        if (settingsDoc.data().logo) {
          setLogoPreview(settingsDoc.data().logo);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Failed to load system settings');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setSettings(prev => ({
          ...prev,
          logo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateSettings = () => {
    if (!settings.universityName) throw new Error('University name is required');
    if (!settings.timeZone) throw new Error('Time zone is required');
    if (!settings.emailDomain) throw new Error('Email domain is required');
    if (!settings.contactEmail) throw new Error('Contact email is required');
    if (!settings.contactPhone) throw new Error('Contact phone is required');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate settings
      validateSettings();

      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('You must be logged in to update settings');
      }

      // Check if user is admin
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        throw new Error('Only administrators can update system settings');
      }

      // Update settings
      await setDoc(doc(db, 'systemSettings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: {
          id: user.id,
          name: userDoc.data().displayName || user.email,
          email: user.email
        }
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'update',
        resource: 'systemSettings',
        timestamp: serverTimestamp(),
        userId: user.id,
        userName: userDoc.data().displayName || user.email,
        userEmail: user.email,
        details: 'Updated system settings'
      });

      setSuccessOpen(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage(error.message || 'Failed to save settings');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
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
          System Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="University Name"
              name="universityName"
              value={settings.universityName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Time Zone</InputLabel>
              <Select
                name="timeZone"
                value={settings.timeZone}
                label="Time Zone"
                onChange={handleChange}
              >
                {timeZones.map((zone) => (
                  <MenuItem key={zone} value={zone}>
                    {zone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Email Domain"
              name="emailDomain"
              value={settings.emailDomain}
              onChange={handleChange}
              placeholder="e.g., university.edu"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Contact Email"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleChange}
              type="email"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Contact Phone"
              name="contactPhone"
              value={settings.contactPhone}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={settings.address}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="logo-upload"
              type="file"
              onChange={handleLogoChange}
            />
            <label htmlFor="logo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
              >
                Upload Logo
              </Button>
            </label>
            {logoPreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={logoPreview}
                  alt="University Logo"
                  style={{ maxWidth: '200px', maxHeight: '100px' }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ mt: 2 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>
            System settings have been updated successfully.
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

export default SystemSettings;
