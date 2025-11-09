from flask import Blueprint, request, jsonify
from db import get_db_connection
import secrets
import bcrypt
from datetime import datetime, timedelta
from flask_mail import Message
import os

password_reset_bp = Blueprint('password_reset', __name__, url_prefix='/api/password')

def send_password_reset_email(email, token):
    """Send password reset email (will be implemented with Flask-Mail)"""
    # This will be fully implemented in Phase 12 with email templates
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token}"

    # For now, just print (will send actual email later)
    print(f"Password reset link for {email}: {reset_link}")
    return True

@password_reset_bp.route('/request-reset', methods=['POST'])
def request_password_reset():
    """Request password reset - sends email with reset token"""
    try:
        data = request.json
        email = data.get('email')

        if not email:
            return jsonify({"error": "Email is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        # Always return success to prevent email enumeration
        if not user:
            cursor.close()
            conn.close()
            return jsonify({"message": "If the email exists, a reset link has been sent"}), 200

        user_id = user['user_id']

        # Generate token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=1)

        # Store token
        cursor.execute(
            """INSERT INTO password_reset_tokens (user_id, token, expires_at)
               VALUES (%s, %s, %s)""",
            (user_id, token, expires_at)
        )
        conn.commit()

        cursor.close()
        conn.close()

        # Send email
        send_password_reset_email(email, token)

        return jsonify({"message": "If the email exists, a reset link has been sent"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@password_reset_bp.route('/verify-token', methods=['POST'])
def verify_reset_token():
    """Verify if reset token is valid"""
    try:
        data = request.json
        token = data.get('token')

        if not token:
            return jsonify({"error": "Token is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """SELECT id, user_id, expires_at, used
               FROM password_reset_tokens
               WHERE token = %s""",
            (token,)
        )
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if not result:
            return jsonify({"valid": False, "error": "Invalid token"}), 200

        if result['used']:
            return jsonify({"valid": False, "error": "Token already used"}), 200

        if datetime.now() > result['expires_at']:
            return jsonify({"valid": False, "error": "Token expired"}), 200

        return jsonify({"valid": True, "user_id": result['user_id']}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@password_reset_bp.route('/reset', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.json
        token = data.get('token')
        new_password = data.get('new_password')

        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400

        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Verify token
        cursor.execute(
            """SELECT id, user_id, expires_at, used
               FROM password_reset_tokens
               WHERE token = %s""",
            (token,)
        )
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid token"}), 400

        if result['used']:
            cursor.close()
            conn.close()
            return jsonify({"error": "Token already used"}), 400

        if datetime.now() > result['expires_at']:
            cursor.close()
            conn.close()
            return jsonify({"error": "Token expired"}), 400

        user_id = result['user_id']

        # Hash new password
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (password_hash, user_id)
        )

        # Mark token as used
        cursor.execute(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = %s",
            (result['id'],)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Password reset successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@password_reset_bp.route('/change', methods=['POST'])
def change_password():
    """Change password for logged-in user"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized"}), 401

        token = auth_header.split(' ')[1]
        import jwt
        secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')

        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user_id = payload.get('user_id')
        except:
            return jsonify({"error": "Invalid token"}), 401

        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return jsonify({"error": "Current and new passwords are required"}), 400

        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get current password hash
        cursor.execute("SELECT password_hash FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            cursor.close()
            conn.close()
            return jsonify({"error": "Current password is incorrect"}), 400

        # Hash new password
        new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update password
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (new_password_hash, user_id)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Password changed successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
