from flask import Blueprint, request, jsonify
import bcrypt
import jwt
import datetime
import os
from db import get_db_connection

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone')
        
        if not all([name, email, password, phone]):
            return jsonify({"error": "All fields are required"}), 400
            
        # Hash the password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Email already registered"}), 409
            
        # Insert new user
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, phone, created_at) VALUES (%s, %s, %s, %s, NOW())",
            (name, email, password_hash, phone)
        )
        conn.commit()
        
        # Get the newly created user
        user_id = cursor.lastrowid
        cursor.execute("SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Create response
        user_data = {
            "user_id": user[0],
            "name": user[1],
            "email": user[2],
            "phone": user[3],
            "created_at": user[4].isoformat() if user[4] else None
        }
        
        return jsonify({"message": "User registered successfully", "user": user_data}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@users_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({"error": "Email and password are required"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user by email
        cursor.execute("SELECT user_id, name, email, password_hash FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
            
        # Check password
        if bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
            # Generate JWT token
            secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')
            token = jwt.encode({
                'user_id': user[0],
                'name': user[1],
                'email': user[2],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }, secret_key, algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "user_id": user[0],
                    "name": user[1],
                    "email": user[2]
                }
            }), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@users_bp.route('/profile', methods=['GET'])
def get_profile():
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header is required"}), 401
            
        token = auth_header.split(' ')[1]
        secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')
        
        try:
            # Decode token
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user_id = payload['user_id']
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get user profile
            cursor.execute("SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            # Create response
            user_data = {
                "user_id": user[0],
                "name": user[1],
                "email": user[2],
                "phone": user[3],
                "created_at": user[4].isoformat() if user[4] else None
            }
            
            return jsonify({"user": user_data}), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
