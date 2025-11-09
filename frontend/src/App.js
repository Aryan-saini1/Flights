import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import TicketDetails from './pages/TicketDetails';
import MyBookings from './pages/MyBookings';
import ErrorBoundary from './components/ErrorBoundary';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<UserDashboard />} />
                <Route path="/booking/:flightId" element={<Booking />} />
                <Route path="/payment/:bookingId" element={<Payment />} />
                <Route path="/ticket/:bookingId" element={<TicketDetails />} />
                <Route path="/my-bookings" element={<MyBookings />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
