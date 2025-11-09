from flask import Blueprint, request, jsonify
from db import get_db_connection
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps

admin_dashboard_bp = Blueprint('admin_dashboard', __name__, url_prefix='/api/admin/dashboard')

SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization required"}), 401

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            if not payload.get('is_admin', False):
                return jsonify({"error": "Admin access required"}), 403
        except:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated_function

@admin_dashboard_bp.route('/stats', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Get overall statistics for admin dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Total users
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()['total']

        # Total bookings
        cursor.execute("SELECT COUNT(*) as total FROM bookings")
        total_bookings = cursor.fetchone()['total']

        # Total revenue
        cursor.execute("SELECT SUM(amount) as total FROM payments WHERE status = 'SUCCESS'")
        total_revenue = cursor.fetchone()['total'] or 0

        # Active bookings
        cursor.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'CONFIRMED'")
        active_bookings = cursor.fetchone()['total']

        # Cancelled bookings
        cursor.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'CANCELLED'")
        cancelled_bookings = cursor.fetchone()['total']

        # Total flights
        cursor.execute("SELECT COUNT(*) as total FROM flights")
        total_flights = cursor.fetchone()['total']

        # Total airports
        cursor.execute("SELECT COUNT(*) as total FROM airports")
        total_airports = cursor.fetchone()['total']

        # Recent bookings (last 7 days)
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM bookings
            WHERE booking_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        """)
        recent_bookings = cursor.fetchone()['total']

        # Revenue this month
        cursor.execute("""
            SELECT SUM(amount) as total
            FROM payments
            WHERE status = 'SUCCESS'
            AND MONTH(payment_time) = MONTH(CURRENT_DATE())
            AND YEAR(payment_time) = YEAR(CURRENT_DATE())
        """)
        monthly_revenue = cursor.fetchone()['total'] or 0

        cursor.close()
        conn.close()

        return jsonify({
            "stats": {
                "users": {
                    "total": total_users
                },
                "bookings": {
                    "total": total_bookings,
                    "active": active_bookings,
                    "cancelled": cancelled_bookings,
                    "recent_week": recent_bookings
                },
                "revenue": {
                    "total": float(total_revenue),
                    "monthly": float(monthly_revenue)
                },
                "flights": total_flights,
                "airports": total_airports
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_dashboard_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT user_id, name, email, phone, created_at, is_2fa_enabled
            FROM users
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        users = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) as total FROM users")
        total = cursor.fetchone()['total']

        cursor.close()
        conn.close()

        return jsonify({
            "users": [{
                "user_id": u['user_id'],
                "name": u['name'],
                "email": u['email'],
                "phone": u['phone'],
                "created_at": u['created_at'].isoformat() if u['created_at'] else None,
                "is_2fa_enabled": bool(u['is_2fa_enabled'])
            } for u in users],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_dashboard_bp.route('/bookings', methods=['GET'])
@admin_required
def get_all_bookings():
    """Get all bookings with filters"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        status = request.args.get('status')
        offset = (page - 1) * limit

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT b.booking_id, b.user_id, b.booking_time, b.status,
                   u.name as user_name, u.email as user_email,
                   COUNT(DISTINCT t.ticket_id) as ticket_count,
                   p.amount, p.payment_method, p.status as payment_status
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            LEFT JOIN tickets t ON b.booking_id = t.booking_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
        """

        if status:
            query += " WHERE b.status = %s"
            cursor.execute(query + " GROUP BY b.booking_id ORDER BY b.booking_time DESC LIMIT %s OFFSET %s",
                          (status, limit, offset))
        else:
            cursor.execute(query + " GROUP BY b.booking_id ORDER BY b.booking_time DESC LIMIT %s OFFSET %s",
                          (limit, offset))

        bookings = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "bookings": [{
                "booking_id": b['booking_id'],
                "user": {
                    "user_id": b['user_id'],
                    "name": b['user_name'],
                    "email": b['user_email']
                },
                "booking_time": b['booking_time'].isoformat() if b['booking_time'] else None,
                "status": b['status'],
                "ticket_count": b['ticket_count'],
                "payment": {
                    "amount": float(b['amount']) if b['amount'] else 0,
                    "method": b['payment_method'],
                    "status": b['payment_status']
                } if b['amount'] else None
            } for b in bookings]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_dashboard_bp.route('/analytics/revenue', methods=['GET'])
@admin_required
def get_revenue_analytics():
    """Get revenue analytics by date range"""
    try:
        days = int(request.args.get('days', 30))

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DATE(payment_time) as date, SUM(amount) as revenue, COUNT(*) as transactions
            FROM payments
            WHERE status = 'SUCCESS'
            AND payment_time >= DATE_SUB(NOW(), INTERVAL %s DAY)
            GROUP BY DATE(payment_time)
            ORDER BY date DESC
        """, (days,))

        data = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "analytics": [{
                "date": d['date'].isoformat() if d['date'] else None,
                "revenue": float(d['revenue']),
                "transactions": d['transactions']
            } for d in data]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_dashboard_bp.route('/analytics/popular-routes', methods=['GET'])
@admin_required
def get_popular_routes():
    """Get most popular routes"""
    try:
        limit = int(request.args.get('limit', 10))

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                f.flight_id, f.flight_number, f.airline,
                src.code as source_code, src.city as source_city,
                dst.code as dest_code, dst.city as dest_city,
                COUNT(t.ticket_id) as booking_count,
                SUM(p.amount) as total_revenue
            FROM tickets t
            JOIN flights f ON t.flight_id = f.flight_id
            JOIN airports src ON f.source_airport_id = src.airport_id
            JOIN airports dst ON f.destination_airport_id = dst.airport_id
            JOIN bookings b ON t.booking_id = b.booking_id
            LEFT JOIN payments p ON b.booking_id = p.booking_id
            WHERE b.status = 'CONFIRMED'
            GROUP BY f.flight_id
            ORDER BY booking_count DESC
            LIMIT %s
        """, (limit,))

        routes = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "popular_routes": [{
                "flight_number": r['flight_number'],
                "airline": r['airline'],
                "route": f"{r['source_code']} → {r['dest_code']}",
                "source": {"code": r['source_code'], "city": r['source_city']},
                "destination": {"code": r['dest_code'], "city": r['dest_city']},
                "bookings": r['booking_count'],
                "revenue": float(r['total_revenue']) if r['total_revenue'] else 0
            } for r in routes]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
