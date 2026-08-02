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

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    university = data.get("university")

    if not full_name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Full name, email and password are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))

            if cursor.fetchone():
                return jsonify({
                    "success": False,
                    "message": "An account with that email already exists"
                }), 409

            cursor.execute("""
                INSERT INTO users (full_name, email, password, university)
                VALUES (%s, %s, %s, %s)
            """, (full_name, email, password, university))

            connection.commit()

            cursor.execute("""
                SELECT user_id, full_name, email, university, arrival_date
                FROM users
                WHERE user_id = %s
            """, (cursor.lastrowid,))

            user = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "user": user
        }), 201

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

# ==========================================
# GET USER DOCUMENTS
# Returns all uploaded documents for a user
# ==========================================
@app.route("/api/documents/<int:user_id>", methods=["GET"])
def get_documents(user_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            sql = """
                SELECT
                    document_id,
                    document_name,
                    document_type,
                    status,
                    reference_number,
                    provider,
                    notes
                FROM documents
                WHERE user_id = %s
                ORDER BY document_name
            """

            cursor.execute(sql, (user_id,))

            documents = cursor.fetchall()

        return jsonify(documents)

    finally:
        connection.close()

# ==========================================
# ADD A NEW DOCUMENT
# Creates a document/card record for a user
# ==========================================
@app.route("/api/documents", methods=["POST"])
def add_document():

    data = request.get_json()

    user_id = data.get("user_id")
    document_name = data.get("document_name")
    document_type = data.get("document_type")
    status = data.get("status") or "Pending"
    reference_number = data.get("reference_number")
    provider = data.get("provider")
    notes = data.get("notes")

    if not user_id or not document_name:
        return jsonify({
            "success": False,
            "message": "user_id and document_name are required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO documents
                (user_id, document_name, document_type, status, reference_number, provider, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, document_name, document_type, status, reference_number, provider, notes))

            connection.commit()
            new_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Document added successfully.",
            "document_id": new_id
        }), 201

    finally:
        connection.close()

# ==========================================
# UPDATE A DOCUMENT'S STATUS
# ==========================================
@app.route("/api/documents/status/<int:document_id>", methods=["PUT"])
def update_document_status(document_id):

    data = request.get_json()
    status = data.get("status")

    if status not in ("Pending", "Completed", "Not Required"):
        return jsonify({
            "success": False,
            "message": "status must be Pending, Completed or Not Required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE documents
                SET status = %s
                WHERE document_id = %s
            """, (status, document_id))

            connection.commit()

        return jsonify({
            "success": True,
            "message": "Document status updated."
        })

    finally:
        connection.close()

# ==========================================
# GET ALL RESOURCES
# Returns settlement resources grouped by category
# ==========================================
@app.route("/api/resources", methods=["GET"])
def get_resources():

    # Connect to the database
    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            sql = """
                SELECT
                    r.resource_id,
                    r.resource_name,
                    r.description,
                    r.official_link,
                    c.category_name
                FROM resources r
                JOIN categories c
                    ON r.category_id = c.category_id
                ORDER BY c.category_name, r.resource_name
            """

            cursor.execute(sql)

            resources = cursor.fetchall()

        return jsonify(resources)

    finally:
        connection.close()

# ==========================================
# GET USER PROFILE
# Returns a single user's profile information
# ==========================================
@app.route("/api/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            sql = """
                SELECT
                    user_id,
                    full_name,
                    email,
                    university,
                    arrival_date,
                    created_at
                FROM users
                WHERE user_id = %s
            """

            cursor.execute(sql, (user_id,))

            user = cursor.fetchone()

        if user:
            return jsonify(user)

        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    finally:
        connection.close()

# ==========================================
# UPDATE USER PROFILE
# Lets a logged-in user edit their own details
# ==========================================
@app.route("/api/profile/<int:user_id>", methods=["PUT"])
def update_profile(user_id):

    data = request.get_json()

    full_name = data.get("full_name")
    university = data.get("university")
    arrival_date = data.get("arrival_date") or None

    if not full_name:
        return jsonify({
            "success": False,
            "message": "Full name is required"
        }), 400

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET full_name = %s,
                    university = %s,
                    arrival_date = %s
                WHERE user_id = %s
            """, (full_name, university, arrival_date, user_id))

            connection.commit()

            cursor.execute("""
                SELECT user_id, full_name, email, university, arrival_date, created_at
                FROM users
                WHERE user_id = %s
            """, (user_id,))

            user = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully.",
            "user": user
        })

    finally:
        connection.close()


if __name__ == "__main__":
    app.run(debug=True)