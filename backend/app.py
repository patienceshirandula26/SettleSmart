"""SettleSmart REST API.

Run the database setup once:   python3 backend/init_db.py
Then start the server with:    python3 backend/app.py

The server also serves the frontend, so opening http://localhost:5000
is enough to use the whole application.
"""

import os
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from config import BASE_DIR, Config
from db import get_connection
from provisioning import log_activity, provision_user

FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)
app.config.from_object(Config)

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


# =============================================================
# Helpers
# =============================================================

def to_json(value):
    """Turn database rows into something JSON-friendly.

    Dates become "2026-08-04" style strings, which JavaScript can read
    directly, instead of Flask's default RFC-1123 format.
    """
    if isinstance(value, list):
        return [to_json(item) for item in value]

    if isinstance(value, dict):
        return {key: to_json(item) for key, item in value.items()}

    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="seconds")

    if isinstance(value, date):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    return value


def ok(payload=None, **extra):
    """Standard success response."""
    body = {"success": True}

    if payload is not None:
        body.update(payload)

    body.update(extra)
    return jsonify(to_json(body))


def fail(message, status=400):
    """Standard error response."""
    return jsonify({"success": False, "message": message}), status


def percentage(done, total):
    if not total:
        return 0

    return round(done / total * 100)


def allowed_file(filename):
    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in app.config["ALLOWED_EXTENSIONS"]


def parse_date(value):
    """Read a YYYY-MM-DD string from the frontend, or None."""
    if not value:
        return None

    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def check_password_strength(password, full_name=None, email=None):
    """Return an error message if the password isn't strong enough, else None.

    Enforced on the server, not just in the browser, so the rules can't be
    skipped by editing the page or calling the API directly.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long"

    if not any(character.isalpha() for character in password):
        return "Password must include at least one letter"

    if not any(character.isdigit() for character in password):
        return "Password must include at least one number"

    lowered = password.lower()

    # Blocks the passwords people actually pick, which are the ones that
    # get guessed first in a real attack.
    common = {
        "password", "password1", "12345678", "123456789", "qwerty123",
        "letmein1", "welcome1", "abc12345", "iloveyou", "settlesmart",
        "australia", "student1"
    }

    if lowered in common:
        return "That password is too common — please choose another"

    # A password built from your own name or email is just as easy to guess.
    if email:
        local_part = email.split("@")[0].lower()
        if len(local_part) > 3 and local_part in lowered:
            return "Password must not contain your email address"

    if full_name:
        for part in full_name.lower().split():
            if len(part) > 3 and part in lowered:
                return "Password must not contain your name"

    return None


def public_user(row):
    """A user record with the password hash stripped out."""
    if not row:
        return None

    return {key: value for key, value in row.items() if key != "password_hash"}


def fetch_user(cursor, user_id):
    cursor.execute("""
        SELECT user_id, full_name, email, university, phone, home_country,
               arrival_date, created_at
        FROM users
        WHERE user_id = %s
    """, (user_id,))

    return cursor.fetchone()


@app.errorhandler(413)
def file_too_large(_error):
    return fail("That file is larger than the 10 MB limit.", 413)


# =============================================================
# Frontend
# =============================================================

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/health")
def health():
    return ok({"message": "SettleSmart backend is running"})


# =============================================================
# Accounts
# =============================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    university = (data.get("university") or "").strip() or None
    arrival_date = parse_date(data.get("arrival_date"))

    if not full_name or not email or not password:
        return fail("Full name, email and password are required")

    weakness = check_password_strength(password, full_name, email)
    if weakness:
        return fail(weakness)

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))

            if cursor.fetchone():
                return fail("An account with that email already exists", 409)

            cursor.execute("""
                INSERT INTO users (full_name, email, password_hash, university, arrival_date)
                VALUES (%s, %s, %s, %s, %s)
            """, (full_name, email, generate_password_hash(password), university, arrival_date))

            user_id = cursor.lastrowid

            # Give the new student their own checklist, documents and reminders
            # so the dashboard has real data from the very first visit.
            provision_user(cursor, user_id, arrival_date, is_new=True)

            user = fetch_user(cursor, user_id)

        connection.commit()

        return ok({"message": "Account created successfully", "user": user}), 201

    finally:
        connection.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT user_id, full_name, email, password_hash, university,
                       phone, home_country, arrival_date, created_at
                FROM users
                WHERE email = %s
            """, (email,))

            user = cursor.fetchone()

            if not user or not check_password_hash(user["password_hash"], password):
                return fail("Invalid email or password", 401)

            # Older accounts may pre-date a feature, so top up anything missing.
            provision_user(cursor, user["user_id"], user["arrival_date"])

        connection.commit()

        return ok({"message": "Login successful", "user": public_user(user)})

    finally:
        connection.close()


