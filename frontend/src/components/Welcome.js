import React from 'react';
import { Box, Typography, Paper, Container, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FlightTakeoff } from '@mui/icons-material';

const WelcomeCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(4),
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const Welcome = () => {
  return (
    <Container maxWidth="md">
      <WelcomeCard>
        <Logo>
          <FlightTakeoff sx={{ fontSize: 60, color: '#1976d2', mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold" color="primary">
            SkyBooker
          </Typography>
        </Logo>
        
        <Typography variant="h5" gutterBottom>
          Welcome to the Flight Booking Application
        </Typography>
        
        <Typography variant="body1" paragraph color="text.secondary">
          This is a simple welcome page to help diagnose any rendering issues.
          If you can see this message, the basic React rendering is working correctly.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          startIcon={<FlightTakeoff />}
          onClick={() => window.location.reload()}
        >
          Refresh Application
        </Button>
      </WelcomeCard>
    </Container>
  );
};

export default Welcome;
