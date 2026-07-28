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

# ==========================================
# GET ALL TASKS
# Returns all settlement checklist tasks
# ==========================================
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    # Connect to the database
    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            # Retrieve all tasks together with their category names
            sql = """
                SELECT
                    t.task_id,
                    t.task_name,
                    t.description,
                    t.estimated_time,
                    t.official_link,
                    c.category_name
                FROM tasks t
                JOIN categories c
                    ON t.category_id = c.category_id
                ORDER BY c.category_name, t.task_name
            """

            cursor.execute(sql)

            tasks = cursor.fetchall()

        # Return the task list as JSON
        return jsonify(tasks)

    finally:
        # Always close the database connection
        connection.close()

# ==========================================
# UPDATE TASK STATUS
# Updates a user's checklist progress
# ==========================================
@app.route("/api/tasks/update", methods=["PUT"])
def update_task_status():

    # Get JSON data sent from the frontend
    data = request.get_json()

    user_id = data.get("user_id")
    task_id = data.get("task_id")
    status = data.get("status")
    notes = data.get("notes")

    # Connect to the database
    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            # Check whether this task already exists for the user
            cursor.execute("""
                SELECT user_task_id
                FROM user_tasks
                WHERE user_id=%s AND task_id=%s
            """, (user_id, task_id))

            existing = cursor.fetchone()

            # If it exists, update it
            if existing:

                cursor.execute("""
                    UPDATE user_tasks
                    SET status=%s,
                        notes=%s
                    WHERE user_id=%s
                    AND task_id=%s
                """, (status, notes, user_id, task_id))

            # Otherwise create a new record
            else:

                cursor.execute("""
                    INSERT INTO user_tasks
                    (user_id, task_id, status, notes)
                    VALUES (%s,%s,%s,%s)
                """, (user_id, task_id, status, notes))

            # Save changes
            connection.commit()

        return jsonify({
            "success": True,
            "message": "Task updated successfully."
        })

    finally:
        connection.close()

if __name__ == "__main__":
    app.run(debug=True)