@app.route("/api/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            user = fetch_user(cursor, user_id)

        if not user:
            return fail("User not found", 404)

        return jsonify(to_json(user))

    finally:
        connection.close()


@app.route("/api/profile/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json(silent=True) or {}

    full_name = (data.get("full_name") or "").strip()
    university = (data.get("university") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None
    home_country = (data.get("home_country") or "").strip() or None
    arrival_date = parse_date(data.get("arrival_date"))

    if not full_name:
        return fail("Full name is required")

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET full_name = %s,
                    university = %s,
                    phone = %s,
                    home_country = %s,
                    arrival_date = %s
                WHERE user_id = %s
            """, (full_name, university, phone, home_country, arrival_date, user_id))

            if cursor.rowcount == 0 and not fetch_user(cursor, user_id):
                return fail("User not found", 404)

            log_activity(cursor, user_id, "profile", "Profile details updated")

            user = fetch_user(cursor, user_id)

        connection.commit()

        return ok({"message": "Profile updated successfully.", "user": user})

    finally:
        connection.close()


@app.route("/api/profile/<int:user_id>/password", methods=["PUT"])
def change_password(user_id):
    data = request.get_json(silent=True) or {}

    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT full_name, email, password_hash FROM users WHERE user_id = %s",
                (user_id,)
            )
            row = cursor.fetchone()

            if not row:
                return fail("User not found", 404)

            if not check_password_hash(row["password_hash"], current_password):
                return fail("Your current password is not correct", 401)

            weakness = check_password_strength(
                new_password, row["full_name"], row["email"]
            )
            if weakness:
                return fail(weakness)

            if check_password_hash(row["password_hash"], new_password):
                return fail("Your new password must be different from the old one")

            cursor.execute(
                "UPDATE users SET password_hash = %s WHERE user_id = %s",
                (generate_password_hash(new_password), user_id)
            )

            log_activity(cursor, user_id, "account", "Password changed")

        connection.commit()

        return ok({"message": "Password updated successfully."})

    finally:
        connection.close()


# =============================================================
# Dashboard
# =============================================================

@app.route("/api/dashboard/<int:user_id>", methods=["GET"])
def get_dashboard(user_id):
    """Everything the dashboard page needs, in one request."""
    today = date.today()
    soon = today + timedelta(days=7)

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            user = fetch_user(cursor, user_id)

            if not user:
                return fail("User not found", 404)

            # ---- Overall checklist progress ----
            cursor.execute("""
                SELECT status, COUNT(*) AS total
                FROM user_tasks
                WHERE user_id = %s
                GROUP BY status
            """, (user_id,))

            counts = {row["status"]: row["total"] for row in cursor.fetchall()}

            completed = counts.get("Completed", 0)
            in_progress = counts.get("In Progress", 0)
            not_started = counts.get("Not Started", 0)
            total_tasks = completed + in_progress + not_started

            # ---- Progress per settlement category ----
            cursor.execute("""
                SELECT
                    c.category_id,
                    c.category_name,
                    c.description,
                    c.emoji,
                    COUNT(ut.user_task_id) AS total,
                    SUM(ut.status = 'Completed') AS completed
                FROM categories c
                JOIN tasks t      ON t.category_id = c.category_id
                JOIN user_tasks ut ON ut.task_id = t.task_id AND ut.user_id = %s
                GROUP BY c.category_id, c.category_name, c.description, c.emoji, c.sort_order
                ORDER BY c.sort_order
            """, (user_id,))

            categories = []

            for row in cursor.fetchall():
                done = int(row["completed"] or 0)
                categories.append({
                    "category_id": row["category_id"],
                    "category_name": row["category_name"],
                    "description": row["description"],
                    "emoji": row["emoji"],
                    "total": row["total"],
                    "completed": done,
                    "percent": percentage(done, row["total"])
                })

            # ---- Tasks still to do, most urgent first ----
            cursor.execute("""
                SELECT
                    t.task_id,
                    t.task_name,
                    t.description,
                    t.priority,
                    t.official_link,
                    c.category_name,
                    ut.status,
                    ut.due_date
                FROM user_tasks ut
                JOIN tasks t      ON t.task_id = ut.task_id
                JOIN categories c ON c.category_id = t.category_id
                WHERE ut.user_id = %s AND ut.status <> 'Completed'
                ORDER BY
                    FIELD(t.priority, 'High', 'Medium', 'Low'),
                    ut.due_date IS NULL,
                    ut.due_date
                LIMIT 6
            """, (user_id,))

            pending_tasks = []

            for row in cursor.fetchall():
                due = row["due_date"]
                pending_tasks.append({
                    **row,
                    "is_urgent": bool(due and due <= soon)
                })

            # ---- Documents ----
            cursor.execute("""
                SELECT
                    COUNT(*) AS total,
                    SUM(stored_name IS NOT NULL) AS uploaded,
                    SUM(status = 'Pending') AS pending
                FROM documents
                WHERE user_id = %s
            """, (user_id,))

            documents = cursor.fetchone() or {}

            # ---- Reminders coming up ----
            cursor.execute("""
                SELECT reminder_id, title, reminder_date, category
                FROM reminders
                WHERE user_id = %s AND is_done = 0 AND reminder_date >= %s
                ORDER BY reminder_date
                LIMIT 5
            """, (user_id, today))

            reminders = []

            for row in cursor.fetchall():
                days_away = (row["reminder_date"] - today).days
                reminders.append({
                    **row,
                    "days_away": days_away,
                    "urgency": "red" if days_away <= 3 else "amber" if days_away <= 10 else "green"
                })

            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM reminders
                WHERE user_id = %s AND is_done = 0 AND reminder_date >= %s
            """, (user_id, today))

            upcoming_reminders = cursor.fetchone()["total"]

            # ---- Recent activity ----
            cursor.execute("""
                SELECT activity_type, title, created_at
                FROM activity_log
                WHERE user_id = %s
                ORDER BY created_at DESC, activity_id DESC
                LIMIT 6
            """, (user_id,))

            activity = cursor.fetchall()

            # ---- Featured official links ----
            cursor.execute("""
                SELECT resource_name, description, official_link, emoji
                FROM resources
                ORDER BY resource_id
                LIMIT 3
            """)

            featured_resources = cursor.fetchall()

            # Anything overdue or due within a week needs attention.
            attention = sum(
                1 for task in pending_tasks
                if task["due_date"] and task["due_date"] <= soon
            )

        return jsonify(to_json({
            "user": user,
            "progress": {
                "completed": completed,
                "in_progress": in_progress,
                "remaining": total_tasks - completed,
                "total": total_tasks,
                "percent": percentage(completed, total_tasks)
            },
            "stats": {
                "completed_tasks": completed,
                "pending_tasks": total_tasks - completed,
                "upcoming_reminders": upcoming_reminders,
                "documents_uploaded": int(documents.get("uploaded") or 0),
                "documents_total": int(documents.get("total") or 0),
                "documents_pending": int(documents.get("pending") or 0)
            },
            "categories": categories,
            "pending_tasks": pending_tasks,
            "reminders": reminders,
            "activity": activity,
            "resources": featured_resources,
            "attention_count": attention
        }))

    finally:
        connection.close()


# =============================================================
# Settlement checklist
# =============================================================

@app.route("/api/checklist/<int:user_id>", methods=["GET"])
def get_checklist(user_id):
    """The full checklist for one user, grouped by category."""
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    c.category_id,
                    c.category_name,
                    c.emoji,
                    t.task_id,
                    t.task_name,
                    t.description,
                    t.estimated_time,
                    t.official_link,
                    t.priority,
                    ut.status,
                    ut.due_date,
                    ut.completed_date,
                    ut.notes
                FROM tasks t
                JOIN categories c  ON c.category_id = t.category_id
                LEFT JOIN user_tasks ut
                       ON ut.task_id = t.task_id AND ut.user_id = %s
                ORDER BY c.sort_order, t.sort_order, t.task_id
            """, (user_id,))

            groups = {}

            for row in cursor.fetchall():
                category_id = row["category_id"]

                if category_id not in groups:
                    groups[category_id] = {
                        "category_id": category_id,
                        "category_name": row["category_name"],
                        "emoji": row["emoji"],
                        "tasks": []
                    }

                groups[category_id]["tasks"].append({
                    "task_id": row["task_id"],
                    "task_name": row["task_name"],
                    "description": row["description"],
                    "estimated_time": row["estimated_time"],
                    "official_link": row["official_link"],
                    "priority": row["priority"],
                    "status": row["status"] or "Not Started",
                    "due_date": row["due_date"],
                    "completed_date": row["completed_date"],
                    "notes": row["notes"]
                })

            result = []

            for group in groups.values():
                done = sum(1 for task in group["tasks"] if task["status"] == "Completed")
                group["completed"] = done
                group["total"] = len(group["tasks"])
                group["percent"] = percentage(done, group["total"])
                result.append(group)

        return jsonify(to_json(result))

    finally:
        connection.close()


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    """The master task list, without any user progress attached."""
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT t.task_id, t.task_name, t.description, t.estimated_time,
                       t.official_link, t.priority, c.category_name
                FROM tasks t
                JOIN categories c ON c.category_id = t.category_id
                ORDER BY c.sort_order, t.sort_order
            """)

            return jsonify(to_json(cursor.fetchall()))

    finally:
        connection.close()


@app.route("/api/tasks/update", methods=["PUT"])
def update_task_status():
    """Tick a checklist task off (or put it back)."""
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    task_id = data.get("task_id")
    status = data.get("status")
    notes = data.get("notes")

    if not user_id or not task_id:
        return fail("user_id and task_id are required")

    if status not in ("Not Started", "In Progress", "Completed"):
        return fail("status must be Not Started, In Progress or Completed")

    completed_date = date.today() if status == "Completed" else None

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT ut.status, t.task_name
                FROM tasks t
                LEFT JOIN user_tasks ut
                       ON ut.task_id = t.task_id AND ut.user_id = %s
                WHERE t.task_id = %s
            """, (user_id, task_id))

            existing = cursor.fetchone()

            if not existing:
                return fail("Task not found", 404)

            # One row per user per task, so this both inserts and updates.
            cursor.execute("""
                INSERT INTO user_tasks (user_id, task_id, status, completed_date, notes)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    completed_date = VALUES(completed_date),
                    notes = COALESCE(VALUES(notes), notes)
            """, (user_id, task_id, status, completed_date, notes))

            if status == "Completed" and existing["status"] != "Completed":
                log_activity(cursor, user_id, "task", f"{existing['task_name']} completed")

            # Send back the fresh totals so the page can update its counters.
            cursor.execute("""
                SELECT COUNT(*) AS total, SUM(status = 'Completed') AS completed
                FROM user_tasks
                WHERE user_id = %s
            """, (user_id,))

            totals = cursor.fetchone()

        connection.commit()

        completed = int(totals["completed"] or 0)

        return ok({
            "message": "Task updated successfully.",
            "progress": {
                "completed": completed,
                "total": totals["total"],
                "percent": percentage(completed, totals["total"])
            }
        })

    finally:
        connection.close()


# =============================================================
# Documents
# =============================================================

def _document_row(cursor, document_id):
    cursor.execute("""
        SELECT document_id, user_id, document_name, document_type, status,
               reference_number, provider, notes, file_name, stored_name,
               file_size, mime_type, expiry_date, uploaded_at, created_at
        FROM documents
        WHERE document_id = %s
    """, (document_id,))

    return cursor.fetchone()


@app.route("/api/documents/<int:user_id>", methods=["GET"])
def get_documents(user_id):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT document_id, document_name, document_type, status,
                       reference_number, provider, notes, file_name, stored_name,
                       file_size, mime_type, expiry_date, uploaded_at, created_at
                FROM documents
                WHERE user_id = %s
                ORDER BY document_type, document_name
            """, (user_id,))

            documents = []

            for row in cursor.fetchall():
                row["has_file"] = row["stored_name"] is not None
                row.pop("stored_name")
                documents.append(row)

        return jsonify(to_json(documents))

    finally:
        connection.close()


