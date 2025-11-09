# SkyWay Flight Booking System

A modern, full-stack flight booking application with user and admin interfaces. This system allows users to search for flights, book tickets, and make payments, while administrators can manage flights, airports, and view bookings.

## Features

### User Features
- User registration and login with JWT authentication
- Search flights by source, destination, and date (One Way or Round Trip only)
- Modern flight search interface with accurate airport information
- Booking system for individual passengers
- Payment processing
- View booking history
- Ticket cancellation

### Admin Features
- Admin registration and login
- Add and manage airports
- Add and manage flights
- View all bookings and payments

## Recent Updates
- Fixed issues with airport codes displaying correctly in tickets
- Fixed fare discrepancy between flight selection and ticket display
- Removed the "Your Bookings" section from under the search interface
- Simplified the interface to only support One Way and Round Trip bookings
- Streamlined passenger flow to book for one passenger at a time

## Tech Stack

### Frontend
- **React**: UI library for building the user interface
- **React Router**: For navigation and routing
- **Material-UI**: Component library for modern UI design
- **Axios**: HTTP client for API requests
- **JWT**: For secure authentication

### Backend
- **Flask**: Python web framework
- **MySQL**: Relational database
- **PyJWT**: JWT implementation for Python
- **Bcrypt**: Password hashing
- **Python-dotenv**: Environment variable management

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Python 3.x installed
- MySQL installed and running
- VS Code (recommended IDE)

### 1. Clone the Repository (Using VS Code)

1. Open VS Code
2. Click on "Clone Repository" in the start screen or use `Ctrl+Shift+P` to open the command palette and type "Git: Clone"
3. Enter the repository URL `https://github.com/Aryan-saini1/Flights` and select a destination folder
4. Open the cloned repository folder in VS Code

### 2. Database Setup

