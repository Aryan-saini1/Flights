import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { Flight, Logout, Dashboard, History } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleDashboard = () => {
    handleClose();
    navigate('/');
  };

  const handleMyBookings = () => {
    handleClose();
    navigate('/my-bookings');
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <Flight sx={{ mr: 2, fontSize: 32 }} />
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          SkyWay Flights
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Welcome, {user?.name || 'User'}
            </Typography>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#f5576c',
                  width: 36,
                  height: 36,
                  fontSize: '1rem',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1.5,
                  minWidth: 180,
                },
              }}
            >
              <MenuItem onClick={handleDashboard}>
                <Dashboard sx={{ mr: 1.5 }} />
                Dashboard
              </MenuItem>
              <MenuItem onClick={handleMyBookings}>
                <History sx={{ mr: 1.5 }} />
                My Bookings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1.5 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                fontWeight: 'bold',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/signup')}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