@app.route("/api/documents", methods=["POST"])
def add_document():
    """Create a document record. The file itself is optional.

    Accepts either JSON or a multipart form with a `file` field, so the
    same endpoint handles "just track this document" and "upload it now".
    """
    if request.files.get("file") or request.form:
        data = request.form
        upload = request.files.get("file")
    else:
        data = request.get_json(silent=True) or {}
        upload = None

    user_id = data.get("user_id")
    document_name = (data.get("document_name") or "").strip()
    document_type = (data.get("document_type") or "").strip() or None
    status = data.get("status") or "Pending"
    reference_number = (data.get("reference_number") or "").strip() or None
    provider = (data.get("provider") or "").strip() or None
    notes = (data.get("notes") or "").strip() or None
    expiry_date = parse_date(data.get("expiry_date"))

    if not user_id or not document_name:
        return fail("user_id and document_name are required")

    if status not in ("Pending", "Completed", "Not Required"):
        return fail("status must be Pending, Completed or Not Required")

    stored = None

    if upload and upload.filename:
        stored = _save_upload(user_id, upload)

        if isinstance(stored, tuple):  # an error response
            return stored

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO documents
                    (user_id, document_name, document_type, status, reference_number,
                     provider, notes, expiry_date, file_name, stored_name,
                     file_size, mime_type, uploaded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id, document_name, document_type, status, reference_number,
                provider, notes, expiry_date,
                stored["file_name"] if stored else None,
                stored["stored_name"] if stored else None,
                stored["file_size"] if stored else None,
                stored["mime_type"] if stored else None,
                datetime.now() if stored else None
            ))

            document_id = cursor.lastrowid

            action = "uploaded" if stored else "added"
            log_activity(cursor, user_id, "document", f"{document_name} {action}")

            document = _document_row(cursor, document_id)

        connection.commit()

        document["has_file"] = document["stored_name"] is not None
        document.pop("stored_name")

        return ok({"message": "Document saved.", "document": document}), 201

    finally:
        connection.close()


