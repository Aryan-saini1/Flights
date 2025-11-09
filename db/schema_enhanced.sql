-- Enhanced Database Schema for Flight Booking System
-- This file contains additional tables for 2FA, password reset, and enhanced user profiles

-- Add profile picture column to existing users table
ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL AFTER phone;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER profile_picture;
ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT FALSE AFTER email_verified;

-- TOTP Secrets table for Two-Factor Authentication
CREATE TABLE IF NOT EXISTS totp_secrets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Email Verification Tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Trip Types table for storing round-trip and multi-city booking information
CREATE TABLE IF NOT EXISTS trip_segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    flight_id INT NOT NULL,
    segment_order INT NOT NULL,
    segment_type ENUM('OUTBOUND', 'RETURN', 'LEG') DEFAULT 'OUTBOUND',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    INDEX idx_booking_id (booking_id)
);

-- Booking metadata for enhanced booking information
CREATE TABLE IF NOT EXISTS booking_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    trip_type ENUM('ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY') DEFAULT 'ONE_WAY',
    total_passengers INT DEFAULT 1,
    booking_class ENUM('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST') DEFAULT 'ECONOMY',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- Notifications table for email notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('BOOKING_CONFIRMATION', 'PAYMENT_SUCCESS', 'CANCELLATION', 'PASSWORD_RESET', 'EMAIL_VERIFICATION') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_sent (sent)
);

-- Add indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_flights_departure ON flights(departure_time);
CREATE INDEX idx_flights_available_seats ON flights(available_seats);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_status ON payments(status);
