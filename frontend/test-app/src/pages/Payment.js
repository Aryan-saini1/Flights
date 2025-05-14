import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { makePayment, getPaymentForBooking, getTicketsForBooking } from '../api';
import { 
  Button, Typography, Container, Box, TextField, Paper, Grid, 
  FormControl, InputLabel, MenuItem, Select, Divider, Alert,
  Card, CardContent, Radio, RadioGroup, FormControlLabel,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CreditCard, AccountBalance, Payment as PaymentIcon, 
  CheckCircle, Done
} from '@mui/icons-material';
import LoadingScreen from '../components/LoadingScreen';

const PaymentCard = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(3),
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  marginBottom: theme.spacing(4),
}));

const PaymentMethodCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
}));

const SelectedPaymentMethod = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(2),
  border: `2px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.primary.lighter || 'rgba(25, 118, 210, 0.05)',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
}));

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) {
        setError('Invalid booking ID');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching payment details for booking:', bookingId);
        
        // Check if payment already exists
        const paymentRes = await getPaymentForBooking(bookingId);
        console.log('Payment response:', paymentRes.data);
        
        if (paymentRes.data.payment) {
          setPayment(paymentRes.data.payment);
          setStatus(paymentRes.data.payment.status);
          console.log('Payment status:', paymentRes.data.payment.status);
          
          if (paymentRes.data.payment.status === 'SUCCESS') {
            setSuccess(true);
          }
        }
        
        // Get ticket details to show amount
        console.log('Fetching ticket details for booking:', bookingId);
        const ticketRes = await getTicketsForBooking(bookingId);
        console.log('Ticket response:', ticketRes.data);
        
        if (ticketRes.data.tickets && ticketRes.data.tickets.length > 0) {
          const ticket = ticketRes.data.tickets[0];
          console.log('Ticket data:', ticket);
          setTicketDetails(ticket);
          
          // Set default amount based on flight price
          if (ticket.price) {
            console.log('Setting amount from ticket price:', ticket.price);
            setAmount(ticket.price);
          } else {
            // Default amount if price not available
            console.log('Using default price of 5000');
            setAmount(5000);
          }
        } else {
          console.log('No tickets found for booking:', bookingId);
          setError('No tickets found for this booking');
        }
      } catch (err) {
        setError('Failed to load payment details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bookingId]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);
    
    // Validate booking ID
    if (!bookingId) {
      setError('Invalid booking ID. Please go back and try again.');
      setProcessing(false);
      return;
    }
    
    // Validate payment details
    if (paymentMethod === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid card number');
        setProcessing(false);
        return;
      }
      
      if (!cardName.trim()) {
        setError('Please enter the cardholder name');
        setProcessing(false);
        return;
      }
      
      if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
        setError('Please enter a valid expiry date (MM/YY)');
        setProcessing(false);
        return;
      }
      
      if (!cvv.match(/^\d{3}$/)) {
        setError('Please enter a valid CVV');
        setProcessing(false);
        return;
      }
    }
    
    // Make sure we have a valid token
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setError('You must be logged in to make a payment. Please log in and try again.');
      setProcessing(false);
      setTimeout(() => {
        navigate('/login', { state: { returnUrl: `/payment/${bookingId}` } });
      }, 2000);
      return;
    }
    
    console.log('Processing payment for booking:', bookingId, 'Amount:', amount);
    
    try {
      const paymentData = { 
        booking_id: bookingId, 
        amount, 
        payment_method: paymentMethod 
      };
      
      // Add a small delay to simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const paymentRes = await makePayment(paymentData, currentToken);
      console.log('✅ Payment processed successfully:', paymentRes.data);
      
      setStatus('SUCCESS');
      setSuccess(true);
      
      // Add the payment to state
      setPayment({
        ...paymentRes.data.payment || {
          payment_id: Date.now(), // Fallback ID if none provided
          booking_id: bookingId,
          amount: amount,
          payment_method: paymentMethod,
          status: 'SUCCESS',
          created_at: new Date().toISOString()
        }
      });
      
      // Redirect to ticket view after 2 seconds
      console.log('Redirecting to ticket page in 2 seconds...');
      setTimeout(() => {
        navigate(`/ticket/${bookingId}`);
      }, 2000);
    } catch (err) {
      console.error('❌ Payment error:', err);
      setStatus('FAILED');
      
      let errorMessage = 'Payment failed. Please try again.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Log detailed error information
      console.error('Error details:', { 
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack
      });
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  if (loading) {
    return <LoadingScreen message="Processing payment..." />;
  }

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={6}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary" align="center">
          Complete Your Payment
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          Booking ID: {bookingId}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main" fontWeight="bold">
              Payment Successful!
            </Typography>
            <Typography variant="body1" paragraph>
              Your payment has been processed successfully. Your ticket is ready.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/ticket/${bookingId}`)}
              sx={{ mt: 2 }}
            >
              View Ticket
            </Button>
          </Box>
        ) : payment ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Payment Status: {payment.status}
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/ticket/${bookingId}`)}
              sx={{ mt: 2 }}
            >
              View Booking Details
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Payment Method
              </Typography>
              
              <Box mb={3}>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      {paymentMethod === 'CARD' ? (
                        <SelectedPaymentMethod>
                          <FormControlLabel 
                            value="CARD" 
                            control={<Radio />} 
                            label={
                              <Box display="flex" alignItems="center">
                                <CreditCard color="primary" sx={{ mr: 1 }} />
                                <Typography fontWeight="bold">Credit/Debit Card</Typography>
                              </Box>
                            } 
                          />
                        </SelectedPaymentMethod>
                      ) : (
                        <PaymentMethodCard onClick={() => setPaymentMethod('CARD')}>
                          <FormControlLabel 
                            value="CARD" 
                            control={<Radio />} 
                            label={
                              <Box display="flex" alignItems="center">
                                <CreditCard color="action" sx={{ mr: 1 }} />
                                <Typography>Credit/Debit Card</Typography>
                              </Box>
                            } 
                          />
                        </PaymentMethodCard>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      {paymentMethod === 'BANK' ? (
                        <SelectedPaymentMethod>
                          <FormControlLabel 
                            value="BANK" 
                            control={<Radio />} 
                            label={
                              <Box display="flex" alignItems="center">
                                <AccountBalance color="primary" sx={{ mr: 1 }} />
                                <Typography fontWeight="bold">Net Banking</Typography>
                              </Box>
                            } 
                          />
                        </SelectedPaymentMethod>
                      ) : (
                        <PaymentMethodCard onClick={() => setPaymentMethod('BANK')}>
                          <FormControlLabel 
                            value="BANK" 
                            control={<Radio />} 
                            label={
                              <Box display="flex" alignItems="center">
                                <AccountBalance color="action" sx={{ mr: 1 }} />
                                <Typography>Net Banking</Typography>
                              </Box>
                            } 
                          />
                        </PaymentMethodCard>
                      )}
                    </Grid>
                  </Grid>
                </RadioGroup>
              </Box>
              
              <PaymentCard>
                <form onSubmit={handlePayment}>
                  {paymentMethod === 'CARD' ? (
                    <>
                      <TextField 
                        label="Card Number" 
                        fullWidth 
                        margin="normal" 
                        value={cardNumber} 
                        onChange={handleCardNumberChange} 
                        placeholder="1234 5678 9012 3456"
                        inputProps={{ maxLength: 19 }}
                        required 
                      />
                      
                      <TextField 
                        label="Cardholder Name" 
                        fullWidth 
                        margin="normal" 
                        value={cardName} 
                        onChange={(e) => setCardName(e.target.value)} 
                        required 
                      />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField 
                            label="Expiry Date" 
                            fullWidth 
                            margin="normal" 
                            value={expiryDate} 
                            onChange={(e) => setExpiryDate(e.target.value)} 
                            placeholder="MM/YY"
                            inputProps={{ maxLength: 5 }}
                            required 
                          />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <TextField 
                            label="CVV" 
                            fullWidth 
                            margin="normal" 
                            value={cvv} 
                            onChange={(e) => setCvv(e.target.value)} 
                            type="password"
                            inputProps={{ maxLength: 3 }}
                            required 
                          />
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="bank-select-label">Select Bank</InputLabel>
                      <Select
                        labelId="bank-select-label"
                        value="HDFC"
                        label="Select Bank"
                      >
                        <MenuItem value="HDFC">HDFC Bank</MenuItem>
                        <MenuItem value="ICICI">ICICI Bank</MenuItem>
                        <MenuItem value="SBI">State Bank of India</MenuItem>
                        <MenuItem value="AXIS">Axis Bank</MenuItem>
                        <MenuItem value="KOTAK">Kotak Mahindra Bank</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit" 
                    fullWidth 
                    size="large"
                    disabled={processing}
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                    sx={{ 
                      mt: 3, 
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                    }}
                  >
                    {processing ? 'Processing...' : `Pay ₹${amount}`}
                  </Button>
                </form>
              </PaymentCard>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Order Summary
              </Typography>
              
              <Card sx={{ borderRadius: 2, mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Flight Details
                  </Typography>
                  
                  {ticketDetails && (
                    <Box>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Passenger:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{ticketDetails.passenger_name}</Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Seat:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{ticketDetails.seat_number}</Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Flight:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{ticketDetails.flight_number}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Base Fare:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">₹{(amount * 0.8).toFixed(2)}</Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Taxes & Fees:</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">₹{(amount * 0.2).toFixed(2)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">Total Amount:</Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">₹{amount}</Typography>
                  </Box>
                </CardContent>
              </Card>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                * By proceeding with the payment, you agree to our terms and conditions.
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Done color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">Secure Payment</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Done color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">Instant Confirmation</Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
}