def _save_upload(user_id, upload):
    """Write an uploaded file to disk and describe it for the database."""
    if not allowed_file(upload.filename):
        allowed = ", ".join(sorted(app.config["ALLOWED_EXTENSIONS"]))
        return fail(f"That file type isn't supported. Allowed types: {allowed}")

    original_name = secure_filename(upload.filename)
    extension = original_name.rsplit(".", 1)[1].lower()

    # Store under a unique name so two files called "passport.pdf" can't clash.
    stored_name = f"{uuid.uuid4().hex}.{extension}"

    user_folder = os.path.join(app.config["UPLOAD_FOLDER"], str(user_id))
    os.makedirs(user_folder, exist_ok=True)

    destination = os.path.join(user_folder, stored_name)
    upload.save(destination)

    return {
        "file_name": original_name,
        "stored_name": stored_name,
        "file_size": os.path.getsize(destination),
        "mime_type": upload.mimetype
    }


@app.route("/api/documents/<int:document_id>/upload", methods=["POST"])
def upload_document_file(document_id):
    """Attach a file to a document that is already on the student's list."""
    upload = request.files.get("file")

    if not upload or not upload.filename:
        return fail("No file was selected")

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            document = _document_row(cursor, document_id)

            if not document:
                return fail("Document not found", 404)

            stored = _save_upload(document["user_id"], upload)

            if isinstance(stored, tuple):  # an error response
                return stored

            previous = document["stored_name"]

            cursor.execute("""
                UPDATE documents
                SET file_name = %s,
                    stored_name = %s,
                    file_size = %s,
                    mime_type = %s,
                    status = 'Completed',
                    uploaded_at = %s
                WHERE document_id = %s
            """, (
                stored["file_name"], stored["stored_name"], stored["file_size"],
                stored["mime_type"], datetime.now(), document_id
            ))

            log_activity(
                cursor, document["user_id"], "document",
                f"{document['document_name']} uploaded"
            )

            updated = _document_row(cursor, document_id)

        connection.commit()

        # Replacing a file leaves the old one behind, so clean it up.
        if previous and previous != stored["stored_name"]:
            _delete_file(document["user_id"], previous)

        updated["has_file"] = True
        updated.pop("stored_name")

        return ok({"message": "File uploaded.", "document": updated})

    finally:
        connection.close()


