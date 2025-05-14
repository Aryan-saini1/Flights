import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFlights, getUserBookings, getAirports } from '../api';
import { 
  Button, Typography, Container, Box, Card, CardContent, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup,
  FormControlLabel, FormLabel, InputAdornment, Divider, Paper, Chip,
  CircularProgress, Alert, Fade, Grow, Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  FlightTakeoff, FlightLand, CalendarMonth, Person, Search,
  AirplanemodeActive, AccessTime, AttachMoney, ArrowRightAlt,
  LocalOffer, Luggage, AirlineSeatReclineNormal
} from '@mui/icons-material';
import LoadingScreen from '../components/LoadingScreen';

// Styled components for premium look
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  padding: theme.spacing(8, 0),
  color: 'white',
  borderRadius: '0 0 20px 20px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(4),
  textAlign: 'center',
}));

const SearchCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  marginTop: theme.spacing(-6),
  marginBottom: theme.spacing(4),
  background: 'white',
  position: 'relative',
  zIndex: 2,
}));

const FlightCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  borderRadius: 30,
  padding: theme.spacing(1.5, 4),
  fontSize: '1rem',
  fontWeight: 600,
  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)',
  },
}));

export default function UserDashboard() {
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [tripType, setTripType] = useState('roundTrip');
  const [searchParams, setSearchParams] = useState({
    source: '',
    destination: '',
    departureDate: new Date().toISOString().slice(0, 10),
    returnDate: '',
    passengers: 1,
    class: 'Economy'
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Load initial data
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    
    const loadData = async () => {
      try {
        // First try to load airports independently with detailed logging
        console.log('Fetching airports data...');
        const airportsRes = await getAirports();
        console.log('Airports response:', airportsRes.data);
        
        if (airportsRes.data && airportsRes.data.airports) {
          console.log(`Found ${airportsRes.data.airports.length} airports`);
          setAirports(airportsRes.data.airports);
        } else {
          console.warn('Airports data structure was unexpected:', airportsRes.data);
          setError('Airport data not available. Please contact support.');
        }
        
        // Then try to load user bookings if logged in
        if (token) {
          console.log('Fetching user bookings with token...');
          try {
            const bookingsRes = await getUserBookings(token);
            console.log('Bookings response:', bookingsRes.data);
            
            if (bookingsRes.data && bookingsRes.data.bookings) {
              setBookings(bookingsRes.data.bookings);
            }
          } catch (bookingErr) {
            console.error('Failed to load bookings:', bookingErr);
            // Don't fail the whole page load if just bookings fail
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to load data:', err);
          setError('Failed to load data. Please refresh the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, [token]); // Re-fetch when token changes (login/logout)

  const handleSearch = () => {
    setLoading(true);
    setSearchPerformed(true);

    // Use codes directly from searchParams
    const sourceAirport = airports.find(a => a.code === searchParams.source);
    const destAirport = airports.find(a => a.code === searchParams.destination);

    if (!sourceAirport || !destAirport) {
      setError('Invalid airport selection.');
      setLoading(false);
      return;
    }

    const searchData = {
      source: searchParams.source,
      destination: searchParams.destination,
      date: searchParams.departureDate
    };

    console.log('[FlightSearch] Request:', searchData);
    getFlights(searchData)
      .then(res => {
        console.log('[FlightSearch] Response:', res.data);
        setFlights(res.data.flights);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch flights.');
        console.error('[FlightSearch] API error:', err);
        setLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Prevent unnecessary updates if value hasn't changed
    if (searchParams[name] === value) return;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
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

  // Format time for display
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>

      <HeroSection>
        <Container>
          <Grow in={true} timeout={1000}>
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              Fly to Your Dream Destination
            </Typography>
          </Grow>
          <Fade in={true} timeout={1500}>
            <Typography variant="h6">
              Find and book the best flight deals for your next adventure
            </Typography>
          </Fade>
        </Container>
        {loading ? <LoadingScreen message="Searching for the best flights..." /> : null}
      </HeroSection>

      <Container maxWidth="lg">
        <SearchCard elevation={3}>
          <Box mb={3}>
            <RadioGroup
              row
              name="tripType"
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              sx={{ justifyContent: 'center', mb: 2 }}
            >
              <FormControlLabel value="roundTrip" control={<Radio />} label="Round Trip" />
              <FormControlLabel value="oneWay" control={<Radio />} label="One Way" />
              <FormControlLabel value="multiCity" control={<Radio />} label="Multi-City" />
            </RadioGroup>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="source-label">From</InputLabel>
                  <Select
                    labelId="source-label"
                    name="source"
                    value={searchParams.source}
                    onChange={handleInputChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <FlightTakeoff color="primary" />
                      </InputAdornment>
                    }
                  >
                    {airports.map(airport => (
                      <MenuItem key={airport.airport_id} value={airport.code}>
                        {airport.city} ({airport.code}) - {airport.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="destination-label">To</InputLabel>
                  <Select
                    labelId="destination-label"
                    name="destination"
                    value={searchParams.destination}
                    onChange={handleInputChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <FlightLand color="primary" />
                      </InputAdornment>
                    }
                  >
                    {airports.map(airport => (
                      <MenuItem key={airport.airport_id} value={airport.code}>
                        {airport.city} ({airport.code}) - {airport.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={tripType === 'oneWay' ? 4 : 3}>
                <TextField
                  fullWidth
                  label="Departure Date"
                  name="departureDate"
                  type="date"
                  value={searchParams.departureDate}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {tripType !== 'oneWay' && (
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Return Date"
                    name="returnDate"
                    type="date"
                    value={searchParams.returnDate}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonth color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={tripType === 'oneWay' ? 4 : 3}>
                <FormControl fullWidth>
                  <InputLabel id="passengers-label">Passengers</InputLabel>
                  <Select
                    labelId="passengers-label"
                    name="passengers"
                    value={searchParams.passengers}
                    onChange={handleInputChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <MenuItem key={num} value={num}>
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={tripType === 'oneWay' ? 4 : 3}>
                <FormControl fullWidth>
                  <InputLabel id="class-label">Class</InputLabel>
                  <Select
                    labelId="class-label"
                    name="class"
                    value={searchParams.class}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Economy">Economy</MenuItem>
                    <MenuItem value="Premium Economy">Premium Economy</MenuItem>
                    <MenuItem value="Business">Business</MenuItem>
                    <MenuItem value="First">First Class</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                <SearchButton 
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  onClick={handleSearch}
                  disabled={loading || !searchParams.source || !searchParams.destination || !searchParams.departureDate}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                >
                  {loading ? 'Searching...' : 'Search Flights'}
                </SearchButton>
              </Grid>
            </Grid>
          </Box>
        </SearchCard>

        {/* Flight Results */}
        {searchPerformed && (
          <Box mb={5}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              {flights.length > 0 ? 'Available Flights' : 'No flights found'}
              {flights.length > 0 && searchParams.source && searchParams.destination && (
                <Typography variant="subtitle1" color="text.secondary" component="span" sx={{ ml: 2 }}>
                  {airports.find(a => a.airport_id === parseInt(searchParams.source))?.city} to {airports.find(a => a.airport_id === parseInt(searchParams.destination))?.city}
                </Typography>
              )}
            </Typography>

            {flights.length === 0 && !loading && searchPerformed ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No flights found for your search criteria. Try different dates or destinations.
              </Alert>
            ) : null}

            <Grid container spacing={3}>
              {flights.map(flight => (
                <Grow in={true} key={flight.flight_id} timeout={500 + (flights.indexOf(flight) * 100)}>
                  <Grid item xs={12} key={flight.flight_id}>
                    <FlightCard>
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={2}>
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                              <Box 
                                sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  borderRadius: '50%', 
                                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  mb: 1
                                }}
                              >
                                <AirplanemodeActive fontSize="large" color="primary" />
                              </Box>
                              <Typography variant="h6" fontWeight="bold">{flight.airline}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {flight.flight_number}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                              <Typography variant="h5" fontWeight="bold" color="primary">{formatTime(flight.departure_time)}</Typography>
                              <Typography variant="body1" fontWeight="bold">{flight.source_airport_code}</Typography>
                              <Typography variant="body2" color="text.secondary">{flight.source_city}</Typography>
                              <Typography variant="caption">{formatDate(flight.departure_time)}</Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                            <Divider sx={{ width: '100%', position: 'relative' }}>
                              <Chip 
                                icon={<AccessTime fontSize="small" />} 
                                label={`${Math.round((new Date(flight.arrival_time) - new Date(flight.departure_time)) / 36e5)}h`} 
                                size="small" 
                                color="primary" 
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Divider>
                            <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
                              <ArrowRightAlt color="primary" fontSize="large" />
                            </Box>
                            <Chip 
                              label="Direct" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                              sx={{ mt: 1 }} 
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                              <Typography variant="h5" fontWeight="bold" color="primary">{formatTime(flight.arrival_time)}</Typography>
                              <Typography variant="body1" fontWeight="bold">{flight.dest_airport_code}</Typography>
                              <Typography variant="body2" color="text.secondary">{flight.dest_city}</Typography>
                              <Typography variant="caption">{formatDate(flight.arrival_time)}</Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={2}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <Box sx={{ mb: 2, textAlign: 'center' }}>
                                <Typography variant="h4" color="primary" fontWeight="bold">
                                  ₹{flight.price.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {searchParams.class} Class
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip icon={<Luggage fontSize="small" />} label="20kg" size="small" />
                                <Chip icon={<LocalOffer fontSize="small" />} label="Meal" size="small" />
                              </Box>
                              
                              <Button 
                                variant="contained" 
                                color="primary" 
                                fullWidth 
                                sx={{ 
                                  borderRadius: 4,
                                  py: 1,
                                  fontWeight: 'bold',
                                  boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)',
                                  }
                                }}
                                onClick={() => navigate(`/booking/${flight.flight_id}`)}
                              >
                                Select
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </FlightCard>
                  </Grid>
                </Grow>
              ))}
            </Grid>
          </Box>
        )}

        {/* User's Bookings Section */}
        {token && bookings.length > 0 && (
          <Box mt={5} mb={5}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Your Recent Bookings
            </Typography>
            <Grid container spacing={3}>
              {bookings.map(booking => (
                <Grid item xs={12} md={6} lg={4} key={booking.booking_id}>
                  <FlightCard>
                    <CardContent>
                      <Typography variant="h6" color="primary">Booking #{booking.booking_id}</Typography>
                      <Chip 
                        label={booking.status} 
                        color={booking.status === 'CONFIRMED' ? 'success' : 'warning'}
                        size="small"
                        sx={{ mb: 2, mt: 1 }}
                      />
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        fullWidth
                        onClick={() => navigate(`/payment/${booking.booking_id}`)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </FlightCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
}
