import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import createAdminUser from '../utils/createAdmin';
import { useNavigate } from 'react-router-dom';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    setLoading(true);

    try {
      // First check if it's the first login (no admin exists)
      const adminSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      if (adminSnapshot.empty) {
        // Create admin user if it doesn't exist
        await createAdminUser(formData.email, formData.password);
      }

      // Now try to login
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', formData.email));
      const userQuerySnapshot = await getDocs(userQuery);

      if (userQuerySnapshot.empty) {
        setError('User not found');
        setShowError(true);
        return;
      }

      // Get the first matching user
      const userSnapshot = userQuerySnapshot.docs[0];
      const userData = userSnapshot.data();

      if (userData.password !== formData.password) {
        setError('Invalid password');
        setShowError(true);
        return;
      }

      // Store user data in localStorage
      const userToStore = {
        id: userSnapshot.id,
        email: userData.email,
        role: userData.role || 'user',
        name: userData.name,
        department: userData.department,
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      console.log('Successfully logged in');

      // Navigate to dashboard
      navigate('/admin/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.message === 'User not found' ? 'User not found' :
        error.message === 'Invalid password' ? 'Invalid password' :
        'Failed to log in'
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
        background: `url('/etusl.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 51, 102, 0.85)', // This adds a semi-transparent overlay
          zIndex: 0
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 51, 102, 0.2)',
            border: '2px solid #003366'
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}
          >
            ETUSL Asset Management
          </Typography>
          <Typography
            variant="h5"
            sx={{ mb: 4, color: 'primary.main', opacity: 0.9 }}
          >
            Login
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={async () => {
                  try {
                    await createAdminUser();
                    alert('Admin user created successfully!');
                  } catch (error) {
                    alert('Error creating admin user: ' + error.message);
                  }
                }}
                sx={{
                  mt: 1,
                  color: 'primary.main',
                  fontSize: '0.8rem'
                }}
              >
                Initialize Admin
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginScreen;
