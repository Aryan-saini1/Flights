from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
from datetime import datetime

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')

# Make payment (user only)
@payments_bp.route('', methods=['POST'])
def make_payment():
    data = request.get_json()
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401
    booking_id = data.get('booking_id')
    amount = data.get('amount')
    payment_method = data.get('payment_method')
    status = data.get('status', 'SUCCESS')
    if not all([booking_id, amount, payment_method]):
        return jsonify({'error': 'Missing fields'}), 400
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (%s, %s, %s, %s)",
                           (booking_id, amount, payment_method, status))
            conn.commit()
        return jsonify({'message': 'Payment successful'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

# Get payment for booking
@payments_bp.route('/booking/<int:booking_id>', methods=['GET'])
def get_payment_for_booking(booking_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM payments WHERE booking_id=%s", (booking_id,))
            payment = cursor.fetchone()
        return jsonify({'payment': payment})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()
