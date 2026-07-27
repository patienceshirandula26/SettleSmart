from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
from config import Config

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)


def get_connection():
    return pymysql.connect(
        host=app.config["MYSQL_HOST"],
        user=app.config["MYSQL_USER"],
        password=app.config["MYSQL_PASSWORD"],
        database=app.config["MYSQL_DB"],
        cursorclass=pymysql.cursors.DictCursor
    )


@app.route("/")
def home():
    return "Welcome to SettleSmart Backend!"


@app.route("/api/users")
def get_users():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
    SELECT user_id, full_name, email, university, arrival_date, created_at
    FROM users
""")
            users = cursor.fetchall()

        return jsonify(users)

    finally:
        connection.close()

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id, full_name, email, university, arrival_date
                FROM users
                WHERE email = %s AND password = %s
                """,
                (email, password)
            )

            user = cursor.fetchone()

        if user:
            return jsonify({
                "success": True,
                "message": "Login successful",
                "user": user
            })

        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    finally:
        connection.close()

if __name__ == "__main__":
    app.run(debug=True)