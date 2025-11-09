from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
from datetime import datetime

bookings_enhanced_bp = Blueprint('bookings_enhanced', __name__, url_prefix='/api/bookings')

SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')

def get_user_from_token():
    """Extract user ID from JWT token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except:
        return None

def decrease_seat_availability(cursor, flight_id, seats=1):
    """Decrease available seats for a flight"""
    cursor.execute(
        """UPDATE flights
           SET available_seats = available_seats - %s
           WHERE flight_id = %s AND available_seats >= %s""",
        (seats, flight_id, seats)
    )
    return cursor.rowcount > 0

def increase_seat_availability(cursor, flight_id, seats=1):
    """Increase available seats for a flight (on cancellation)"""
    cursor.execute(
        """UPDATE flights
           SET available_seats = available_seats + %s
           WHERE flight_id = %s""",
        (seats, flight_id)
    )

@bookings_enhanced_bp.route('', methods=['POST'])
def create_simple_booking():
    """Create a simple booking with just flight_id"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        flight_id = data.get('flight_id')

        if not flight_id:
            return jsonify({"error": "flight_id is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Check if flight exists and has seats
            cursor.execute(
                "SELECT available_seats FROM flights WHERE flight_id = %s",
                (flight_id,)
            )
            result = cursor.fetchone()

            if not result:
                conn.rollback()
                cursor.close()
                conn.close()
                return jsonify({"error": "Flight not found"}), 404

            if result['available_seats'] < 1:
                conn.rollback()
                cursor.close()
                conn.close()
                return jsonify({"error": "No seats available"}), 400

            # Create booking
            cursor.execute(
                "INSERT INTO bookings (user_id, status, created_at) VALUES (%s, %s, NOW())",
                (user_id, 'PENDING')
            )
            booking_id = cursor.lastrowid

            # Decrease available seats
            decrease_seat_availability(cursor, flight_id, 1)

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({
                "message": "Booking created successfully",
                "booking_id": booking_id
            }), 201

        except Exception as e:
            conn.rollback()
            cursor.close()
            conn.close()
            raise e

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bookings_enhanced_bp.route('', methods=['GET'])
def get_user_bookings():
    """Get all bookings for the authenticated user"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Get all bookings for user with flight details
            cursor.execute("""
                SELECT
                    b.booking_id,
                    b.status,
                    b.created_at,
                    COUNT(t.ticket_id) as ticket_count
                FROM bookings b
                LEFT JOIN tickets t ON b.booking_id = t.booking_id
                WHERE b.user_id = %s
                GROUP BY b.booking_id, b.status, b.created_at
                ORDER BY b.created_at DESC
            """, (user_id,))
            bookings = cursor.fetchall()

            cursor.close()
            conn.close()

            return jsonify({"bookings": bookings}), 200

        except Exception as e:
            cursor.close()
            conn.close()
            raise e

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bookings_enhanced_bp.route('/create', methods=['POST'])
def create_enhanced_booking():
    """Create booking with support for one-way, round-trip, and multi-city"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        trip_type = data.get('trip_type', 'ONE_WAY')  # ONE_WAY, ROUND_TRIP, MULTI_CITY
        flights = data.get('flights', [])  # Array of flight objects
        passengers = data.get('passengers', [])  # Array of passenger objects
        booking_class = data.get('booking_class', 'ECONOMY')
        special_requests = data.get('special_requests', '')

        if not flights or len(flights) == 0:
            return jsonify({"error": "At least one flight is required"}), 400

        if not passengers or len(passengers) == 0:
            return jsonify({"error": "At least one passenger is required"}), 400

        # Validate trip type
        if trip_type == 'ROUND_TRIP' and len(flights) != 2:
            return jsonify({"error": "Round trip requires exactly 2 flights"}), 400

        if trip_type == 'MULTI_CITY' and len(flights) < 2:
            return jsonify({"error": "Multi-city requires at least 2 flights"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Check seat availability for all flights
            for flight in flights:
                flight_id = flight.get('flight_id')
                cursor.execute(
                    "SELECT available_seats FROM flights WHERE flight_id = %s",
                    (flight_id,)
                )
                result = cursor.fetchone()

                if not result:
                    conn.rollback()
                    return jsonify({"error": f"Flight {flight_id} not found"}), 404

                if result['available_seats'] < len(passengers):
                    conn.rollback()
                    return jsonify({
                        "error": f"Not enough seats available on flight {flight_id}"
                    }), 400

            # Create main booking
            cursor.execute(
                "INSERT INTO bookings (user_id, status) VALUES (%s, %s)",
                (user_id, 'CONFIRMED')
            )
            booking_id = cursor.lastrowid

            # Create booking metadata
            cursor.execute(
                """INSERT INTO booking_metadata
                   (booking_id, trip_type, total_passengers, booking_class, special_requests)
                   VALUES (%s, %s, %s, %s, %s)""",
                (booking_id, trip_type, len(passengers), booking_class, special_requests)
            )

            # Create trip segments and tickets
            total_price = 0
            for idx, flight in enumerate(flights):
                flight_id = flight.get('flight_id')

                # Determine segment type
                if trip_type == 'ROUND_TRIP':
                    segment_type = 'OUTBOUND' if idx == 0 else 'RETURN'
                else:
                    segment_type = 'LEG'

                # Create trip segment
                cursor.execute(
                    """INSERT INTO trip_segments
                       (booking_id, flight_id, segment_order, segment_type)
                       VALUES (%s, %s, %s, %s)""",
                    (booking_id, flight_id, idx + 1, segment_type)
                )

                # Get flight price
                cursor.execute(
                    "SELECT price FROM flights WHERE flight_id = %s",
                    (flight_id,)
                )
                flight_price = cursor.fetchone()['price']
                total_price += float(flight_price) * len(passengers)

                # Create tickets for each passenger
                for passenger in passengers:
                    cursor.execute(
                        """INSERT INTO tickets
                           (booking_id, flight_id, seat_number, passenger_name, age, gender)
                           VALUES (%s, %s, %s, %s, %s, %s)""",
                        (
                            booking_id,
                            flight_id,
                            passenger.get('seat_number'),
                            passenger.get('name'),
                            passenger.get('age'),
                            passenger.get('gender')
                        )
                    )

                # Decrease seat availability
                if not decrease_seat_availability(cursor, flight_id, len(passengers)):
                    conn.rollback()
                    return jsonify({
                        "error": f"Failed to reserve seats for flight {flight_id}"
                    }), 400

            conn.commit()

            return jsonify({
                "message": "Booking created successfully",
                "booking_id": booking_id,
                "total_price": total_price,
                "trip_type": trip_type,
                "passengers": len(passengers),
                "flights": len(flights)
            }), 201

        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bookings_enhanced_bp.route('/cancel/<int:booking_id>', methods=['PUT'])
def cancel_enhanced_booking(booking_id):
    """Cancel booking and restore seat availability"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Verify booking belongs to user
            cursor.execute(
                "SELECT * FROM bookings WHERE booking_id = %s AND user_id = %s",
                (booking_id, user_id)
            )
            booking = cursor.fetchone()

            if not booking:
                return jsonify({"error": "Booking not found"}), 404

            if booking['status'] == 'CANCELLED':
                return jsonify({"error": "Booking already cancelled"}), 400

            # Get all tickets for this booking (to restore seats)
            cursor.execute(
                """SELECT flight_id, COUNT(*) as passenger_count
                   FROM tickets
                   WHERE booking_id = %s
                   GROUP BY flight_id""",
                (booking_id,)
            )
            flights = cursor.fetchall()

            # Restore seat availability for each flight
            for flight in flights:
                increase_seat_availability(
                    cursor,
                    flight['flight_id'],
                    flight['passenger_count']
                )

            # Update booking status
            cursor.execute(
                "UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = %s",
                (booking_id,)
            )

            conn.commit()

            return jsonify({
                "message": "Booking cancelled successfully",
                "seats_restored": sum(f['passenger_count'] for f in flights)
            }), 200

        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bookings_enhanced_bp.route('/<int:booking_id>/details', methods=['GET'])
def get_enhanced_booking_details(booking_id):
    """Get complete booking details with all segments"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get booking info
        cursor.execute(
            """SELECT b.*, bm.trip_type, bm.total_passengers,
                      bm.booking_class, bm.special_requests
               FROM bookings b
               LEFT JOIN booking_metadata bm ON b.booking_id = bm.booking_id
               WHERE b.booking_id = %s AND b.user_id = %s""",
            (booking_id, user_id)
        )
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"error": "Booking not found"}), 404

        # Get trip segments with flight details
        cursor.execute(
            """SELECT ts.*, f.flight_number, f.airline,
                      src.code as source_code, src.city as source_city, src.name as source_name,
                      dst.code as dest_code, dst.city as dest_city, dst.name as dest_name,
                      f.departure_time, f.arrival_time, f.price
               FROM trip_segments ts
               JOIN flights f ON ts.flight_id = f.flight_id
               JOIN airports src ON f.source_airport_id = src.airport_id
               JOIN airports dst ON f.destination_airport_id = dst.airport_id
               WHERE ts.booking_id = %s
               ORDER BY ts.segment_order""",
            (booking_id,)
        )
        segments = cursor.fetchall()

        # Get all tickets
        cursor.execute(
            """SELECT t.*, f.flight_number
               FROM tickets t
               JOIN flights f ON t.flight_id = f.flight_id
               WHERE t.booking_id = %s""",
            (booking_id,)
        )
        tickets = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "booking": {
                "booking_id": booking['booking_id'],
                "user_id": booking['user_id'],
                "booking_time": booking['booking_time'].isoformat() if booking['booking_time'] else None,
                "status": booking['status'],
                "trip_type": booking['trip_type'] if booking['trip_type'] else 'ONE_WAY',
                "total_passengers": booking['total_passengers'] if booking['total_passengers'] else 1,
                "booking_class": booking['booking_class'] if booking['booking_class'] else 'ECONOMY',
                "special_requests": booking['special_requests'],
                "segments": [{
                    "segment_order": seg['segment_order'],
                    "segment_type": seg['segment_type'],
                    "flight": {
                        "flight_id": seg['flight_id'],
                        "flight_number": seg['flight_number'],
                        "airline": seg['airline'],
                        "source": {
                            "code": seg['source_code'],
                            "city": seg['source_city'],
                            "name": seg['source_name']
                        },
                        "destination": {
                            "code": seg['dest_code'],
                            "city": seg['dest_city'],
                            "name": seg['dest_name']
                        },
                        "departure_time": seg['departure_time'].isoformat() if seg['departure_time'] else None,
                        "arrival_time": seg['arrival_time'].isoformat() if seg['arrival_time'] else None,
                        "price": float(seg['price']) if seg['price'] else 0
                    }
                } for seg in segments],
                "tickets": [{
                    "ticket_id": t['ticket_id'],
                    "flight_number": t['flight_number'],
                    "passenger_name": t['passenger_name'],
                    "seat_number": t['seat_number'],
                    "age": t['age'],
                    "gender": t['gender']
                } for t in tickets]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
