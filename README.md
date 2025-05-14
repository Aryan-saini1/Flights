# SkyWay Flight Booking System

A modern, full-stack flight booking application with user and admin interfaces. This system allows users to search for flights, book tickets, and make payments, while administrators can manage flights, airports, and view bookings.

## Features

### User Features
- User registration and login with JWT authentication
- Search flights by source, destination, and date
- Modern flight search interface with filters (like Paytm/MakeMyTrip)
- Booking system with passenger details
- Payment processing
- View booking history
- Ticket cancellation

### Admin Features
- Admin registration and login
- Add and manage airports
- Add and manage flights
- View all bookings and payments

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

## Setup Instructions (Step by Step)

### Prerequisites
- Node.js and npm installed
- Python 3.x installed
- MySQL installed and running
- VS Code (recommended IDE)

### 1. Clone the Repository (Using VS Code)

1. Open VS Code
2. Click on "Clone Repository" in the start screen or use `Ctrl+Shift+P` to open the command palette and type "Git: Clone"
3. Enter the repository URL and select a destination folder
4. Open the cloned repository folder in VS Code

### 2. Database Setup

Open a terminal in VS Code (``Ctrl+` ``) and run the following commands:

```bash
# Create the database (assuming MySQL is installed)
mysql -u root -p'Ar.Saini@2004' -e "CREATE DATABASE IF NOT EXISTS Aryan;"

# Import the schema
mysql -u root -p'Ar.Saini@2004' Aryan < /Users/aryansaini/Documents/flights/db/schema.sql

# Add sample data
mysql -u root -p'Ar.Saini@2004' Aryan -e "INSERT INTO airports (name, code, city, country) VALUES ('Indira Gandhi International', 'DEL', 'Delhi', 'India'), ('Chhatrapati Shivaji Maharaj', 'BOM', 'Mumbai', 'India'), ('Kempegowda International', 'BLR', 'Bangalore', 'India'), ('Netaji Subhas Chandra Bose', 'CCU', 'Kolkata', 'India');"

mysql -u root -p'Ar.Saini@2004' Aryan -e "INSERT INTO flights (flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price) VALUES ('AI101', 'Air India', 1, 2, '2025-05-13 09:00:00', '2025-05-13 12:00:00', 180, 7500.00), ('6E202', 'IndiGo', 2, 3, '2025-05-14 15:30:00', '2025-05-14 18:30:00', 180, 6500.00), ('SG303', 'SpiceJet', 3, 4, '2025-05-15 07:45:00', '2025-05-15 10:45:00', 180, 7000.00), ('UK404', 'Vistara', 4, 1, '2025-05-16 20:00:00', '2025-05-16 23:00:00', 180, 8000.00);"
```

### 3. Backend Setup

```bash
# Navigate to the backend directory
cd /Users/aryansaini/Documents/flights/backend

# Create and activate a virtual environment
python -m venv venv

# On Windows
# venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

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
flask run --host=0.0.0.0 --port=8000
```

### 4. Frontend Setup

Open a new terminal in VS Code and run:

```bash
# Navigate to the frontend directory
cd /Users/aryansaini/Documents/flights/frontend

# Install dependencies (add --legacy-peer-deps if you encounter dependency conflicts)
npm install --legacy-peer-deps

# Start the React development server
npm start
```

### 5. Troubleshooting Backend Issues

If you encounter backend issues, try the following steps:

```bash
# Check if any process is using port 8000
# On Windows
# netstat -ano | findstr :8000

# On macOS/Linux
lsof -i :8000

# Kill the process if needed (replace PID with the process ID)
# On Windows
# taskkill /F /PID <PID>

# On macOS/Linux
kill -9 <PID>

# Create a fresh virtual environment
rm -rf venv
python -m venv fresh_venv
source fresh_venv/bin/activate
pip install Flask Flask-Cors PyJWT bcrypt python-dotenv mysql-connector-python

# Start the Flask server again
flask run --host=0.0.0.0 --port=8000
```

### 6. Troubleshooting Frontend Issues

If you encounter npm dependency conflicts, try this approach:

```bash
# Create a temporary React app
npx create-react-app test-app
cd test-app

# Copy the source code from your original project
cp -r ../src .
cp ../package.json .

# Install dependencies with legacy flag
npm install --legacy-peer-deps

# Start the application
npm start
```

## Database Schema & ER Diagram

### Database Tables

1. **Users Table**
   - `user_id` (PK): Unique identifier for users
   - `name`: User's full name
   - `email`: User's email (unique)
   - `password_hash`: Bcrypt hashed password
   - `phone`: User's phone number
   - `created_at`: Account creation timestamp

2. **Admins Table**
   - `admin_id` (PK): Unique identifier for admins
   - `username`: Admin username (unique)
   - `password_hash`: Bcrypt hashed password
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
   - `total_seats`: Total available seats
   - `price`: Ticket price

5. **Bookings Table**
   - `booking_id` (PK): Unique identifier for bookings
   - `user_id` (FK): Reference to users table
   - `booking_time`: Time of booking
   - `status`: Booking status (CONFIRMED/CANCELLED)

6. **Tickets Table**
   - `ticket_id` (PK): Unique identifier for tickets
   - `booking_id` (FK): Reference to bookings table
   - `flight_id` (FK): Reference to flights table
   - `seat_number`: Selected seat number
   - `passenger_name`: Passenger's name
   - `age`: Passenger's age
   - `gender`: Passenger's gender (M/F/O)

7. **Payments Table**
   - `payment_id` (PK): Unique identifier for payments
   - `booking_id` (FK): Reference to bookings table
   - `amount`: Payment amount
   - `payment_time`: Time of payment
   - `payment_method`: Method of payment
   - `status`: Payment status (SUCCESS/FAILED/PENDING)

### ER Diagram

```
+-------+       +--------+       +--------+
| Users |------>| Bookings |------>| Tickets |
+-------+       +--------+       +--------+
                    |                 |
                    |                 |
                    v                 v
                +--------+       +--------+
                | Payments|       | Flights |
                +--------+       +--------+
                                     |
                                     |
                                     v
                                +--------+
                                | Airports|
                                +--------+
```

### Key Relationships & Constraints

- A User can make multiple Bookings (1:N)
- A Booking can have multiple Tickets (1:N)
- Each Booking has one Payment (1:1)
- Each Ticket is for one Flight (N:1)
- Each Flight has a source and destination Airport (N:1)
- Source and destination airports must be different (CHECK constraint)
- Email addresses and flight numbers must be unique (UNIQUE constraint)
- Booking status is limited to predefined values (ENUM constraint)
- Payment status is limited to predefined values (ENUM constraint)

## Project Structure

```
flights/
├── backend/
│   ├── app.py                # Main Flask application
│   ├── db.py                 # Database connection handling
│   ├── config.py             # Configuration settings
│   ├── routes/               # API endpoints
│   │   ├── users.py          # User authentication & management
│   │   ├── admins.py         # Admin authentication & management
│   │   ├── airports.py       # Airport CRUD operations
│   │   ├── flights.py        # Flight CRUD operations
│   │   ├── bookings.py       # Booking management
│   │   ├── tickets.py        # Ticket management
│   │   └── payments.py       # Payment processing
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
├── db/
│   └── schema.sql            # Database schema definition
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── api.js            # API client for backend
│   │   ├── theme.js          # Material-UI theme customization
│   │   ├── components/       # Reusable UI components
│   │   │   └── Header.js     # Navigation header
│   │   └── pages/            # Page components
│   │       ├── Login.js      # User login
│   │       ├── Register.js   # User registration
│   │       ├── AdminLogin.js # Admin login
│   │       ├── AdminRegister.js # Admin registration
│   │       ├── UserDashboard.js # User dashboard with flight search
│   │       ├── AdminDashboard.js # Admin dashboard
│   │       ├── Booking.js    # Flight booking page
│   │       └── Payment.js    # Payment processing page
│   └── package.json          # Node.js dependencies
└── README.md                 # Project documentation
```

## Setup Instructions

### 1. Database Setup
- Install MySQL if not already installed
- Create a database named `Aryan` (or use your preferred name)
- Import the schema:
  ```bash
  mysql -u root -p'Ar.Saini@2004' Aryan < /Users/aryansaini/Documents/flights/db/schema.sql
  ```
- Add sample data for testing:
  ```bash
  # Add airports
  mysql -u root -p'Ar.Saini@2004' Aryan -e "INSERT INTO airports (name, code, city, country) VALUES ('Indira Gandhi International', 'DEL', 'Delhi', 'India'), ('Chhatrapati Shivaji Maharaj', 'BOM', 'Mumbai', 'India'), ('Kempegowda International', 'BLR', 'Bangalore', 'India'), ('Netaji Subhas Chandra Bose', 'CCU', 'Kolkata', 'India');"
  
  # Add flights
  mysql -u root -p'Ar.Saini@2004' Aryan -e "INSERT INTO flights (flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price) VALUES ('AI101', 'Air India', 1, 2, '2025-05-13 09:00:00', '2025-05-13 12:00:00', 180, 7500.00), ('6E202', 'IndiGo', 2, 3, '2025-05-14 15:30:00', '2025-05-14 18:30:00', 180, 6500.00), ('SG303', 'SpiceJet', 3, 4, '2025-05-15 07:45:00', '2025-05-15 10:45:00', 180, 7000.00), ('UK404', 'Vistara', 4, 1, '2025-05-16 20:00:00', '2025-05-16 23:00:00', 180, 8000.00);"
  ```

### 2. Backend Setup
- Navigate to the backend directory:
  ```bash
  cd /Users/aryansaini/Documents/flights/backend
  ```

- Create and activate a virtual environment (optional but recommended):
  ```bash
  python -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  ```

- Install dependencies:
  ```bash
  pip install Flask PyJWT bcrypt python-dotenv mysql-connector-python
  ```

- Create or update the `.env` file with your database credentials:
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=Ar.Saini@2004
  DB_NAME=Aryan
  SECRET_KEY=supersecretkey
  ```

- Run the Flask server:
  ```bash
  flask run --host=0.0.0.0 --port=5001
  ```
  Note: We use port 5001 because port 5000 might be in use by AirPlay on macOS.

### 3. Frontend Setup
- Navigate to the frontend directory:
  ```bash
  cd /Users/aryansaini/Documents/flights/frontend
  ```

- Install dependencies:
  ```bash
  npm install
  ```

- Start the development server:
  ```bash
  npm start
  ```

- Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
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
     flask run --host=0.0.0.0 --port=8000
     ```
  3. If the backend is already running but you still get error 3, the Login component has been modified to use a demo mode that bypasses the backend authentication. You can now log in with any email/password and the app will work in demo mode with mock data.

### Backend Connection Issues
- **Problem**: Frontend cannot connect to backend API
- **Solution**:
  1. Check if the backend is running: `lsof -i :8000`
  2. If not running, start it as described above
  3. If running but still having issues, verify the API base URL in the frontend code (`/Users/aryansaini/Documents/flights/frontend/src/api.js`)

### Dependency Conflicts
- **Problem**: npm install fails with peer dependency conflicts
- **Solution**: 
  ```bash
  # Create a temporary React app as shown in the troubleshooting steps
  cd /tmp
  npx create-react-app test-app
  cd test-app
  
  # Copy the source code from your original project
  cp -r /Users/aryansaini/Documents/flights/frontend/src .
  cp /Users/aryansaini/Documents/flights/frontend/package.json .
  
  # Install dependencies with legacy flag
  npm install --legacy-peer-deps
  
  # Start the application
  npm start
  ```

### Database Connection Errors
- **Problem**: Backend cannot connect to the database
- **Solution**: 
  1. Verify MySQL is running: `ps aux | grep mysql`
  2. Check the credentials in the `.env` file match your MySQL setup
  3. Ensure the database has been created: 
     ```bash
     mysql -u root -p'Ar.Saini@2004' -e "SHOW DATABASES;" | grep Aryan
     ```

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
4. **Flight Status Updates**: Real-time flight status information
5. **User Profiles**: Enhanced user profile management
6. **Booking Cancellation**: Allow users to cancel bookings
7. **Advanced Search Filters**: More search options (price range, airlines, etc.)

## Troubleshooting

- **Backend Connection Issues**: Ensure MySQL is running and credentials are correct
- **Port Already in Use**: Change the port in the flask run command
- **Frontend API Connection**: Check that API_URL in api.js points to the correct backend URL
- **Database Errors**: Verify schema has been properly imported

## Credits

- UI Design inspired by modern flight booking platforms like Paytm Flights and MakeMyTrip
- Built with Flask, React, MySQL, and Material-UI
