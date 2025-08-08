import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const Profile = () => {
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    avatar: null,
    bio: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('No user found');
      }

      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          displayName: userData.displayName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          department: userData.department || '',
          position: userData.position || '',
          avatar: userData.avatar || null,
          bio: userData.bio || ''
        });
        if (userData.avatar) {
          setAvatarPreview(userData.avatar);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'Failed to load profile');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setProfile(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match');
      setSnackbarOpen(true);
      return;
    }

    // Here you would implement password change logic
    // This would typically involve Firebase Authentication
    console.log('Password change functionality to be implemented');
    
    setPasswordDialog(false);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const validateProfile = () => {
    if (!profile.displayName) throw new Error('Display name is required');
    if (!profile.email) throw new Error('Email is required');
    if (!profile.department) throw new Error('Department is required');
    if (!profile.position) throw new Error('Position is required');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      validateProfile();

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        throw new Error('No user found');
      }

      // Update profile
      await updateDoc(doc(db, 'users', user.id), {
        ...profile,
        updatedAt: serverTimestamp()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        action: 'update',
        resource: 'profile',
        userId: user.id,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        details: 'Updated user profile'
      });

      setSuccessMessage('Profile updated successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
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
          Profile Settings
        </Typography>

        <Grid container spacing={3}>
          {/* Avatar Section */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarPreview}
                sx={{ width: 120, height: 120 }}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  <CloudUploadIcon />
                </IconButton>
              </label>
            </Box>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Display Name"
              name="displayName"
              value={profile.displayName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              type="email"
              disabled
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Department"
              name="department"
              value={profile.department}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Position"
              name="position"
              value={profile.position}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setPasswordDialog(true)}
            >
              Change Password
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwords.current}
              onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwords.new}
              onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={successMessage ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {successMessage || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
