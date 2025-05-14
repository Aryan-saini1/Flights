import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

// Keyframes for rocket animation
const rocketAnimation = keyframes`
  0% {
    transform: translateY(10px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(10px);
  }
`;

const flameAnimation = keyframes`
  0% {
    height: 60px;
    opacity: 0.8;
  }
  50% {
    height: 80px;
    opacity: 1;
  }
  100% {
    height: 60px;
    opacity: 0.8;
  }
`;

const AnimatedRocket = styled(Box)(({ theme }) => ({
  animation: `${rocketAnimation} 2s infinite ease-in-out`,
  position: 'relative',
  width: '100px',
  height: '200px',
  margin: '0 auto',
}));

const RocketFlame = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '-60px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '40px',
  height: '60px',
  background: 'linear-gradient(to bottom, #ff9d00, #ff0000)',
  borderRadius: '0 0 20px 20px',
  animation: `${flameAnimation} 0.5s infinite ease-in-out`,
  zIndex: -1,
}));

const LoadingScreen = ({ message = "Loading...", overlay = true }) => {
  return (
    <Box
      sx={{
        position: overlay ? 'fixed' : 'relative',
        top: overlay ? 0 : 'auto',
        left: overlay ? 0 : 'auto',
        width: overlay ? '100%' : '100%',
        height: overlay ? '100%' : '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: overlay ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
        zIndex: overlay ? 1050 : 'auto',
        pointerEvents: overlay ? 'auto' : 'none',
      }}
    >
      <AnimatedRocket>
        <svg width="100" height="200" viewBox="0 0 100 200">
          <defs>
            <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#f5f5f5" />
            </linearGradient>
            <linearGradient id="rocketWindow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#29b6f6" />
              <stop offset="100%" stopColor="#0288d1" />
            </linearGradient>
          </defs>
          
          {/* Rocket Body */}
          <path 
            d="M50,10 L70,80 L70,160 C70,170 60,180 50,180 C40,180 30,170 30,160 L30,80 Z" 
            fill="url(#rocketBody)" 
            stroke="#bdbdbd" 
            strokeWidth="2"
          />
          
          {/* Rocket Tip */}
          <path 
            d="M50,10 C60,30 70,50 70,80 L30,80 C30,50 40,30 50,10 Z" 
            fill="#37474f" 
            stroke="#263238" 
            strokeWidth="2"
          />
          
          {/* Rocket Window */}
          <circle cx="50" cy="100" r="15" fill="url(#rocketWindow)" stroke="#0277bd" strokeWidth="2" />
          
          {/* Rocket Fins */}
          <path d="M30,140 L10,170 L30,170 L30,140 Z" fill="#455a64" stroke="#263238" strokeWidth="2" />
          <path d="M70,140 L90,170 L70,170 L70,140 Z" fill="#455a64" stroke="#263238" strokeWidth="2" />
        </svg>
        <RocketFlame />
      </AnimatedRocket>
      
      <Typography variant="h5" sx={{ mt: 4, fontWeight: 'bold', color: '#1976d2' }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
