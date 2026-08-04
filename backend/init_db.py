"""Creates and updates the SettleSmart database.

Run this once before starting the server, and again any time the schema
changes:

    python3 backend/init_db.py

It is safe to run repeatedly. Existing accounts, uploaded documents and
checklist progress are kept — the script only adds what is missing.
"""

import sys

from werkzeug.security import generate_password_hash

from config import Config
from db import get_connection, get_server_connection
from provisioning import provision_user
from seed_data import CATEGORIES, RESOURCES, TASKS

# Every table, in the order they must be created because of foreign keys.
TABLES = {
    "users": """
        CREATE TABLE IF NOT EXISTS users (
            user_id       INT AUTO_INCREMENT PRIMARY KEY,
            full_name     VARCHAR(100) NOT NULL,
            email         VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            university    VARCHAR(100) DEFAULT NULL,
            phone         VARCHAR(30)  DEFAULT NULL,
            home_country  VARCHAR(100) DEFAULT NULL,
            arrival_date  DATE         DEFAULT NULL,
            created_at    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "user_settings": """
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id             INT PRIMARY KEY,
            email_notifications TINYINT(1)  NOT NULL DEFAULT 1,
            sms_reminders       TINYINT(1)  NOT NULL DEFAULT 1,
            push_notifications  TINYINT(1)  NOT NULL DEFAULT 0,
            language            VARCHAR(50) NOT NULL DEFAULT 'English (Australia)',
            CONSTRAINT fk_settings_user FOREIGN KEY (user_id)
                REFERENCES users (user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "categories": """
        CREATE TABLE IF NOT EXISTS categories (
            category_id   INT AUTO_INCREMENT PRIMARY KEY,
            category_name VARCHAR(100) NOT NULL,
            description   TEXT,
            emoji         VARCHAR(10) DEFAULT NULL,
            sort_order    INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "tasks": """
        CREATE TABLE IF NOT EXISTS tasks (
            task_id         INT AUTO_INCREMENT PRIMARY KEY,
            category_id     INT NOT NULL,
            task_name       VARCHAR(150) NOT NULL,
            description     TEXT,
            estimated_time  VARCHAR(50)  DEFAULT NULL,
            official_link   VARCHAR(500) DEFAULT NULL,
            priority        ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium',
            due_offset_days INT NOT NULL DEFAULT 30,
            sort_order      INT NOT NULL DEFAULT 0,
            CONSTRAINT fk_tasks_category FOREIGN KEY (category_id)
                REFERENCES categories (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "user_tasks": """
        CREATE TABLE IF NOT EXISTS user_tasks (
            user_task_id   INT AUTO_INCREMENT PRIMARY KEY,
            user_id        INT NOT NULL,
            task_id        INT NOT NULL,
            status         ENUM('Not Started','In Progress','Completed') NOT NULL DEFAULT 'Not Started',
            due_date       DATE DEFAULT NULL,
            completed_date DATE DEFAULT NULL,
            notes          TEXT,
            updated_at     TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_user_task (user_id, task_id),
            CONSTRAINT fk_user_tasks_user FOREIGN KEY (user_id)
                REFERENCES users (user_id) ON DELETE CASCADE,
            CONSTRAINT fk_user_tasks_task FOREIGN KEY (task_id)
                REFERENCES tasks (task_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "documents": """
        CREATE TABLE IF NOT EXISTS documents (
            document_id      INT AUTO_INCREMENT PRIMARY KEY,
            user_id          INT NOT NULL,
            document_name    VARCHAR(150) NOT NULL,
            document_type    VARCHAR(100) DEFAULT NULL,
            status           ENUM('Pending','Completed','Not Required') NOT NULL DEFAULT 'Pending',
            reference_number VARCHAR(100) DEFAULT NULL,
            provider         VARCHAR(100) DEFAULT NULL,
            notes            TEXT,
            file_name        VARCHAR(255) DEFAULT NULL,
            stored_name      VARCHAR(255) DEFAULT NULL,
            file_size        INT          DEFAULT NULL,
            mime_type        VARCHAR(120) DEFAULT NULL,
            expiry_date      DATE         DEFAULT NULL,
            uploaded_at      DATETIME     DEFAULT NULL,
            created_at       TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_documents_user FOREIGN KEY (user_id)
                REFERENCES users (user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "reminders": """
        CREATE TABLE IF NOT EXISTS reminders (
            reminder_id   INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT NOT NULL,
            title         VARCHAR(150) NOT NULL,
            reminder_date DATE NOT NULL,
            category      VARCHAR(100) DEFAULT NULL,
            notes         TEXT,
            is_done       TINYINT(1) NOT NULL DEFAULT 0,
            task_id       INT DEFAULT NULL,
            created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_reminders_user FOREIGN KEY (user_id)
                REFERENCES users (user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "resources": """
        CREATE TABLE IF NOT EXISTS resources (
            resource_id   INT AUTO_INCREMENT PRIMARY KEY,
            category_id   INT NOT NULL,
            resource_name VARCHAR(150) NOT NULL,
            description   TEXT,
            official_link VARCHAR(500) DEFAULT NULL,
            emoji         VARCHAR(10) DEFAULT NULL,
            CONSTRAINT fk_resources_category FOREIGN KEY (category_id)
                REFERENCES categories (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,

    "activity_log": """
        CREATE TABLE IF NOT EXISTS activity_log (
            activity_id   INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT NOT NULL,
            activity_type VARCHAR(50) NOT NULL,
            title         VARCHAR(200) NOT NULL,
            created_at    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
                REFERENCES users (user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
}

# Columns added after the first version of the database was built. Each entry
# is (table, column, definition) and is only applied if the column is missing.
NEW_COLUMNS = [
    ("users", "phone", "VARCHAR(30) DEFAULT NULL"),
    ("users", "home_country", "VARCHAR(100) DEFAULT NULL"),
    ("categories", "emoji", "VARCHAR(10) DEFAULT NULL"),
    ("categories", "sort_order", "INT NOT NULL DEFAULT 0"),
    ("tasks", "priority", "ENUM('High','Medium','Low') NOT NULL DEFAULT 'Medium'"),
    ("tasks", "due_offset_days", "INT NOT NULL DEFAULT 30"),
    ("tasks", "sort_order", "INT NOT NULL DEFAULT 0"),
    ("user_tasks", "due_date", "DATE DEFAULT NULL"),
    ("user_tasks", "updated_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    ("documents", "file_name", "VARCHAR(255) DEFAULT NULL"),
    ("documents", "stored_name", "VARCHAR(255) DEFAULT NULL"),
    ("documents", "file_size", "INT DEFAULT NULL"),
    ("documents", "mime_type", "VARCHAR(120) DEFAULT NULL"),
    ("documents", "expiry_date", "DATE DEFAULT NULL"),
    ("documents", "uploaded_at", "DATETIME DEFAULT NULL"),
    ("documents", "created_at", "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"),
    ("resources", "emoji", "VARCHAR(10) DEFAULT NULL"),
]

# The original database stored short category words on documents. Map them to
# the real category names so the Documents filter pills line up.
DOCUMENT_TYPE_FIXES = {
    "Study": "Identity & Study",
    "Transport": "Transport & Licensing",
    "Work Clearance": "Work Clearances",
}


def column_exists(cursor, table, column):
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s AND column_name = %s
    """, (Config.MYSQL_DB, table, column))

    return cursor.fetchone()["total"] > 0


def table_exists(cursor, table):
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM information_schema.tables
        WHERE table_schema = %s AND table_name = %s
    """, (Config.MYSQL_DB, table))

    return cursor.fetchone()["total"] > 0


def index_exists(cursor, table, index_name):
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM information_schema.statistics
        WHERE table_schema = %s AND table_name = %s AND index_name = %s
    """, (Config.MYSQL_DB, table, index_name))

    return cursor.fetchone()["total"] > 0


def create_database():
    connection = get_server_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
            )
        connection.commit()
        print(f"  database `{Config.MYSQL_DB}` ready")
    finally:
        connection.close()


def create_tables(cursor):
    for name, statement in TABLES.items():
        existed = table_exists(cursor, name)
        cursor.execute(statement)

        if not existed:
            print(f"  created table {name}")


def rename_password_column(cursor):
    """The first version of the app stored a plain `password` column."""
    if column_exists(cursor, "users", "password_hash"):
        return

    if column_exists(cursor, "users", "password"):
        cursor.execute(
            "ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL"
        )
        print("  renamed users.password -> users.password_hash")


def add_new_columns(cursor):
    for table, column, definition in NEW_COLUMNS:
        if not table_exists(cursor, table):
            continue

        if not column_exists(cursor, table, column):
            cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}")
            print(f"  added column {table}.{column}")


def upgrade_foreign_keys(cursor):
    """Make the account-owned tables delete cleanly.

    The first version of the database created its foreign keys without
    ON DELETE CASCADE, so removing an account failed with a constraint
    error. Rebuild those keys with cascade so deleting a user also
    removes their tasks, documents and reminders.
    """
    cascade_keys = [
        ("user_tasks", "user_id", "users", "user_id", "fk_user_tasks_user"),
        ("user_tasks", "task_id", "tasks", "task_id", "fk_user_tasks_task"),
        ("documents", "user_id", "users", "user_id", "fk_documents_user"),
    ]

    for table, column, ref_table, ref_column, wanted_name in cascade_keys:
        if not table_exists(cursor, table):
            continue

        # Aliased because information_schema column names come back in
        # different cases depending on the MySQL version.
        cursor.execute("""
            SELECT k.constraint_name AS name, r.delete_rule AS rule_name
            FROM information_schema.key_column_usage k
            JOIN information_schema.referential_constraints r
              ON r.constraint_name = k.constraint_name
             AND r.constraint_schema = k.table_schema
            WHERE k.table_schema = %s
              AND k.table_name = %s
              AND k.column_name = %s
              AND k.referenced_table_name = %s
        """, (Config.MYSQL_DB, table, column, ref_table))

        existing = cursor.fetchone()

        if not existing:
            cursor.execute(f"""
                ALTER TABLE `{table}`
                ADD CONSTRAINT `{wanted_name}`
                FOREIGN KEY (`{column}`) REFERENCES `{ref_table}` (`{ref_column}`)
                ON DELETE CASCADE
            """)
            print(f"  added cascading foreign key on {table}.{column}")
            continue

        if existing["rule_name"] == "CASCADE":
            continue

        cursor.execute(
            f"ALTER TABLE `{table}` DROP FOREIGN KEY `{existing['name']}`"
        )
        cursor.execute(f"""
            ALTER TABLE `{table}`
            ADD CONSTRAINT `{wanted_name}`
            FOREIGN KEY (`{column}`) REFERENCES `{ref_table}` (`{ref_column}`)
            ON DELETE CASCADE
        """)
        print(f"  {table}.{column} foreign key now cascades on delete")


def seed_categories(cursor):
    for category_id, name, description, emoji, sort_order in CATEGORIES:
        cursor.execute("""
            INSERT INTO categories (category_id, category_name, description, emoji, sort_order)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                category_name = VALUES(category_name),
                description   = VALUES(description),
                emoji         = VALUES(emoji),
                sort_order    = VALUES(sort_order)
        """, (category_id, name, description, emoji, sort_order))

    print(f"  seeded {len(CATEGORIES)} categories")


def seed_tasks(cursor):
    for row in TASKS:
        cursor.execute("""
            INSERT INTO tasks
                (task_id, category_id, task_name, description, estimated_time,
                 official_link, priority, due_offset_days, sort_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                category_id     = VALUES(category_id),
                task_name       = VALUES(task_name),
                description     = VALUES(description),
                estimated_time  = VALUES(estimated_time),
                official_link   = VALUES(official_link),
                priority        = VALUES(priority),
                due_offset_days = VALUES(due_offset_days),
                sort_order      = VALUES(sort_order)
        """, row)

    # The old database had the same 15 tasks inserted three times over.
    # Anything past the seeded ids is a duplicate, so clear it out.
    highest_id = max(task[0] for task in TASKS)

    cursor.execute("DELETE FROM user_tasks WHERE task_id > %s", (highest_id,))
    cursor.execute("DELETE FROM tasks WHERE task_id > %s", (highest_id,))

    removed = cursor.rowcount
    if removed:
        print(f"  removed {removed} duplicate tasks")

    print(f"  seeded {len(TASKS)} tasks")


def seed_resources(cursor):
    for row in RESOURCES:
        cursor.execute("""
            INSERT INTO resources
                (resource_id, category_id, resource_name, description, official_link, emoji)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                category_id   = VALUES(category_id),
                resource_name = VALUES(resource_name),
                description   = VALUES(description),
                official_link = VALUES(official_link),
                emoji         = VALUES(emoji)
        """, row)

    print(f"  seeded {len(RESOURCES)} resources")


def add_unique_user_task_index(cursor):
    if index_exists(cursor, "user_tasks", "uq_user_task"):
        return

    # A duplicate pair would block the unique index, so drop the extras first.
    cursor.execute("""
        DELETE ut FROM user_tasks ut
        JOIN user_tasks keep
          ON keep.user_id = ut.user_id
         AND keep.task_id = ut.task_id
         AND keep.user_task_id < ut.user_task_id
    """)

    cursor.execute("ALTER TABLE user_tasks ADD UNIQUE KEY uq_user_task (user_id, task_id)")
    print("  added unique index on user_tasks (user_id, task_id)")


def hash_plaintext_passwords(cursor):
    """Old accounts stored passwords as plain text. Hash them in place."""
    cursor.execute("SELECT user_id, password_hash FROM users")
    rows = cursor.fetchall()

    updated = 0

    for row in rows:
        stored = row["password_hash"] or ""

        # Werkzeug hashes look like "scrypt:32768:8:1$..." or "pbkdf2:sha256$..."
        if stored.startswith(("scrypt:", "pbkdf2:")):
            continue

        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (generate_password_hash(stored), row["user_id"])
        )
        updated += 1

    if updated:
        print(f"  hashed {updated} plain-text password(s)")


def normalise_document_types(cursor):
    for old_value, new_value in DOCUMENT_TYPE_FIXES.items():
        cursor.execute(
            "UPDATE documents SET document_type = %s WHERE document_type = %s",
            (new_value, old_value)
        )


def backfill_users(cursor):
    cursor.execute("SELECT user_id, full_name, arrival_date FROM users")
    users = cursor.fetchall()

    for user in users:
        provision_user(cursor, user["user_id"], user["arrival_date"])

    print(f"  checked settlement data for {len(users)} account(s)")


def main():
    print("SettleSmart database setup")
    print("-" * 40)

    create_database()

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            create_tables(cursor)
            rename_password_column(cursor)
            add_new_columns(cursor)
            upgrade_foreign_keys(cursor)

            seed_categories(cursor)
            seed_tasks(cursor)
            seed_resources(cursor)

            add_unique_user_task_index(cursor)
            hash_plaintext_passwords(cursor)
            normalise_document_types(cursor)
            backfill_users(cursor)

        connection.commit()
    finally:
        connection.close()

    print("-" * 40)
    print("Done. Start the server with:  python3 backend/app.py")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001 - this is a setup script
        print(f"\nSetup failed: {error}")
        print("Check that MySQL is running and the details in backend/config.py are correct.")
        sys.exit(1)
