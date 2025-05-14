from flask import Flask
from flask_cors import CORS
from db import get_db_connection
from routes.users import users_bp
from routes.admins import admins_bp
from routes.airports import airports_bp
from routes.flights import flights_bp
from routes.bookings import bookings_bp
from routes.tickets import tickets_bp
from routes.payments import payments_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(users_bp)
app.register_blueprint(admins_bp)
app.register_blueprint(airports_bp)
app.register_blueprint(flights_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(tickets_bp)
app.register_blueprint(payments_bp)

if __name__ == "__main__":
    app.run(debug=True, port=8000)
