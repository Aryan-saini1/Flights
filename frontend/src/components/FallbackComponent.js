import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(4, 0),
  borderRadius: 16,
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  textAlign: 'center',
}));

const FallbackComponent = ({ error, resetErrorBoundary }) => {
  return (
    <Container maxWidth="md">
      <StyledPaper>
        <Typography variant="h4" gutterBottom color="primary">
          Something went wrong
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          We're experiencing some technical difficulties. Please try refreshing the page.
        </Typography>
        {error && (
          <Box sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="error" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error.message || 'Unknown error'}
            </Typography>
          </Box>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={resetErrorBoundary || (() => window.location.reload())}
          sx={{ mt: 2 }}
        >
          Refresh Page
        </Button>
      </StyledPaper>
    </Container>
  );
};

export default FallbackComponent;
