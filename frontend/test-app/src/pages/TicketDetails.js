import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Alert, Snackbar, Button, CircularProgress } from '@mui/material';
import { getTicketsForBooking, getPaymentForBooking, cancelBooking, getFlight, getAirports } from '../api';
import TicketCard from '../components/TicketCard';
import LoadingScreen from '../components/LoadingScreen';
import { ArrowBack } from '@mui/icons-material';

export default function TicketDetails() {
  const { bookingId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [payment, setPayment] = useState(null);
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!bookingId) {
        setError('Invalid booking ID');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching ticket details for booking:', bookingId);
        
        // Get ticket details
        const ticketRes = await getTicketsForBooking(bookingId);
        console.log('Ticket response:', ticketRes.data);
        
        if (!ticketRes.data.tickets || ticketRes.data.tickets.length === 0) {
          setError('No tickets found for this booking');
          setLoading(false);
          return;
        }
        
        const ticketData = ticketRes.data.tickets[0];
        console.log('Ticket data:', ticketData);
        
        // Get payment details
        const paymentRes = await getPaymentForBooking(bookingId);
        console.log('Payment response:', paymentRes.data);
        
        let paymentAmount = 0;
        if (paymentRes.data.payment) {
          setPayment(paymentRes.data.payment);
          paymentAmount = paymentRes.data.payment.amount;
        }
        
        // Get flight details
        if (ticketData.flight_id) {
          try {
            const flightRes = await getFlight(ticketData.flight_id);
            if (flightRes.data && flightRes.data.flight) {
              setFlight(flightRes.data.flight);
            }
          } catch (flightErr) {
            console.error('Error fetching flight details:', flightErr);
          }
        }
        
        // Get airports data for source and destination
        let sourceCode = 'DEL';
        let sourceName = 'Delhi';
        let destCode = 'BOM';
        let destName = 'Mumbai';
        
        try {
          const airportsRes = await getAirports();
          if (flight && airportsRes.data && airportsRes.data.airports) {
            const airports = airportsRes.data.airports;
            const source = airports.find(a => a.airport_id === flight.source_airport_id);
            const dest = airports.find(a => a.airport_id === flight.destination_airport_id);
            
            if (source) {
              sourceCode = source.code;
              sourceName = source.city;
            }
            
            if (dest) {
              destCode = dest.code;
              destName = dest.city;
            }
          }
        } catch (airportErr) {
          console.error('Error fetching airport details:', airportErr);
        }
        
        // Get flight details to enrich ticket data
        const enrichedTicket = {
          ...ticketData,
          booking_id: bookingId,
          price: paymentAmount,
          airline: flight?.airline || ticketData.airline || 'SkyWay Airlines',
          flight_number: flight?.flight_number || ticketData.flight_number || 'SK123',
          departure_time: flight?.departure_time || ticketData.departure_time || new Date().toISOString(),
          arrival_time: flight?.arrival_time || ticketData.arrival_time || new Date(Date.now() + 7200000).toISOString(),
          source_code: ticketData.source_code || sourceCode,
          source_city: ticketData.source_city || sourceName,
          destination_code: ticketData.destination_code || destCode,
          destination_city: ticketData.destination_city || destName,
          class: ticketData.class || 'Economy',
          gate: ticketData.gate || 'C11'
        };
        
        console.log('\u2705 Setting ticket data:', enrichedTicket);
        setTicket(enrichedTicket);
      } catch (err) {
        console.error('\u274c Error loading ticket details:', err);
        setError('Failed to load ticket details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchTicketDetails();
    }
  }, [bookingId]);

  const handleCancelTicket = async (bookingId) => {
    // Check for token
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setError('You must be logged in to cancel a ticket');
      return;
    }
    
    try {
      setCancelLoading(true);
      console.log('Cancelling ticket for booking:', bookingId);
      
      await cancelBooking(bookingId, currentToken);
      console.log('\u2705 Ticket cancelled successfully');
      
      setSuccess('Ticket cancelled successfully');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('\u274c Error cancelling ticket:', err);
      let errorMessage = 'Failed to cancel ticket. Please try again.';
      
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your ticket..." />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Button
          startIcon={<ArrowBack />}
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
        
        <Typography variant="h5" fontWeight="bold" color="primary">
          Booking #{bookingId}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {ticket ? (
        <Box>
          <TicketCard 
            ticket={ticket} 
            onCancel={cancelLoading ? null : handleCancelTicket} 
          />
          
          {cancelLoading && (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress size={24} />
              <Typography variant="body1" ml={2}>Processing cancellation...</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box textAlign="center" p={5} bgcolor="#f5f5f5" borderRadius={2}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No ticket found
          </Typography>
          <Typography variant="body1" paragraph>
            We couldn't find any ticket associated with this booking ID.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </Box>
      )}
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Container>
  );
}
