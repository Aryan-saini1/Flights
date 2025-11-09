import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings } from '../api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Flight,
  EventNote,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Visibility,
} from '@mui/icons-material';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await getUserBookings(token);
        setBookings(response.data.bookings || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token, navigate]);

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'PENDING':
        return <HourglassEmpty sx={{ color: '#ff9800' }} />;
      case 'CANCELLED':
        return <Cancel sx={{ color: '#f44336' }} />;
      default:
        return <EventNote />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your bookings...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={6}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          <Flight sx={{ mr: 2, fontSize: 40, verticalAlign: 'middle' }} />
          My Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          View and manage all your flight bookings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {bookings.length === 0 ? (
          <Card sx={{ mt: 4, p: 4, textAlign: 'center' }}>
            <Flight sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No bookings found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Book your first flight to see it here
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
              Search Flights
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3} mt={1}>
            {bookings.map((booking) => (
              <Grid item xs={12} key={booking.booking_id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 25px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(booking.status)}
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Booking ID
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                              #{booking.booking_id}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Box mt={0.5}>
                          <Chip
                            label={booking.status}
                            color={getStatusColor(booking.status)}
                            size="small"
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Booked On
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(booking.created_at)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={3}>
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/ticket/${booking.booking_id}`)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>

                    {booking.ticket_count > 0 && (
                      <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                        <Typography variant="caption" color="text.secondary">
                          Tickets: {booking.ticket_count}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default MyBookings;