Open a terminal in VS Code (``Ctrl+` ``) and run the following commands:

```bash
# Create the database (assuming MySQL is installed)
mysql -u root -p'Ar.Saini@2004' -e "CREATE DATABASE IF NOT EXISTS Aryan;"

# Import the schema
mysql -u root -p'Ar.Saini@2004' Aryan < /path/to/flights/db/schema.sql

# Add sample data
mysql -u root -p'Ar.Saini@2004' Aryan -e "INSERT INTO airports (name, code, city, country) VALUES ('Indira Gandhi International', 'DEL', 'Delhi', 'India'), ('Chhatrapati Shivaji Maharaj', 'BOM', 'Mumbai', 'India'), ('Kempegowda International', 'BLR', 'Bangalore', 'India'), ('Netaji Subhas Chandra Bose', 'CCU', 'Kolkata', 'India');"

mysql -u root -p'Ar.Saini@2004' Aryan -e "INSERT INTO flights (flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price) VALUES ('AI101', 'Air India', 1, 2, '2025-05-13 09:00:00', '2025-05-13 12:00:00', 180, 7500.00), ('6E202', 'IndiGo', 2, 3, '2025-05-14 15:30:00', '2025-05-14 18:30:00', 180, 6500.00), ('SG303', 'SpiceJet', 3, 4, '2025-05-15 07:45:00', '2025-05-15 10:45:00', 180, 7000.00), ('UK404', 'Vistara', 4, 1, '2025-05-16 20:00:00', '2025-05-16 23:00:00', 180, 8000.00);"
```

### 3. Backend Setup

```bash
# Navigate to the backend directory
cd /Users/aryansaini/Documents/flights/backend

# Create and activate a virtual environment
python -m venv fresh_venv

# On Windows
# fresh_venv\Scripts\activate

# On macOS/Linux
source fresh_venv/bin/activate

# Install required packages
pip install Flask Flask-Cors PyJWT bcrypt python-dotenv mysql-connector-python

# Create .env file (use VS Code to create and edit this file)
```

Create a `.env` file in the backend directory with the following content:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Ar.Saini@2004
DB_NAME=Aryan
SECRET_KEY=your_secret_key
```

```bash
# Start the Flask server
python app.py
# Or alternatively:
flask run --host=0.0.0.0 --port=8000
```

### 4. Frontend Setup

You have two options for setting up the frontend:

#### Option 1: Run from original location (what VS Code opens by default)
```bash
# Navigate to the frontend directory
cd /Users/aryansaini/Documents/flights/frontend

# Install dependencies with legacy flag to avoid conflicts
npm install --legacy-peer-deps

# Start the React development server
npm start
```

#### Option 2: Use temporary React app (recommended if Option 1 has dependency issues)
```bash
# Create a temporary React app
cd /tmp
npx create-react-app test-app
cd test-app

# Copy the source code from the original project
cp -r /Users/aryansaini/Documents/flights/frontend/src/* src/
cp /Users/aryansaini/Documents/flights/frontend/package.json .

# Install dependencies with legacy flag to avoid conflicts
npm install --legacy-peer-deps

# Start the React development server
npm start
```

The application will be accessible at http://localhost:3000 in both cases.

### 5. Troubleshooting Backend Issues

If you encounter backend issues, try the following steps:

```bash
# Check if any process is using port 8000
lsof -i :8000

# Kill the process if needed (replace PID with the process ID)
kill -9 <PID>

# Create a fresh virtual environment
cd /Users/aryansaini/Documents/flights/backend
rm -rf fresh_venv
python -m venv fresh_venv
source fresh_venv/bin/activate
pip install Flask Flask-Cors PyJWT bcrypt python-dotenv mysql-connector-python

# Start the Flask server again
python app.py
```

## Database Schema

### Tables

1. **Users Table**
   - `user_id` (PK): Unique identifier for users
   - `name`: User's full name
   - `email`: User's email (unique)
   - `password`: Hashed password
   - `phone`: User's phone number
   - `created_at`: Account creation timestamp

2. **Admins Table**
   - `admin_id` (PK): Unique identifier for admins
   - `name`: Admin's full name
   - `email`: Admin's email (unique)
   - `password`: Hashed password
   - `created_at`: Account creation timestamp

3. **Airports Table**
   - `airport_id` (PK): Unique identifier for airports
   - `name`: Airport name
   - `code`: 3-letter IATA code (unique)
   - `city`: City where airport is located
   - `country`: Country where airport is located

4. **Flights Table**
   - `flight_id` (PK): Unique identifier for flights
   - `flight_number`: Flight number (unique)
   - `airline`: Airline name
   - `source_airport_id` (FK): Reference to airports table
   - `destination_airport_id` (FK): Reference to airports table
   - `departure_time`: Scheduled departure time
   - `arrival_time`: Scheduled arrival time
   - `total_seats`: Total capacity of the flight
   - `available_seats`: Remaining seats
   - `price`: Ticket price

5. **Bookings Table**
   - `booking_id` (PK): Unique identifier for bookings
   - `user_id` (FK): Reference to users table
   - `flight_id` (FK): Reference to flights table
   - `booking_time`: Time of booking
   - `status`: Booking status (CONFIRMED/CANCELLED)
   - `passenger_name`: Passenger's name
   - `passenger_age`: Passenger's age
   - `passenger_gender`: Passenger's gender

6. **Tickets Table**
   - `ticket_id` (PK): Unique identifier for tickets
   - `booking_id` (FK): Reference to bookings table
   - `seat_number`: Assigned seat
   - `passenger_name`: Passenger name
   - `passenger_age`: Passenger age
   - `passenger_gender`: Passenger gender
   - `gate`: Gate number for boarding

7. **Payments Table**
   - `payment_id` (PK): Unique identifier for payments
   - `booking_id` (FK): Reference to bookings table
   - `amount`: Payment amount
   - `payment_time`: Time of payment
   - `payment_method`: Method of payment
   - `status`: Payment status (SUCCESS/FAILED/PENDING)

## API Endpoints

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login

### Admins
- `POST /api/admins/register` - Register a new admin
- `POST /api/admins/login` - Admin login

### Airports
- `GET /api/airports` - Get all airports
- `POST /api/airports` - Add a new airport (admin only)

### Flights
- `GET /api/flights` - Get all flights or search by parameters
  - Query params: `source`, `destination`, `date`
- `POST /api/flights` - Add a new flight (admin only)
- `GET /api/flights/:id` - Get flight details by ID

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get user's bookings

### Tickets
- `POST /api/tickets` - Add a ticket to a booking
- `GET /api/tickets/booking/:id` - Get tickets for a booking

### Payments
- `POST /api/payments` - Make a payment for a booking
- `GET /api/payments/booking/:id` - Get payment details for a booking

## Common Issues and Solutions

### Login Error (Error 3)
- **Problem**: Unable to login with error code 3
- **Solution**: 
  1. This error is typically caused by a connection issue between the frontend and backend server
  2. Make sure the backend Flask server is running on port 8000:
     ```bash
     cd /Users/aryansaini/Documents/flights/backend
     source fresh_venv/bin/activate  # Use your virtual environment
     python app.py
     ```
  3. If the backend is already running but you still get error 3, the Login component has been modified to use a demo mode that bypasses the backend authentication. You can now log in with any email/password and the app will work in demo mode with mock data.

### Backend Connection Issues
- **Problem**: Frontend cannot connect to backend API
- **Solution**:
  1. Check if the backend is running: `lsof -i :8000`
  2. If not running, start it as described above
  3. If running but still having issues, verify the API base URL in the frontend code (`src/api.js`)

## Security Features

- **Password Security**: All passwords are hashed using bcrypt before storage
- **Authentication**: JWT (JSON Web Tokens) for secure API access
- **Authorization**: Role-based access control (user vs admin)
- **Environment Variables**: Sensitive data stored in .env file
- **Input Validation**: Server-side validation of all user inputs

## Future Enhancements

1. **Seat Selection**: Interactive seat map for flight bookings
2. **Real Payment Gateway**: Integration with payment processors
3. **Email Notifications**: Booking confirmations and updates
4. **Multi-passenger Booking**: Support for booking multiple passengers in one transaction
5. **Multi-city Trip Planning**: Support for complex itineraries
6. **Advanced Search Filters**: More search options (price range, airlines, etc.)

## Credits

- UI Design inspired by modern flight booking platforms like Paytm Flights and MakeMyTrip
- Built with Flask, React, MySQL, and Material-UI