def _delete_file(user_id, stored_name):
    path = os.path.join(app.config["UPLOAD_FOLDER"], str(user_id), stored_name)

    if os.path.exists(path):
        os.remove(path)


@app.route("/api/documents/file/<int:document_id>", methods=["GET"])
def download_document(document_id):
    """Open or download the file attached to a document."""
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            document = _document_row(cursor, document_id)
    finally:
        connection.close()

    if not document or not document["stored_name"]:
        return fail("No file has been uploaded for this document", 404)

    path = os.path.join(
        app.config["UPLOAD_FOLDER"], str(document["user_id"]), document["stored_name"]
    )

    if not os.path.exists(path):
        return fail("The stored file is missing from the server", 404)

    return send_file(
        path,
        download_name=document["file_name"],
        mimetype=document["mime_type"] or "application/octet-stream",
        as_attachment=request.args.get("download") == "1"
    )


@app.route("/api/documents/<int:document_id>", methods=["PUT"])
def update_document(document_id):
    """Edit a document's details or change its status."""
    data = request.get_json(silent=True) or {}

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            document = _document_row(cursor, document_id)

            if not document:
                return fail("Document not found", 404)

            status = data.get("status", document["status"])

            if status not in ("Pending", "Completed", "Not Required"):
                return fail("status must be Pending, Completed or Not Required")

            document_name = (data.get("document_name") or document["document_name"]).strip()

            cursor.execute("""
                UPDATE documents
                SET document_name = %s,
                    document_type = %s,
                    status = %s,
                    reference_number = %s,
                    provider = %s,
                    notes = %s,
                    expiry_date = %s
                WHERE document_id = %s
            """, (
                document_name,
                data.get("document_type", document["document_type"]),
                status,
                data.get("reference_number", document["reference_number"]),
                data.get("provider", document["provider"]),
                data.get("notes", document["notes"]),
                parse_date(data.get("expiry_date")) or document["expiry_date"],
                document_id
            ))

            if status != document["status"] and status == "Completed":
                log_activity(
                    cursor, document["user_id"], "document",
                    f"{document_name} marked as verified"
                )

            updated = _document_row(cursor, document_id)

        connection.commit()

        updated["has_file"] = updated["stored_name"] is not None
        updated.pop("stored_name")

        return ok({"message": "Document updated.", "document": updated})

    finally:
        connection.close()


