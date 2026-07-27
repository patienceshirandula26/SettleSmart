from flask import Flask, jsonify
import pymysql
from config import Config

app = Flask(__name__)
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


if __name__ == "__main__":
    app.run(debug=True)