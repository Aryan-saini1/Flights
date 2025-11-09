from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta

auth_2fa_bp = Blueprint('auth_2fa', __name__, url_prefix='/api/auth/2fa')

def get_user_from_token():
    """Extract user from JWT token"""
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

def generate_backup_codes(count=8):
    """Generate backup codes for 2FA"""
    import secrets
    return [secrets.token_hex(4).upper() for _ in range(count)]

@auth_2fa_bp.route('/setup', methods=['POST'])
def setup_2fa():
    """Setup 2FA for user - generates secret and QR code"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if 2FA already enabled
        cursor.execute("SELECT is_2fa_enabled FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        # Generate TOTP secret
        secret = pyotp.random_base32()

        # Generate backup codes
        backup_codes = generate_backup_codes()
        backup_codes_str = ','.join(backup_codes)

        # Check if secret already exists
        cursor.execute("SELECT id FROM totp_secrets WHERE user_id = %s", (user_id,))
        existing = cursor.fetchone()

        if existing:
            # Update existing
            cursor.execute(
                "UPDATE totp_secrets SET secret_key = %s, backup_codes = %s, updated_at = NOW() WHERE user_id = %s",
                (secret, backup_codes_str, user_id)
            )
        else:
            # Insert new
            cursor.execute(
                "INSERT INTO totp_secrets (user_id, secret_key, backup_codes) VALUES (%s, %s, %s)",
                (user_id, secret, backup_codes_str)
            )

        conn.commit()

        # Get user email for QR code
        cursor.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
        user_email = cursor.fetchone()['email']

        cursor.close()
        conn.close()

        # Generate QR code
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name='SkyWay Flight Booking'
        )

        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({
            "message": "2FA setup initiated",
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "backup_codes": backup_codes,
            "manual_entry_key": secret
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_2fa_bp.route('/verify', methods=['POST'])
def verify_2fa():
    """Verify TOTP code and enable 2FA"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        code = data.get('code')

        if not code:
            return jsonify({"error": "Code is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get secret
        cursor.execute("SELECT secret_key FROM totp_secrets WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "2FA not setup"}), 400

        secret = result['secret_key']

        # Verify code
        totp = pyotp.TOTP(secret)
        if not totp.verify(code, valid_window=1):
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid code"}), 400

        # Enable 2FA for user
        cursor.execute("UPDATE users SET is_2fa_enabled = TRUE WHERE user_id = %s", (user_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "2FA enabled successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_2fa_bp.route('/validate', methods=['POST'])
def validate_2fa():
    """Validate 2FA code during login"""
    try:
        data = request.json
        user_id = data.get('user_id')
        code = data.get('code')

        if not user_id or not code:
            return jsonify({"error": "User ID and code are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get secret and backup codes
        cursor.execute("SELECT secret_key, backup_codes FROM totp_secrets WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "2FA not setup"}), 400

        secret = result['secret_key']
        backup_codes = result['backup_codes'].split(',') if result['backup_codes'] else []

        # Verify TOTP code
        totp = pyotp.TOTP(secret)
        if totp.verify(code, valid_window=1):
            cursor.close()
            conn.close()
            return jsonify({"valid": True}), 200

        # Check backup codes
        if code.upper() in backup_codes:
            # Remove used backup code
            backup_codes.remove(code.upper())
            new_backup_codes = ','.join(backup_codes)
            cursor.execute(
                "UPDATE totp_secrets SET backup_codes = %s WHERE user_id = %s",
                (new_backup_codes, user_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"valid": True, "backup_code_used": True}), 200

        cursor.close()
        conn.close()
        return jsonify({"valid": False}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_2fa_bp.route('/disable', methods=['POST'])
def disable_2fa():
    """Disable 2FA for user"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json
        code = data.get('code')

        if not code:
            return jsonify({"error": "Code is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get secret
        cursor.execute("SELECT secret_key FROM totp_secrets WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "2FA not setup"}), 400

        secret = result['secret_key']

        # Verify code
        totp = pyotp.TOTP(secret)
        if not totp.verify(code, valid_window=1):
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid code"}), 400

        # Disable 2FA
        cursor.execute("UPDATE users SET is_2fa_enabled = FALSE WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM totp_secrets WHERE user_id = %s", (user_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "2FA disabled successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_2fa_bp.route('/status', methods=['GET'])
def get_2fa_status():
    """Get 2FA status for user"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT is_2fa_enabled FROM users WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if not result:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"enabled": bool(result['is_2fa_enabled'])}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
