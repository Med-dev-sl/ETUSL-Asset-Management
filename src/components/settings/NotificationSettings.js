import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: {
      enabled: false,
      newAsset: true,
      assetAssignment: true,
      assetReturn: true,
      lowStock: true,
      maintenanceReminder: true
    },
    smsNotifications: {
      enabled: false,
      urgentAlerts: true,
      phoneNumber: ''
    },
    emailTemplates: {
      assetAssignment: '',
      assetReturn: '',
      lowStockAlert: '',
      maintenanceReminder: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [templateDialog, setTemplateDialog] = useState({
    open: false,
    type: null,
    content: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'notifications'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      setError('Failed to load notification settings');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchChange = (section, field) => (event) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: event.target.checked
      }
    }));
  };

  const handlePhoneNumberChange = (event) => {
    setSettings(prev => ({
      ...prev,
      smsNotifications: {
        ...prev.smsNotifications,
        phoneNumber: event.target.value
      }
    }));
  };

  const handleTemplateEdit = (type) => {
    setTemplateDialog({
      open: true,
      type,
      content: settings.emailTemplates[type] || ''
    });
  };

  const handleTemplateDialogSave = () => {
    setSettings(prev => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [templateDialog.type]: templateDialog.content
      }
    }));
    setTemplateDialog({ open: false, type: null, content: '' });
  };

  const validateSettings = () => {
    if (settings.smsNotifications.enabled && !settings.smsNotifications.phoneNumber) {
      throw new Error('Phone number is required for SMS notifications');
    }
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

      // Update settings
      await setDoc(doc(db, 'settings', 'notifications'), {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: {
          id: user.id,
          email: user.email
        }
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'update',
        resource: 'notificationSettings',
        timestamp: serverTimestamp(),
        userId: user.id,
        userEmail: user.email,
        details: 'Updated notification settings'
      });

      setError('Settings saved successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setError(error.message || 'Failed to save settings');
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
          Notification Settings
        </Typography>

        <Grid container spacing={3}>
          {/* Email Notifications Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Email Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications.enabled}
                  onChange={handleSwitchChange('emailNotifications', 'enabled')}
                />
              }
              label="Enable Email Notifications"
            />
            <List>
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications.newAsset}
                      onChange={handleSwitchChange('emailNotifications', 'newAsset')}
                      disabled={!settings.emailNotifications.enabled}
                    />
                  }
                  label="New Asset Added"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications.assetAssignment}
                      onChange={handleSwitchChange('emailNotifications', 'assetAssignment')}
                      disabled={!settings.emailNotifications.enabled}
                    />
                  }
                  label="Asset Assignment"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications.assetReturn}
                      onChange={handleSwitchChange('emailNotifications', 'assetReturn')}
                      disabled={!settings.emailNotifications.enabled}
                    />
                  }
                  label="Asset Return"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications.lowStock}
                      onChange={handleSwitchChange('emailNotifications', 'lowStock')}
                      disabled={!settings.emailNotifications.enabled}
                    />
                  }
                  label="Low Stock Alert"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications.maintenanceReminder}
                      onChange={handleSwitchChange('emailNotifications', 'maintenanceReminder')}
                      disabled={!settings.emailNotifications.enabled}
                    />
                  }
                  label="Maintenance Reminder"
                />
              </ListItem>
            </List>
          </Grid>

          {/* SMS Notifications Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              SMS Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.smsNotifications.enabled}
                  onChange={handleSwitchChange('smsNotifications', 'enabled')}
                />
              }
              label="Enable SMS Notifications"
            />
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={settings.smsNotifications.phoneNumber}
                onChange={handlePhoneNumberChange}
                disabled={!settings.smsNotifications.enabled}
                placeholder="+1234567890"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsNotifications.urgentAlerts}
                    onChange={handleSwitchChange('smsNotifications', 'urgentAlerts')}
                    disabled={!settings.smsNotifications.enabled}
                  />
                }
                label="Urgent Alerts Only"
              />
            </Box>
          </Grid>

          {/* Email Templates Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Email Templates
            </Typography>
            <List>
              <ListItem
                button
                onClick={() => handleTemplateEdit('assetAssignment')}
                disabled={!settings.emailNotifications.enabled}
              >
                <ListItemText
                  primary="Asset Assignment Template"
                  secondary="Template for asset assignment notifications"
                />
              </ListItem>
              <ListItem
                button
                onClick={() => handleTemplateEdit('assetReturn')}
                disabled={!settings.emailNotifications.enabled}
              >
                <ListItemText
                  primary="Asset Return Template"
                  secondary="Template for asset return notifications"
                />
              </ListItem>
              <ListItem
                button
                onClick={() => handleTemplateEdit('lowStockAlert')}
                disabled={!settings.emailNotifications.enabled}
              >
                <ListItemText
                  primary="Low Stock Alert Template"
                  secondary="Template for low stock notifications"
                />
              </ListItem>
              <ListItem
                button
                onClick={() => handleTemplateEdit('maintenanceReminder')}
                disabled={!settings.emailNotifications.enabled}
              >
                <ListItemText
                  primary="Maintenance Reminder Template"
                  secondary="Template for maintenance reminder notifications"
                />
              </ListItem>
            </List>
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

      {/* Template Edit Dialog */}
      <Dialog
        open={templateDialog.open}
        onClose={() => setTemplateDialog({ open: false, type: null, content: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit {templateDialog.type?.replace(/([A-Z])/g, ' $1').trim()} Template
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={templateDialog.content}
            onChange={(e) => setTemplateDialog(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter email template content..."
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Available variables: {'{userName}'}, {'{assetName}'}, {'{date}'}, {'{location}'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog({ open: false, type: null, content: '' })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleTemplateDialogSave}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error/Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={error.includes('success') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettings;
