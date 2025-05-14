from flask import Blueprint, request, jsonify
import bcrypt
import jwt
import datetime
import os
from db import get_db_connection

admins_bp = Blueprint('admins', __name__, url_prefix='/api/admins')

@admins_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({"error": "All fields are required"}), 400
            
        # Hash the password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username already exists
        cursor.execute("SELECT * FROM admins WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Username already registered"}), 409
            
        # Insert new admin
        cursor.execute(
            "INSERT INTO admins (username, password_hash, created_at) VALUES (%s, %s, NOW())",
            (username, password_hash)
        )
        conn.commit()
        
        # Get the newly created admin
        admin_id = cursor.lastrowid
        cursor.execute("SELECT admin_id, username, created_at FROM admins WHERE admin_id = %s", (admin_id,))
        admin = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Create response
        admin_data = {
            "admin_id": admin[0],
            "username": admin[1],
            "created_at": admin[2].isoformat() if admin[2] else None
        }
        
        return jsonify({"message": "Admin registered successfully", "admin": admin_data}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admins_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({"error": "Username and password are required"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get admin by username
        cursor.execute("SELECT admin_id, username, password_hash FROM admins WHERE username = %s", (username,))
        admin = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not admin:
            return jsonify({"error": "Invalid username or password"}), 401
            
        # Check password
        if bcrypt.checkpw(password.encode('utf-8'), admin[2].encode('utf-8')):
            # Generate JWT token
            secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')
            token = jwt.encode({
                'admin_id': admin[0],
                'username': admin[1],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
                'is_admin': True
            }, secret_key, algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "token": token,
                "admin": {
                    "admin_id": admin[0],
                    "username": admin[1]
                }
            }), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
