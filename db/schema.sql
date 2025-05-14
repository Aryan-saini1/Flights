-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AIRPORTS TABLE
CREATE TABLE IF NOT EXISTS airports (
    airport_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code CHAR(3) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL
);

-- FLIGHTS TABLE
CREATE TABLE IF NOT EXISTS flights (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL UNIQUE,
    airline VARCHAR(50) NOT NULL,
    source_airport_id INT NOT NULL,
    destination_airport_id INT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    total_seats INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (source_airport_id) REFERENCES airports(airport_id),
    FOREIGN KEY (destination_airport_id) REFERENCES airports(airport_id),
    CHECK (source_airport_id <> destination_airport_id)
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    flight_id INT NOT NULL,
    seat_number VARCHAR(5),
    passenger_name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('M', 'F', 'O'),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id)
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('CARD', 'UPI', 'NETBANKING', 'WALLET') NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- Add indexes for performance
CREATE INDEX idx_flights_source_airport ON flights(source_airport_id);
CREATE INDEX idx_flights_destination_airport ON flights(destination_airport_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX idx_tickets_flight_id ON tickets(flight_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- Sample data for airports
INSERT INTO airports (name, code, city, country) VALUES
  ('Indira Gandhi International Airport', 'DEL', 'Delhi', 'India'),
  ('Chhatrapati Shivaji Maharaj International Airport', 'BOM', 'Mumbai', 'India'),
  ('Kempegowda International Airport', 'BLR', 'Bangalore', 'India'),
  ('Chennai International Airport', 'MAA', 'Chennai', 'India');

-- Sample data for flights
INSERT INTO flights (flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price) VALUES
  ('AI101', 'Air India', 1, 2, '2025-05-13 08:00:00', '2025-05-13 10:00:00', 180, 5000.00),
  ('AI102', 'Air India', 2, 1, '2025-05-13 11:00:00', '2025-05-13 13:00:00', 180, 5200.00),
  ('6E201', 'IndiGo', 1, 3, '2025-05-13 09:30:00', '2025-05-13 12:30:00', 160, 4500.00),
  ('6E202', 'IndiGo', 3, 1, '2025-05-13 14:00:00', '2025-05-13 17:00:00', 160, 4700.00),
  ('UK301', 'Vistara', 2, 3, '2025-05-13 10:00:00', '2025-05-13 12:00:00', 150, 6000.00),
  ('UK302', 'Vistara', 3, 2, '2025-05-13 13:00:00', '2025-05-13 15:00:00', 150, 6200.00);


-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    flight_id INT NOT NULL,
    seat_number VARCHAR(5),
    passenger_name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('M', 'F', 'O'),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id)
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('CARD', 'UPI', 'NETBANKING', 'WALLET') NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
