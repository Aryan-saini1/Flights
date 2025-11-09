from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from db import get_db_connection
from routes.users import users_bp
from routes.admins import admins_bp
from routes.airports import airports_bp
from routes.flights import flights_bp
from routes.payments import payments_bp
from routes.auth_2fa import auth_2fa_bp
from routes.password_reset import password_reset_bp
from routes.profile import profile_bp
from routes.bookings_enhanced import bookings_enhanced_bp
from routes.tickets_enhanced import tickets_enhanced_bp
from routes.admin_dashboard import admin_dashboard_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

app.register_blueprint(users_bp)
app.register_blueprint(admins_bp)
app.register_blueprint(airports_bp)
app.register_blueprint(flights_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(auth_2fa_bp)
app.register_blueprint(password_reset_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(bookings_enhanced_bp)
app.register_blueprint(tickets_enhanced_bp)
app.register_blueprint(admin_dashboard_bp)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, port=port)
