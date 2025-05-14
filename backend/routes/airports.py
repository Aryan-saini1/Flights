from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os

airports_bp = Blueprint('airports', __name__, url_prefix='/api/airports')

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

@airports_bp.route('', methods=['GET'])
def get_airports():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT airport_id, name, code, city, country FROM airports")
        airports_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        airports = []
        for airport in airports_data:
            airports.append({
                "airport_id": airport[0],
                "name": airport[1],
                "code": airport[2],
                "city": airport[3],
                "country": airport[4]
            })
            
        return jsonify({"airports": airports}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@airports_bp.route('', methods=['POST'])
@admin_required
def add_airport():
    try:
        data = request.json
        name = data.get('name')
        code = data.get('code')
        city = data.get('city')
        country = data.get('country')
        
        if not all([name, code, city, country]):
            return jsonify({"error": "All fields are required"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if airport code already exists
        cursor.execute("SELECT * FROM airports WHERE code = %s", (code,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Airport with this code already exists"}), 409
            
        # Insert new airport
        cursor.execute(
            "INSERT INTO airports (name, code, city, country) VALUES (%s, %s, %s, %s)",
            (name, code, city, country)
        )
        conn.commit()
        
        # Get the newly created airport
        airport_id = cursor.lastrowid
        cursor.execute("SELECT airport_id, name, code, city, country FROM airports WHERE airport_id = %s", (airport_id,))
        airport = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Create response
        airport_data = {
            "airport_id": airport[0],
            "name": airport[1],
            "code": airport[2],
            "city": airport[3],
            "country": airport[4]
        }
        
        return jsonify({"message": "Airport added successfully", "airport": airport_data}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@airports_bp.route('/<int:airport_id>', methods=['GET'])
def get_airport(airport_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT airport_id, name, code, city, country FROM airports WHERE airport_id = %s", (airport_id,))
        airport = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not airport:
            return jsonify({"error": "Airport not found"}), 404
            
        # Create response
        airport_data = {
            "airport_id": airport[0],
            "name": airport[1],
            "code": airport[2],
            "city": airport[3],
            "country": airport[4]
        }
        
        return jsonify({"airport": airport_data}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