@app.route("/api/documents/status/<int:document_id>", methods=["PUT"])
def update_document_status(document_id):
    """Kept so older frontend code that only changes status still works."""
    return update_document(document_id)


@app.route("/api/documents/<int:document_id>", methods=["DELETE"])
def delete_document(document_id):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            document = _document_row(cursor, document_id)

            if not document:
                return fail("Document not found", 404)

            cursor.execute("DELETE FROM documents WHERE document_id = %s", (document_id,))

        connection.commit()

        if document["stored_name"]:
            _delete_file(document["user_id"], document["stored_name"])

        return ok({"message": "Document deleted."})

    finally:
        connection.close()


# =============================================================
# Reminders
# =============================================================

@app.route("/api/reminders/<int:user_id>", methods=["GET"])
def get_reminders(user_id):
    today = date.today()

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT reminder_id, title, reminder_date, category, notes,
                       is_done, task_id, created_at
                FROM reminders
                WHERE user_id = %s
                ORDER BY is_done, reminder_date
            """, (user_id,))

            reminders = []

            for row in cursor.fetchall():
                days_away = (row["reminder_date"] - today).days
                row["is_done"] = bool(row["is_done"])
                row["days_away"] = days_away
                row["is_overdue"] = days_away < 0 and not row["is_done"]
                reminders.append(row)

        return jsonify(to_json(reminders))

    finally:
        connection.close()


@app.route("/api/reminders", methods=["POST"])
def add_reminder():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    title = (data.get("title") or "").strip()
    reminder_date = parse_date(data.get("reminder_date"))
    category = (data.get("category") or "").strip() or None
    notes = (data.get("notes") or "").strip() or None

    if not user_id or not title or not reminder_date:
        return fail("user_id, title and reminder_date are required")

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reminders (user_id, title, reminder_date, category, notes)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, title, reminder_date, category, notes))

            reminder_id = cursor.lastrowid
            log_activity(cursor, user_id, "reminder", f"Reminder created for {title}")

        connection.commit()

        return ok({"message": "Reminder created.", "reminder_id": reminder_id}), 201

    finally:
        connection.close()


@app.route("/api/reminders/<int:reminder_id>", methods=["PUT"])
def update_reminder(reminder_id):
    data = request.get_json(silent=True) or {}

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM reminders WHERE reminder_id = %s", (reminder_id,)
            )
            reminder = cursor.fetchone()

            if not reminder:
                return fail("Reminder not found", 404)

            title = (data.get("title") or reminder["title"]).strip()
            reminder_date = parse_date(data.get("reminder_date")) or reminder["reminder_date"]
            category = data.get("category", reminder["category"])
            notes = data.get("notes", reminder["notes"])
            is_done = int(bool(data.get("is_done", reminder["is_done"])))

            cursor.execute("""
                UPDATE reminders
                SET title = %s, reminder_date = %s, category = %s, notes = %s, is_done = %s
                WHERE reminder_id = %s
            """, (title, reminder_date, category, notes, is_done, reminder_id))

        connection.commit()

        return ok({"message": "Reminder updated."})

    finally:
        connection.close()


@app.route("/api/reminders/<int:reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM reminders WHERE reminder_id = %s", (reminder_id,))

            if cursor.rowcount == 0:
                return fail("Reminder not found", 404)

        connection.commit()

        return ok({"message": "Reminder deleted."})

    finally:
        connection.close()


# =============================================================
# Resources, categories, activity and settings
# =============================================================

@app.route("/api/resources", methods=["GET"])
def get_resources():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT r.resource_id, r.resource_name, r.description,
                       r.official_link, r.emoji, c.category_name
                FROM resources r
                JOIN categories c ON c.category_id = r.category_id
                ORDER BY c.sort_order, r.resource_name
            """)

            return jsonify(to_json(cursor.fetchall()))

    finally:
        connection.close()


