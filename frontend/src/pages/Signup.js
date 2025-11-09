import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Flight } from '@mui/icons-material';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z\d]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
      };

      const response = await register(signupData);

      if (response.data.message) {
        // Auto-login after successful registration
        const userData = {
          user_id: response.data.user_id,
          name: formData.name,
          email: formData.email,
        };

        // If registration returns a token, use it
        if (response.data.token) {
          login(userData, response.data.token);
          navigate('/');
        } else {
          // Otherwise redirect to login
          navigate('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'error';
    if (passwordStrength < 60) return 'warning';
    return 'success';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Flight sx={{ fontSize: 48, color: '#f5576c', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join us and start exploring the world
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              autoComplete="name"
            />

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Phone Number (Optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              autoComplete="tel"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              autoComplete="new-password"
              InputProps={{
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

            {formData.password && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  color={getPasswordStrengthColor()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Password Strength: {passwordStrength < 30 ? 'Weak' : passwordStrength < 60 ? 'Medium' : 'Strong'}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                fontSize: '1rem',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#f5576c',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
