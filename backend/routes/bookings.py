from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
from datetime import datetime

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')

# Create booking (user only)
@bookings_bp.route('', methods=['POST'])
def create_booking():
    data = request.get_json()
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    status = 'CONFIRMED'
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO bookings (user_id, status) VALUES (%s, %s)", (user_id, status))
            booking_id = conn.insert_id()
            conn.commit()
        return jsonify({'booking_id': booking_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

# Get bookings for user
@bookings_bp.route('', methods=['GET'])
def get_user_bookings():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT b.*, t.flight_id, t.passenger_name, t.seat_number, 
                       f.flight_number, f.airline, f.departure_time, f.arrival_time,
                       src.code as source_code, src.city as source_city,
                       dst.code as dest_code, dst.city as dest_city
                FROM bookings b
                JOIN tickets t ON b.booking_id = t.booking_id
                JOIN flights f ON t.flight_id = f.flight_id
                JOIN airports src ON f.source_airport_id = src.airport_id
                JOIN airports dst ON f.destination_airport_id = dst.airport_id
                WHERE b.user_id = %s
            """, (user_id,))
            bookings = cursor.fetchall()
        return jsonify({'bookings': bookings})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

# Cancel booking
@bookings_bp.route('/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Verify the booking belongs to the user
            cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND user_id = %s", 
                          (booking_id, user_id))
            booking = cursor.fetchone()
            
            if not booking:
                return jsonify({'error': 'Booking not found or not authorized'}), 404
            
            # Update booking status to CANCELLED
            cursor.execute("UPDATE bookings SET status = 'CANCELLED' WHERE booking_id = %s", 
                          (booking_id,))
            conn.commit()
            
        return jsonify({'message': 'Booking cancelled successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

# Get booking details by ID
@bookings_bp.route('/<int:booking_id>', methods=['GET'])
def get_booking_details(booking_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT b.*, t.flight_id, t.passenger_name, t.seat_number, t.age, t.gender,
                       f.flight_number, f.airline, f.departure_time, f.arrival_time,
                       src.code as source_code, src.city as source_city,
                       dst.code as dest_code, dst.city as dest_city
                FROM bookings b
                JOIN tickets t ON b.booking_id = t.booking_id
                JOIN flights f ON t.flight_id = f.flight_id
                JOIN airports src ON f.source_airport_id = src.airport_id
                JOIN airports dst ON f.destination_airport_id = dst.airport_id
                WHERE b.booking_id = %s AND b.user_id = %s
            """, (booking_id, user_id))
            booking = cursor.fetchone()
            
            if not booking:
                return jsonify({'error': 'Booking not found or not authorized'}), 404
                
        return jsonify({'booking': booking}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()
