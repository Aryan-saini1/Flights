from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')

# Add ticket to booking (user only)
@tickets_bp.route('', methods=['POST'])
def add_ticket():
    data = request.get_json()
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    booking_id = data.get('booking_id')
    flight_id = data.get('flight_id')
    seat_number = data.get('seat_number')
    passenger_name = data.get('passenger_name')
    age = data.get('age')
    gender = data.get('gender')
    if not all([booking_id, flight_id, seat_number, passenger_name, age, gender]):
        return jsonify({'error': 'Missing fields'}), 400
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO tickets (booking_id, flight_id, seat_number, passenger_name, age, gender) VALUES (%s, %s, %s, %s, %s, %s)",
                           (booking_id, flight_id, seat_number, passenger_name, age, gender))
            conn.commit()
        return jsonify({'message': 'Ticket added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

# Get tickets for booking
@tickets_bp.route('/booking/<int:booking_id>', methods=['GET'])
def get_tickets_for_booking(booking_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM tickets WHERE booking_id=%s", (booking_id,))
            tickets = cursor.fetchall()
        return jsonify({'tickets': tickets})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()