@app.route("/api/categories", methods=["GET"])
def get_categories():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT category_id, category_name, description, emoji
                FROM categories
                ORDER BY sort_order
            """)

            return jsonify(to_json(cursor.fetchall()))

    finally:
        connection.close()


@app.route("/api/activity/<int:user_id>", methods=["GET"])
def get_activity(user_id):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT activity_id, activity_type, title, created_at
                FROM activity_log
                WHERE user_id = %s
                ORDER BY created_at DESC, activity_id DESC
                LIMIT 20
            """, (user_id,))

            return jsonify(to_json(cursor.fetchall()))

    finally:
        connection.close()


@app.route("/api/notifications/<int:user_id>", methods=["GET"])
def get_notifications(user_id):
    """What the bell in the top bar shows.

    Anything overdue, plus anything due in the next week: checklist tasks
    first, then reminders.
    """
    today = date.today()
    soon = today + timedelta(days=7)

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT t.task_id, t.task_name, c.category_name, ut.due_date
                FROM user_tasks ut
                JOIN tasks t      ON t.task_id = ut.task_id
                JOIN categories c ON c.category_id = t.category_id
                WHERE ut.user_id = %s
                  AND ut.status <> 'Completed'
                  AND ut.due_date IS NOT NULL
                  AND ut.due_date <= %s
                ORDER BY ut.due_date
            """, (user_id, soon))

            tasks = cursor.fetchall()

            cursor.execute("""
                SELECT reminder_id, title, category, reminder_date, task_id
                FROM reminders
                WHERE user_id = %s AND is_done = 0 AND reminder_date <= %s
                ORDER BY reminder_date
            """, (user_id, soon))

            reminders = cursor.fetchall()

        items = []
        listed_tasks = set()

        for row in tasks:
            days = (row["due_date"] - today).days
            listed_tasks.add(row["task_id"])
            items.append({
                "type": "task",
                "title": row["task_name"],
                "detail": row["category_name"],
                "date": row["due_date"],
                "days": days,
                "link": f"checklist.html#task-{row['task_id']}"
            })

        for row in reminders:
            # The starter reminders mirror a checklist task. Don't show both.
            if row["task_id"] and row["task_id"] in listed_tasks:
                continue

            days = (row["reminder_date"] - today).days
            items.append({
                "type": "reminder",
                "title": row["title"],
                "detail": row["category"] or "Reminder",
                "date": row["reminder_date"],
                "days": days,
                "link": "reminders.html"
            })

        # Most urgent first, and cap the list so the panel stays readable.
        items.sort(key=lambda item: item["days"])
        items = items[:10]

        return jsonify(to_json({
            "count": len(items),
            "overdue": sum(1 for item in items if item["days"] < 0),
            "items": items
        }))

    finally:
        connection.close()


@app.route("/api/settings/<int:user_id>", methods=["GET"])
def get_settings(user_id):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT email_notifications, sms_reminders, push_notifications, language
                FROM user_settings
                WHERE user_id = %s
            """, (user_id,))

            settings = cursor.fetchone()

            if not settings:
                return fail("Settings not found", 404)

            for key in ("email_notifications", "sms_reminders", "push_notifications"):
                settings[key] = bool(settings[key])

        return jsonify(to_json(settings))

    finally:
        connection.close()


