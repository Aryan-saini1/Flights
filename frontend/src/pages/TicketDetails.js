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
          // Don't set error - just let ticket remain null to show the centered message
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
          // Convert amount to number (backend returns it as string)
          paymentAmount = parseFloat(paymentRes.data.payment.amount) || 0;
        }
        
        // Backend returns nested structure with flight object
        const flightInfo = ticketData.flight || {};
        const passengerInfo = ticketData.passenger || {};
        const sourceInfo = flightInfo.source || {};
        const destInfo = flightInfo.destination || {};
        
        // Determine the price - use payment amount first, then flight price from backend
        const flightPrice = typeof flightInfo.price === 'string' ? parseFloat(flightInfo.price) : (flightInfo.price || 0);
        const ticketPrice = paymentAmount > 0 ? paymentAmount : flightPrice;
        console.log('Ticket price determined:', ticketPrice, 'from payment:', paymentAmount, 'or flight:', flightPrice);
        
        // Build enriched ticket with actual backend data
        const enrichedTicket = {
          booking_id: bookingId,
          ticket_id: ticketData.ticket_id,
          seat_number: ticketData.seat_number,
          passenger_name: passengerInfo.name,
          age: passengerInfo.age,
          gender: passengerInfo.gender,
          
          // Flight information from backend
          flight_id: flightInfo.flight_id,
          airline: flightInfo.airline,
          flight_number: flightInfo.flight_number,
          departure_time: flightInfo.departure_time,
          arrival_time: flightInfo.arrival_time,
          price: ticketPrice,
          
          // Route information from backend
          source_code: sourceInfo.code,
          source_city: sourceInfo.city,
          destination_code: destInfo.code,
          destination_city: destInfo.city,
          
          // Additional details
          class: ticketData.class || 'Economy',
          gate: ticketData.gate || 'C11',
          booking_status: ticketData.booking_status,
          
          // QR and Barcode
          qr_code: ticketData.qr_code,
          barcode: ticketData.barcode,
          barcode_number: ticketData.barcode_number
        };
        
        console.log('✅ Setting ticket data:', enrichedTicket);
        setTicket(enrichedTicket);
        
        // Set flight data if available
        if (flightInfo.flight_id) {
          setFlight({
            flight_id: flightInfo.flight_id,
            airline: flightInfo.airline,
            flight_number: flightInfo.flight_number,
            departure_time: flightInfo.departure_time,
            arrival_time: flightInfo.arrival_time,
            price: flightInfo.price,
            source_airport_id: sourceInfo.airport_id,
            destination_airport_id: destInfo.airport_id
          });
        }
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
