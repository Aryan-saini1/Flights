from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
import qrcode
import barcode
from barcode.writer import ImageWriter
import io
import base64
import json

tickets_enhanced_bp = Blueprint('tickets_enhanced', __name__, url_prefix='/api/tickets')

SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')

def generate_qr_code(data_dict):
    """Generate QR code from dictionary data"""
    # Convert dict to JSON string
    data_string = json.dumps(data_dict)

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data_string)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return f"data:image/png;base64,{img_str}"

def generate_barcode(code_string):
    """Generate barcode from string"""
    try:
        # Use Code128 barcode format
        code128 = barcode.get_barcode_class('code128')
        barcode_instance = code128(code_string, writer=ImageWriter())

        # Generate barcode image
        buffered = io.BytesIO()
        barcode_instance.write(buffered)

        # Convert to base64
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        # Fallback: return simple text representation
        return None

@tickets_enhanced_bp.route('', methods=['POST'])
def create_ticket():
    """Create a new ticket for a booking"""
    try:
        data = request.json
        booking_id = data.get('booking_id')
        flight_id = data.get('flight_id')
        seat_number = data.get('seat_number')
        passenger_name = data.get('passenger_name')
        age = data.get('age')
        gender = data.get('gender')

        if not all([booking_id, flight_id, seat_number, passenger_name]):
            return jsonify({"error": "booking_id, flight_id, seat_number, and passenger_name are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Verify booking exists
            cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "Booking not found"}), 404

            # Verify flight exists
            cursor.execute("SELECT * FROM flights WHERE flight_id = %s", (flight_id,))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "Flight not found"}), 404

            # Create ticket
            cursor.execute(
                """INSERT INTO tickets (booking_id, flight_id, seat_number, passenger_name, age, gender, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
                (booking_id, flight_id, seat_number, passenger_name, age, gender)
            )
            ticket_id = cursor.lastrowid

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({
                "message": "Ticket created successfully",
                "ticket_id": ticket_id
            }), 201

        except Exception as e:
            conn.rollback()
            cursor.close()
            conn.close()
            raise e

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tickets_enhanced_bp.route('/<int:ticket_id>', methods=['GET'])
def get_ticket_with_codes(ticket_id):
    """Get ticket with QR code and barcode"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get complete ticket information
        cursor.execute(
            """SELECT
                t.ticket_id, t.booking_id, t.seat_number,
                t.passenger_name, t.age, t.gender,
                f.flight_id, f.flight_number, f.airline,
                f.departure_time, f.arrival_time, f.price,
                src.code as source_code, src.city as source_city, src.name as source_name,
                dst.code as dest_code, dst.city as dest_city, dst.name as dest_name,
                b.booking_time, b.status as booking_status,
                p.amount, p.payment_method, p.status as payment_status
            FROM tickets t
            JOIN flights f ON t.flight_id = f.flight_id
            JOIN airports src ON f.source_airport_id = src.airport_id
            JOIN airports dst ON f.destination_airport_id = dst.airport_id
            JOIN bookings b ON t.booking_id = b.booking_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            WHERE t.ticket_id = %s""",
            (ticket_id,)
        )

        ticket = cursor.fetchone()
        cursor.close()
        conn.close()

        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        # Prepare data for QR code
        qr_data = {
            "ticket_id": ticket['ticket_id'],
            "booking_id": ticket['booking_id'],
            "flight_number": ticket['flight_number'],
            "passenger": ticket['passenger_name'],
            "seat": ticket['seat_number'],
            "from": ticket['source_code'],
            "to": ticket['dest_code'],
            "departure": ticket['departure_time'].isoformat() if ticket['departure_time'] else None,
            "boarding_time": (ticket['departure_time'].replace(minute=ticket['departure_time'].minute-30)).isoformat() if ticket['departure_time'] else None
        }

        # Generate QR code
        qr_code = generate_qr_code(qr_data)

        # Generate barcode (using booking ID + ticket ID)
        barcode_string = f"{ticket['booking_id']}{ticket['ticket_id']:06d}"
        barcode_image = generate_barcode(barcode_string)

        # Prepare response
        ticket_data = {
            "ticket_id": ticket['ticket_id'],
            "booking_id": ticket['booking_id'],
            "passenger": {
                "name": ticket['passenger_name'],
                "age": ticket['age'],
                "gender": ticket['gender']
            },
            "seat_number": ticket['seat_number'],
            "flight": {
                "flight_id": ticket['flight_id'],
                "flight_number": ticket['flight_number'],
                "airline": ticket['airline'],
                "source": {
                    "code": ticket['source_code'],
                    "city": ticket['source_city'],
                    "name": ticket['source_name']
                },
                "destination": {
                    "code": ticket['dest_code'],
                    "city": ticket['dest_city'],
                    "name": ticket['dest_name']
                },
                "departure_time": ticket['departure_time'].isoformat() if ticket['departure_time'] else None,
                "arrival_time": ticket['arrival_time'].isoformat() if ticket['arrival_time'] else None,
                "price": float(ticket['price']) if ticket['price'] else 0
            },
            "booking": {
                "booking_time": ticket['booking_time'].isoformat() if ticket['booking_time'] else None,
                "status": ticket['booking_status']
            },
            "payment": {
                "amount": float(ticket['amount']) if ticket['amount'] else 0,
                "method": ticket['payment_method'],
                "status": ticket['payment_status']
            } if ticket['amount'] else None,
            "qr_code": qr_code,
            "barcode": barcode_image,
            "barcode_number": barcode_string
        }

        return jsonify({"ticket": ticket_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tickets_enhanced_bp.route('/booking/<int:booking_id>', methods=['GET'])
def get_tickets_for_booking_with_codes(booking_id):
    """Get all tickets for a booking with QR codes and barcodes"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all tickets for booking
        cursor.execute(
            """SELECT
                t.ticket_id, t.booking_id, t.seat_number,
                t.passenger_name, t.age, t.gender,
                f.flight_id, f.flight_number, f.airline,
                f.departure_time, f.arrival_time, f.price,
                src.code as source_code, src.city as source_city, src.name as source_name,
                dst.code as dest_code, dst.city as dest_city, dst.name as dest_name,
                b.booking_time, b.status as booking_status
            FROM tickets t
            JOIN flights f ON t.flight_id = f.flight_id
            JOIN airports src ON f.source_airport_id = src.airport_id
            JOIN airports dst ON f.destination_airport_id = dst.airport_id
            JOIN bookings b ON t.booking_id = b.booking_id
            WHERE t.booking_id = %s""",
            (booking_id,)
        )

        tickets = cursor.fetchall()
        cursor.close()
        conn.close()

        if not tickets:
            return jsonify({"tickets": []}), 200

        # Generate codes for each ticket
        tickets_with_codes = []
        for ticket in tickets:
            # QR data
            qr_data = {
                "ticket_id": ticket['ticket_id'],
                "booking_id": ticket['booking_id'],
                "flight_number": ticket['flight_number'],
                "passenger": ticket['passenger_name'],
                "seat": ticket['seat_number'],
                "from": ticket['source_code'],
                "to": ticket['dest_code'],
                "departure": ticket['departure_time'].isoformat() if ticket['departure_time'] else None
            }

            qr_code = generate_qr_code(qr_data)
            barcode_string = f"{ticket['booking_id']}{ticket['ticket_id']:06d}"
            barcode_image = generate_barcode(barcode_string)

            tickets_with_codes.append({
                "ticket_id": ticket['ticket_id'],
                "booking_id": ticket['booking_id'],
                "passenger": {
                    "name": ticket['passenger_name'],
                    "age": ticket['age'],
                    "gender": ticket['gender']
                },
                "seat_number": ticket['seat_number'],
                "flight": {
                    "flight_id": ticket['flight_id'],
                    "flight_number": ticket['flight_number'],
                    "airline": ticket['airline'],
                    "source": {
                        "code": ticket['source_code'],
                        "city": ticket['source_city'],
                        "name": ticket['source_name']
                    },
                    "destination": {
                        "code": ticket['dest_code'],
                        "city": ticket['dest_city'],
                        "name": ticket['dest_name']
                    },
                    "departure_time": ticket['departure_time'].isoformat() if ticket['departure_time'] else None,
                    "arrival_time": ticket['arrival_time'].isoformat() if ticket['arrival_time'] else None,
                    "price": float(ticket['price']) if ticket['price'] else 0
                },
                "booking_status": ticket['booking_status'],
                "qr_code": qr_code,
                "barcode": barcode_image,
                "barcode_number": barcode_string
            })

        return jsonify({"tickets": tickets_with_codes}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tickets_enhanced_bp.route('/download/<int:ticket_id>', methods=['GET'])
def download_ticket(ticket_id):
    """Get ticket data suitable for PDF/print download"""
    try:
        # Same as get_ticket_with_codes but with additional formatting
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """SELECT
                t.ticket_id, t.booking_id, t.seat_number,
                t.passenger_name, t.age, t.gender,
                f.flight_id, f.flight_number, f.airline,
                f.departure_time, f.arrival_time, f.price, f.total_seats,
                src.code as source_code, src.city as source_city, src.name as source_name, src.country as source_country,
                dst.code as dest_code, dst.city as dest_city, dst.name as dest_name, dst.country as dest_country,
                b.booking_time, b.status as booking_status,
                p.amount, p.payment_method, p.status as payment_status,
                u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM tickets t
            JOIN flights f ON t.flight_id = f.flight_id
            JOIN airports src ON f.source_airport_id = src.airport_id
            JOIN airports dst ON f.destination_airport_id = dst.airport_id
            JOIN bookings b ON t.booking_id = b.booking_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            LEFT JOIN users u ON b.user_id = u.user_id
            WHERE t.ticket_id = %s""",
            (ticket_id,)
        )

        ticket = cursor.fetchone()
        cursor.close()
        conn.close()

        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        # Generate codes
        qr_data = {
            "ticket_id": ticket['ticket_id'],
            "booking_id": ticket['booking_id'],
            "flight_number": ticket['flight_number'],
            "passenger": ticket['passenger_name'],
            "seat": ticket['seat_number'],
            "pnr": f"SKYW{ticket['booking_id']:08d}"
        }

        qr_code = generate_qr_code(qr_data)
        barcode_string = f"{ticket['booking_id']}{ticket['ticket_id']:06d}"
        barcode_image = generate_barcode(barcode_string)

        # Calculate flight duration
        duration = None
        if ticket['departure_time'] and ticket['arrival_time']:
            duration_delta = ticket['arrival_time'] - ticket['departure_time']
            hours = duration_delta.seconds // 3600
            minutes = (duration_delta.seconds % 3600) // 60
            duration = f"{hours}h {minutes}m"

        response_data = {
            "pnr": f"SKYW{ticket['booking_id']:08d}",
            "ticket_id": ticket['ticket_id'],
            "booking_id": ticket['booking_id'],
            "booking_date": ticket['booking_time'].strftime("%d %b, %Y") if ticket['booking_time'] else None,
            "passenger": {
                "name": ticket['passenger_name'],
                "age": ticket['age'],
                "gender": "Male" if ticket['gender'] == 'M' else ("Female" if ticket['gender'] == 'F' else "Other")
            },
            "contact": {
                "name": ticket['user_name'],
                "email": ticket['user_email'],
                "phone": ticket['user_phone']
            },
            "flight": {
                "number": ticket['flight_number'],
                "airline": ticket['airline'],
                "class": "Economy",  # Default
                "seat": ticket['seat_number'],
                "source": {
                    "code": ticket['source_code'],
                    "city": ticket['source_city'],
                    "name": ticket['source_name'],
                    "country": ticket['source_country'],
                    "terminal": "T1"  # Default
                },
                "destination": {
                    "code": ticket['dest_code'],
                    "city": ticket['dest_city'],
                    "name": ticket['dest_name'],
                    "country": ticket['dest_country'],
                    "terminal": "T1"  # Default
                },
                "departure": {
                    "date": ticket['departure_time'].strftime("%d %b, %Y") if ticket['departure_time'] else None,
                    "time": ticket['departure_time'].strftime("%I:%M %p") if ticket['departure_time'] else None,
                    "datetime": ticket['departure_time'].isoformat() if ticket['departure_time'] else None
                },
                "arrival": {
                    "date": ticket['arrival_time'].strftime("%d %b, %Y") if ticket['arrival_time'] else None,
                    "time": ticket['arrival_time'].strftime("%I:%M %p") if ticket['arrival_time'] else None,
                    "datetime": ticket['arrival_time'].isoformat() if ticket['arrival_time'] else None
                },
                "duration": duration
            },
            "payment": {
                "amount": float(ticket['amount']) if ticket['amount'] else float(ticket['price']),
                "method": ticket['payment_method'],
                "status": ticket['payment_status'],
                "currency": "INR"
            } if ticket['amount'] else None,
            "status": ticket['booking_status'],
            "qr_code": qr_code,
            "barcode": barcode_image,
            "barcode_number": barcode_string
        }

        return jsonify({"ticket": response_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
