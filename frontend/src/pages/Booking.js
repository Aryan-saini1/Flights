import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFlight, createBooking, addTicket } from '../api';
import { 
  Button, Typography, Container, Box, TextField, Paper, Grid, 
  FormControl, InputLabel, MenuItem, Select, Divider, Alert,
  Card, CardContent, Stepper, Step, StepLabel, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  FlightTakeoff, FlightLand, Person, EventSeat, Wc, CalendarMonth,
  AirplanemodeActive, AccessTime, ArrowRightAlt, AttachMoney, ArrowBack
} from '@mui/icons-material';
import LoadingScreen from '../components/LoadingScreen';

const BookingCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  marginBottom: theme.spacing(4),
}));

const FlightInfoCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
}));

const FlightHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  color: 'white',
  padding: theme.spacing(2),
}));

export default function Booking() {
  const { flightId } = useParams();
  const [flight, setFlight] = useState(null);
  const [sourceAirport, setSourceAirport] = useState(null);
  const [destAirport, setDestAirport] = useState(null);
  const [passengerName, setPassengerName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('M');
  const [seatNumber, setSeatNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(localStorage.getItem('user')) : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching flight details for ID:', flightId);
        const flightRes = await getFlight(flightId);
        console.log('Flight response:', flightRes.data);
        
        if (!flightRes.data.flight) {
          setError('Flight not found');
          setLoading(false);
          return;
        }
        setFlight(flightRes.data.flight);

        // Extract airport details from flight data (already nested in the response)
        if (flightRes.data.flight) {
          const source = flightRes.data.flight.source_airport;
          const dest = flightRes.data.flight.destination_airport;
          console.log('Source airport:', source);
          console.log('Destination airport:', dest);

          if (!source || !dest) {
            setError('Airport information not found');
            setLoading(false);
            return;
          }
          setSourceAirport(source);
          setDestAirport(dest);
        }
        
        // Set default passenger name if user is logged in
        if (user) {
          setPassengerName(user.name);
        }
        
        // Generate a random seat number
        const randomSeat = generateRandomSeat();
        setSeatNumber(randomSeat);
      } catch (err) {
        setError('Failed to load flight details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [flightId]);
  
  const generateRandomSeat = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const randomRow = rows[Math.floor(Math.random() * rows.length)];
    const randomNumber = Math.floor(Math.random() * 30) + 1;
    return `${randomNumber}${randomRow}`;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Basic validation
    if (!passengerName.trim()) {
      setError('Passenger name is required');
      return;
    }
    
    if (!age || isNaN(parseInt(age)) || parseInt(age) <= 0) {
      setError('Please enter a valid age');
      return;
    }
    
    if (!seatNumber) {
      setError('Please select a seat');
      return;
    }
    
    // Check for token
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setError('You must be logged in to book a flight');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    // Start booking process
    setBookingInProgress(true);
    
    // Create booking with minimal data
    try {
      console.log('Creating booking for flight:', flightId);
      
      // Create booking
      const bookingRes = await createBooking({ flight_id: flightId }, currentToken);
      if (!bookingRes?.data?.booking_id) {
        throw new Error('Booking creation failed');
      }
      
      const booking_id = bookingRes.data.booking_id;
      console.log('Booking created with ID:', booking_id);
      
      // Add ticket
      const ticketData = {
        booking_id,
        flight_id: flightId,
        seat_number: seatNumber,
        passenger_name: passengerName,
        age: parseInt(age),
        gender
      };
      
      await addTicket(ticketData, currentToken);
      console.log('Ticket added successfully');
      
      // Use direct location change instead of React Router navigation
      // This avoids React state issues that might cause infinite loops
      window.location.href = `/payment/${booking_id}`;
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.error || err.message || 'Booking failed. Please try again.');
      setBookingInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // If initial loading is still happening, show a simple loading message 
  if (loading && !flight) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading flight details...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={6}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Flight Selection</StepLabel>
          </Step>
          <Step>
            <StepLabel>Passenger Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Payment</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirmation</StepLabel>
          </Step>
        </Stepper>
        
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary" align="center">
          Complete Your Booking
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {bookingInProgress && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <CircularProgress size={20} sx={{ mr: 2 }} />
              Processing your booking... Please wait.
            </Box>
          </Alert>
        )}
        
        {flight && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Flight Details
              </Typography>
              
              <FlightInfoCard>
                <FlightHeader>
                  <Typography variant="h6">{flight.airline} - {flight.flight_number}</Typography>
                </FlightHeader>
                
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={5}>
                      <Box display="flex" alignItems="center">
                        <FlightTakeoff color="primary" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="h6" fontWeight="bold">{sourceAirport?.code}</Typography>
                          <Typography variant="body2" color="text.secondary">{sourceAirport?.city}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" mt={1}>
                        {formatDate(flight.departure_time)}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatTime(flight.departure_time)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <ArrowRightAlt color="action" />
                    </Grid>
                    
                    <Grid item xs={5}>
                      <Box display="flex" alignItems="center">
                        <FlightLand color="primary" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="h6" fontWeight="bold">{destAirport?.code}</Typography>
                          <Typography variant="body2" color="text.secondary">{destAirport?.city}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" mt={1}>
                        {formatDate(flight.arrival_time)}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatTime(flight.arrival_time)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Duration: {Math.round((new Date(flight.arrival_time) - new Date(flight.departure_time)) / 36e5)}h
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      ₹{flight.price.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </FlightInfoCard>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                * Fare includes all taxes and fees
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                * Free cancellation available up to 24 hours before departure
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Passenger Information
              </Typography>
              
              <BookingCard>
                <form onSubmit={handleBooking}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField 
                        label="Passenger Name" 
                        fullWidth 
                        value={passengerName} 
                        onChange={e => setPassengerName(e.target.value)} 
                        required 
                        disabled={bookingInProgress}
                        InputProps={{
                          startAdornment: <Person color="action" sx={{ mr: 1 }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Age" 
                        fullWidth 
                        type="number"
                        value={age} 
                        onChange={e => setAge(e.target.value)} 
                        required 
                        disabled={bookingInProgress}
                        InputProps={{
                          startAdornment: <CalendarMonth color="action" sx={{ mr: 1 }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required disabled={bookingInProgress}>
                        <InputLabel id="gender-label">Gender</InputLabel>
                        <Select
                          labelId="gender-label"
                          value={gender}
                          onChange={e => setGender(e.target.value)}
                          startAdornment={<Wc color="action" sx={{ mr: 1 }} />}
                        >
                          <MenuItem value="M">Male</MenuItem>
                          <MenuItem value="F">Female</MenuItem>
                          <MenuItem value="O">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField 
                        label="Seat Number" 
                        fullWidth 
                        value={seatNumber} 
                        onChange={e => setSeatNumber(e.target.value)} 
                        required 
                        disabled={bookingInProgress}
                        InputProps={{
                          startAdornment: <EventSeat color="action" sx={{ mr: 1 }} />,
                          readOnly: true,
                        }}
                        helperText="Seat assigned automatically. You can change it at check-in."
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/')}
                          startIcon={<ArrowBack />}
                          disabled={bookingInProgress}
                        >
                          Back to Search
                        </Button>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                          disabled={bookingInProgress}
                          sx={{ position: 'relative', minWidth: '120px' }}
                        >
                          {bookingInProgress ? (
                            <>
                              <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} />
                              <span style={{ visibility: 'hidden' }}>Book Now</span>
                            </>
                          ) : 'Book Now'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </BookingCard>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
}