@app.route("/api/settings/<int:user_id>", methods=["PUT"])
def update_settings(user_id):
    data = request.get_json(silent=True) or {}

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT email_notifications, sms_reminders, push_notifications, language
                FROM user_settings
                WHERE user_id = %s
            """, (user_id,))

            current = cursor.fetchone()

            if not current:
                return fail("Settings not found", 404)

            cursor.execute("""
                UPDATE user_settings
                SET email_notifications = %s,
                    sms_reminders = %s,
                    push_notifications = %s,
                    language = %s
                WHERE user_id = %s
            """, (
                int(bool(data.get("email_notifications", current["email_notifications"]))),
                int(bool(data.get("sms_reminders", current["sms_reminders"]))),
                int(bool(data.get("push_notifications", current["push_notifications"]))),
                data.get("language", current["language"]),
                user_id
            ))

        connection.commit()

        return ok({"message": "Settings saved."})

    finally:
        connection.close()


def find_free_port(preferred_ports):
    """Return the first port nothing else is listening on.

    On macOS the AirPlay Receiver quietly takes port 5000, which stops the
    server from starting. Rather than fail, move to the next port and say
    which one was used.
    """
    import socket

    for port in preferred_ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

            try:
                probe.bind(("0.0.0.0", port))
                return port
            except OSError:
                continue

    return None


if __name__ == "__main__":
    chosen_port = int(os.environ.get("PORT", 0)) or find_free_port([5000, 5001, 5050, 8000, 8080])

    if not chosen_port:
        raise SystemExit("Could not find a free port. Close another server and try again.")

    print()
    print("=" * 52)
    print("  SettleSmart is running")
    print(f"  Open this in your browser:  http://localhost:{chosen_port}")

    if chosen_port != 5000:
        print("  (port 5000 was busy — macOS AirPlay Receiver usually")
        print("   holds it; you can turn that off in System Settings)")

    print("=" * 52)
    print()

    # host="0.0.0.0" lets other devices on the same WiFi reach this server
    # using your computer's local IP address, not just 127.0.0.1.
    app.run(debug=True, host="0.0.0.0", port=chosen_port)
