from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
import base64
from datetime import datetime

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

def get_user_from_token():
    """Extract user ID from JWT token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ')[1]
    secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')

    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload.get('user_id')
    except:
        return None

@profile_bp.route('', methods=['GET'])
def get_profile():
    """Get user profile"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """SELECT user_id, name, email, phone, profile_picture,
                      email_verified, is_2fa_enabled, created_at
               FROM users WHERE user_id = %s""",
            (user_id,)
        )
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "user_id": user['user_id'],
                "name": user['name'],
                "email": user['email'],
                "phone": user['phone'],
                "profile_picture": user['profile_picture'],
                "email_verified": bool(user['email_verified']),
                "is_2fa_enabled": bool(user['is_2fa_enabled']),
                "created_at": user['created_at'].isoformat() if user['created_at'] else None
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('', methods=['PUT'])
def update_profile():
    """Update user profile"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        name = data.get('name')
        phone = data.get('phone')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build update query dynamically
        updates = []
        params = []

        if name:
            updates.append("name = %s")
            params.append(name)

        if phone:
            updates.append("phone = %s")
            params.append(phone)

        if not updates:
            cursor.close()
            conn.close()
            return jsonify({"error": "No fields to update"}), 400

        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s"

        cursor.execute(query, params)
        conn.commit()

        # Get updated profile
        cursor.execute(
            """SELECT user_id, name, email, phone, profile_picture,
                      email_verified, is_2fa_enabled, created_at
               FROM users WHERE user_id = %s""",
            (user_id,)
        )
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "user_id": user['user_id'],
                "name": user['name'],
                "email": user['email'],
                "phone": user['phone'],
                "profile_picture": user['profile_picture'],
                "email_verified": bool(user['email_verified']),
                "is_2fa_enabled": bool(user['is_2fa_enabled']),
                "created_at": user['created_at'].isoformat() if user['created_at'] else None
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/picture', methods=['POST'])
def upload_profile_picture():
    """Upload profile picture (base64)"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        picture_base64 = data.get('picture')

        if not picture_base64:
            return jsonify({"error": "Picture data is required"}), 400

        # In production, you'd save this to S3/cloud storage
        # For now, we'll just store a reference or truncated version
        # Limit to 100KB
        if len(picture_base64) > 100000:
            return jsonify({"error": "Picture too large (max 100KB)"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Store picture reference (in production, store cloud URL)
        cursor.execute(
            "UPDATE users SET profile_picture = %s WHERE user_id = %s",
            (picture_base64[:1000], user_id)  # Store truncated for now
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Profile picture updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/bookings', methods=['GET'])
def get_user_bookings():
    """Get all bookings for user with full details"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get bookings with flight details
        cursor.execute(
            """SELECT
                b.booking_id, b.booking_time, b.status,
                f.flight_id, f.flight_number, f.airline,
                src.code as source_code, src.city as source_city, src.name as source_name,
                dst.code as dest_code, dst.city as dest_city, dst.name as dest_name,
                f.departure_time, f.arrival_time, f.price,
                t.ticket_id, t.passenger_name, t.seat_number, t.age, t.gender,
                p.payment_id, p.amount, p.payment_method, p.status as payment_status,
                bm.trip_type, bm.booking_class, bm.total_passengers
            FROM bookings b
            LEFT JOIN tickets t ON b.booking_id = t.booking_id
            LEFT JOIN flights f ON t.flight_id = f.flight_id
            LEFT JOIN airports src ON f.source_airport_id = src.airport_id
            LEFT JOIN airports dst ON f.destination_airport_id = dst.airport_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            LEFT JOIN booking_metadata bm ON b.booking_id = bm.booking_id
            WHERE b.user_id = %s
            ORDER BY b.booking_time DESC""",
            (user_id,)
        )

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        # Group by booking_id
        bookings_dict = {}
        for row in results:
            booking_id = row['booking_id']

            if booking_id not in bookings_dict:
                bookings_dict[booking_id] = {
                    "booking_id": booking_id,
                    "booking_time": row['booking_time'].isoformat() if row['booking_time'] else None,
                    "status": row['status'],
                    "trip_type": row['trip_type'] if row['trip_type'] else 'ONE_WAY',
                    "booking_class": row['booking_class'] if row['booking_class'] else 'ECONOMY',
                    "total_passengers": row['total_passengers'] if row['total_passengers'] else 1,
                    "payment": {
                        "payment_id": row['payment_id'],
                        "amount": float(row['amount']) if row['amount'] else 0,
                        "payment_method": row['payment_method'],
                        "status": row['payment_status']
                    } if row['payment_id'] else None,
                    "tickets": []
                }

            # Add ticket if exists
            if row['ticket_id']:
                ticket = {
                    "ticket_id": row['ticket_id'],
                    "passenger_name": row['passenger_name'],
                    "seat_number": row['seat_number'],
                    "age": row['age'],
                    "gender": row['gender'],
                    "flight": {
                        "flight_id": row['flight_id'],
                        "flight_number": row['flight_number'],
                        "airline": row['airline'],
                        "source": {
                            "code": row['source_code'],
                            "city": row['source_city'],
                            "name": row['source_name']
                        },
                        "destination": {
                            "code": row['dest_code'],
                            "city": row['dest_city'],
                            "name": row['dest_name']
                        },
                        "departure_time": row['departure_time'].isoformat() if row['departure_time'] else None,
                        "arrival_time": row['arrival_time'].isoformat() if row['arrival_time'] else None,
                        "price": float(row['price']) if row['price'] else 0
                    }
                }

                # Check if ticket already added (avoid duplicates)
                if not any(t['ticket_id'] == ticket['ticket_id'] for t in bookings_dict[booking_id]['tickets']):
                    bookings_dict[booking_id]['tickets'].append(ticket)

        bookings = list(bookings_dict.values())

        return jsonify({"bookings": bookings}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
