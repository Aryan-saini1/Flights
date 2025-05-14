import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import UserDashboard from './pages/UserDashboard';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import TicketDetails from './pages/TicketDetails';
import ErrorBoundary from './components/ErrorBoundary';
import Welcome from './components/Welcome';

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
      <div className="App">
        <main className="main-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={
                <ErrorBoundary>
                  <React.Suspense fallback={<Welcome />}>
                    <UserDashboard />
                  </React.Suspense>
                </ErrorBoundary>
              } />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/booking/:flightId" element={<Booking />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
              <Route path="/ticket/:ticketId" element={<TicketDetails />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
