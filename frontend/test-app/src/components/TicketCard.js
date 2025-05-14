import React from 'react';
import { Box, Typography, Paper, Grid, Divider, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FlightTakeoff, FlightLand, Person, EventSeat, Wc, CalendarMonth } from '@mui/icons-material';

const TicketContainer = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  maxWidth: 450,
  margin: '0 auto',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
}));

const TicketHeader = styled(Box)(({ theme }) => ({
  background: '#1976d2',
  color: 'white',
  padding: theme.spacing(2),
  position: 'relative',
}));

const TicketBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: 'white',
}));

const TicketFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  borderTop: '1px dashed #ccc',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const TicketDetail = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1.5),
}));

const Barcode = styled(Box)(({ theme }) => ({
  height: 50,
  marginTop: theme.spacing(2),
  backgroundImage: 'url("data:image/png;base64,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");',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
}));

const TicketCard = ({ ticket, onCancel }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle missing data with fallbacks
  const safeTicket = {
    airline: ticket.airline || 'SkyWay Airlines',
    flight_number: ticket.flight_number || 'SK123',
    price: ticket.price || 0,
    source_code: ticket.source_code || 'DEL',
    source_city: ticket.source_city || 'Delhi',
    destination_code: ticket.destination_code || 'BOM',
    destination_city: ticket.destination_city || 'Mumbai',
    departure_time: ticket.departure_time || new Date().toISOString(),
    arrival_time: ticket.arrival_time || new Date(Date.now() + 7200000).toISOString(),
    class: ticket.class || 'Economy',
    gate: ticket.gate || 'C11',
    seat_number: ticket.seat_number || '1A',
    passenger_name: ticket.passenger_name || 'Passenger',
    age: ticket.age || '30',
    gender: ticket.gender || 'O',
    booking_id: ticket.booking_id || '0'
  };
  
  return (
    <TicketContainer>
      <TicketHeader>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Ticket Confirmed</Typography>
      </TicketHeader>
      
      <TicketBody>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">{safeTicket.airline}</Typography>
            <Typography variant="body2" color="text.secondary">{safeTicket.flight_number}</Typography>
          </Box>
          <Typography variant="h6" color="primary" fontWeight="bold">
            ₹{typeof safeTicket.price === 'number' ? safeTicket.price.toFixed(2) : '0.00'}
          </Typography>
        </Box>
        
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
          p: 2, 
          borderRadius: 2, 
          color: 'white',
          mb: 3
        }}>
          <Grid container>
            <Grid item xs={5}>
              <Typography variant="h6" fontWeight="bold">{safeTicket.source_code}</Typography>
              <Typography variant="body2">{safeTicket.source_city}</Typography>
            </Grid>
            <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{ width: '100%', height: '2px', bgcolor: 'rgba(255, 255, 255, 0.5)' }}></Box>
            </Grid>
            <Grid item xs={5} sx={{ textAlign: 'right' }}>
              <Typography variant="h6" fontWeight="bold">{safeTicket.destination_code}</Typography>
              <Typography variant="body2">{safeTicket.destination_city}</Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Departure</Typography>
            <Typography variant="body1" fontWeight="bold">
              {formatDate(safeTicket.departure_time)}, {formatTime(safeTicket.departure_time)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Arrival</Typography>
            <Typography variant="body1" fontWeight="bold">
              {formatDate(safeTicket.arrival_time)}, {formatTime(safeTicket.arrival_time)}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Class</Typography>
            <Typography variant="body1" fontWeight="bold">{safeTicket.class}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Gate</Typography>
            <Typography variant="body1" fontWeight="bold">{safeTicket.gate}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Seat</Typography>
            <Typography variant="body1" fontWeight="bold">{safeTicket.seat_number}</Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Passenger</Typography>
            <Typography variant="body1" fontWeight="bold">{safeTicket.passenger_name}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Age</Typography>
            <Typography variant="body1" fontWeight="bold">{safeTicket.age}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">Gender</Typography>
            <Typography variant="body1" fontWeight="bold">
              {safeTicket.gender === 'M' ? 'Male' : safeTicket.gender === 'F' ? 'Female' : 'Other'}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Booking Reference: {safeTicket.booking_id}</Typography>
        </Box>
        
        <Barcode />
      </TicketBody>
      
      <TicketFooter>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => window.print()}
        >
          Download Ticket
        </Button>
        
        {onCancel && (
          <Button 
            variant="contained" 
            color="error"
            onClick={() => onCancel(safeTicket.booking_id)}
            disabled={!onCancel}
          >
            Cancel Ticket
          </Button>
        )}
      </TicketFooter>
    </TicketContainer>
  );
};

export default TicketCard;
