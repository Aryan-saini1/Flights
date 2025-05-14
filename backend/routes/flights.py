from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os

flights_bp = Blueprint('flights', __name__, url_prefix='/api/flights')

# Admin middleware
def admin_required(f):
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header is required"}), 401
            
        token = auth_header.split(' ')[1]
        secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')
        
        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            if not payload.get('is_admin', False):
                return jsonify({"error": "Admin access required"}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

@flights_bp.route('', methods=['GET'])
def get_flights():
    try:
        source = request.args.get('source')
        destination = request.args.get('destination')
        date = request.args.get('date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        SELECT f.flight_id, f.flight_number, f.airline, 
               src.airport_id as source_id, src.name as source_name, src.code as source_code, src.city as source_city, 
               dst.airport_id as dest_id, dst.name as dest_name, dst.code as dest_code, dst.city as dest_city, 
               f.departure_time, f.arrival_time, f.total_seats, f.price
        FROM flights f
        JOIN airports src ON f.source_airport_id = src.airport_id
        JOIN airports dst ON f.destination_airport_id = dst.airport_id
        """
        
        conditions = []
        params = []
        
        if source:
            conditions.append("(src.code = %s OR src.city LIKE %s)")
            params.extend([source, f"%{source}%"])
            
        if destination:
            conditions.append("(dst.code = %s OR dst.city LIKE %s)")
            params.extend([destination, f"%{destination}%"])
            
        if date:
            conditions.append("DATE(f.departure_time) = %s")
            params.append(date)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        cursor.execute(query, params)
        flights_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        flights = []
        for flight in flights_data:
            flights.append({
                "flight_id": flight[0],
                "flight_number": flight[1],
                "airline": flight[2],
                "source_airport": {
                    "airport_id": flight[3],
                    "name": flight[4],
                    "code": flight[5],
                    "city": flight[6]
                },
                "destination_airport": {
                    "airport_id": flight[7],
                    "name": flight[8],
                    "code": flight[9],
                    "city": flight[10]
                },
                "departure_time": flight[11].isoformat() if flight[11] else None,
                "arrival_time": flight[12].isoformat() if flight[12] else None,
                "total_seats": flight[13],
                "price": float(flight[14]) if flight[14] else None
            })
            
        return jsonify({"flights": flights}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@flights_bp.route('/<int:flight_id>', methods=['GET'])
def get_flight(flight_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        SELECT f.flight_id, f.flight_number, f.airline, 
               src.airport_id as source_id, src.name as source_name, src.code as source_code, src.city as source_city, 
               dst.airport_id as dest_id, dst.name as dest_name, dst.code as dest_code, dst.city as dest_city, 
               f.departure_time, f.arrival_time, f.total_seats, f.price
        FROM flights f
        JOIN airports src ON f.source_airport_id = src.airport_id
        JOIN airports dst ON f.destination_airport_id = dst.airport_id
        WHERE f.flight_id = %s
        """
        
        cursor.execute(query, (flight_id,))
        flight = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not flight:
            return jsonify({"error": "Flight not found"}), 404
            
        # Create response
        flight_data = {
            "flight_id": flight[0],
            "flight_number": flight[1],
            "airline": flight[2],
            "source_airport": {
                "airport_id": flight[3],
                "name": flight[4],
                "code": flight[5],
                "city": flight[6]
            },
            "destination_airport": {
                "airport_id": flight[7],
                "name": flight[8],
                "code": flight[9],
                "city": flight[10]
            },
            "departure_time": flight[11].isoformat() if flight[11] else None,
            "arrival_time": flight[12].isoformat() if flight[12] else None,
            "total_seats": flight[13],
            "price": float(flight[14]) if flight[14] else None
        }
        
        return jsonify({"flight": flight_data}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@flights_bp.route('', methods=['POST'])
@admin_required
def add_flight():
    try:
        data = request.json
        flight_number = data.get('flight_number')
        airline = data.get('airline')
        source_airport_id = data.get('source_airport_id')
        destination_airport_id = data.get('destination_airport_id')
        departure_time = data.get('departure_time')
        arrival_time = data.get('arrival_time')
        total_seats = data.get('total_seats')
        price = data.get('price')
        
        if not all([flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price]):
            return jsonify({"error": "All fields are required"}), 400
            
        # Check that source and destination airports are different
        if int(source_airport_id) == int(destination_airport_id):
            return jsonify({"error": "Source and destination airports cannot be the same"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if flight number already exists
        cursor.execute("SELECT * FROM flights WHERE flight_number = %s", (flight_number,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Flight with this flight number already exists"}), 409
            
        # Insert new flight
        cursor.execute(
            """INSERT INTO flights 
               (flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (flight_number, airline, source_airport_id, destination_airport_id, departure_time, arrival_time, total_seats, price)
        )
        conn.commit()
        
        # Get the newly created flight
        flight_id = cursor.lastrowid
        
        query = """
        SELECT f.flight_id, f.flight_number, f.airline, 
               src.airport_id as source_id, src.name as source_name, src.code as source_code, src.city as source_city, 
               dst.airport_id as dest_id, dst.name as dest_name, dst.code as dest_code, dst.city as dest_city, 
               f.departure_time, f.arrival_time, f.total_seats, f.price
        FROM flights f
        JOIN airports src ON f.source_airport_id = src.airport_id
        JOIN airports dst ON f.destination_airport_id = dst.airport_id
        WHERE f.flight_id = %s
        """
        
        cursor.execute(query, (flight_id,))
        flight = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Create response
        flight_data = {
            "flight_id": flight[0],
            "flight_number": flight[1],
            "airline": flight[2],
            "source_airport": {
                "airport_id": flight[3],
                "name": flight[4],
                "code": flight[5],
                "city": flight[6]
            },
            "destination_airport": {
                "airport_id": flight[7],
                "name": flight[8],
                "code": flight[9],
                "city": flight[10]
            },
            "departure_time": flight[11].isoformat() if flight[11] else None,
            "arrival_time": flight[12].isoformat() if flight[12] else None,
            "total_seats": flight[13],
            "price": float(flight[14]) if flight[14] else None
        }
        
        return jsonify({"message": "Flight added successfully", "flight": flight_data}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
