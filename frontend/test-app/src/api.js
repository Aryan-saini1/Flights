import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to handle token refresh and errors
api.interceptors.request.use(
  config => {
    // Log outgoing requests in development
    console.log(`🔄 API Request: ${config.method.toUpperCase()} ${config.url}`, config.params || config.data);
    
    // Add auth token to header if available
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  response => {
    // Log successful responses in development
    console.log(`✅ API Response: ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  error => {
    // Log error responses
    const errorData = error.response?.data || {};
    console.error(`❌ API Error: ${error.response?.status || 'UNKNOWN'} from ${error.config?.url || 'UNKNOWN'}`, 
      errorData.error || errorData.message || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      console.warn('Authentication may be expired or invalid');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to add token to requests
const withAuth = (token) => ({
  headers: { 
    Authorization: `Bearer ${token || localStorage.getItem('token')}` 
  }
});

// Helper function to validate parameters
const validateParams = (params) => {
  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      throw new Error(`Missing required parameter: ${key}`);
    }
  }
};

// ======== Auth APIs ========
export const registerUser = (data) => api.post('/users/register', data);
export const loginUser = (data) => api.post('/users/login', data);
export const registerAdmin = (data) => api.post('/admins/register', data);
export const loginAdmin = (data) => api.post('/admins/login', data);
export const verifyToken = () => api.get('/auth/verify');
export const getUserProfile = () => api.get('/users/profile');

// ======== Airport APIs ========
export const getAirports = () => api.get('/airports');
export const getAirport = (id) => api.get(`/airports/${id}`);
export const addAirport = (data, token) => api.post('/airports', data, withAuth(token));

// ======== Flight APIs ========
export const getFlights = (params) => api.get('/flights', { params });
export const getFlight = (id) => api.get(`/flights/${id}`);
export const addFlight = (data, token) => api.post('/flights', data, withAuth(token));
export const searchFlights = (params) => api.get('/flights/search', { params });

// ======== Booking APIs ========
export const createBooking = (bookingData, token) => {
  try {
    return api.post('/bookings', bookingData, withAuth(token));
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getBooking = (id) => {
  try {
    validateParams({ 'Booking ID': id });
    return api.get(`/bookings/${id}`);
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

export const getUserBookings = (token) => {
  try {
    // The backend route appears to be at /bookings not /bookings/user
    return api.get('/bookings', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const getBookingDetails = (bookingId) => {
  try {
    validateParams({ 'Booking ID': bookingId });
    return api.get(`/bookings/${bookingId}`);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

export const cancelBooking = (bookingId, token) => {
  try {
    validateParams({ 'Booking ID': bookingId });
    return api.delete(`/bookings/${bookingId}`, withAuth(token));
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

// ======== Ticket APIs ========
export const addTicket = (data, token) => {
  try {
    validateParams({ 
      'Booking ID': data.booking_id, 
      'Flight ID': data.flight_id 
    });
    return api.post('/tickets', data, withAuth(token));
  } catch (error) {
    console.error('Error adding ticket:', error);
    throw error;
  }
};

export const getTicketsForBooking = (bookingId) => {
  try {
    validateParams({ 'Booking ID': bookingId });
    return api.get(`/tickets/booking/${bookingId}`);
  } catch (error) {
    console.error('Error fetching tickets for booking:', error);
    throw error;
  }
};

export const getTicket = (id) => {
  try {
    validateParams({ 'Ticket ID': id });
    return api.get(`/tickets/${id}`);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

// ======== Payment APIs ========
export const makePayment = (data, token) => {
  try {
    validateParams({ 'Booking ID': data.booking_id });
    return api.post('/payments', data, withAuth(token));
  } catch (error) {
    console.error('Error making payment:', error);
    throw error;
  }
};

export const getPaymentForBooking = (bookingId) => {
  try {
    validateParams({ 'Booking ID': bookingId });
    return api.get(`/payments/booking/${bookingId}`);
  } catch (error) {
    console.error('Error fetching payment for booking:', error);
    throw error;
  }
};

export const getPayment = (id) => {
  try {
    validateParams({ 'Payment ID': id });
    return api.get(`/payments/${id}`);
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

export default api;
