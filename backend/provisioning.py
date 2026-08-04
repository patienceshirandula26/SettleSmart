"""Sets a student up with their own copy of the settlement journey.

When someone registers they should not land on an empty dashboard. This
module gives every new account:

  * one user_tasks row per checklist task, with a due date
  * a starting set of documents to upload
  * a few reminders for the most urgent tasks
  * a notification settings row
  * an entry in the activity feed

init_db.py calls the same functions so existing accounts get backfilled.
"""

from datetime import date, timedelta

from seed_data import STARTER_DOCUMENTS, STARTER_REMINDERS, TASKS


def _start_date(arrival_date):
    """Pick the date the settlement clock starts ticking from.

    A student who hasn't arrived yet counts down to their arrival date;
    anyone already here counts from today, so their due dates aren't all
    in the past.
    """
    today = date.today()

    if arrival_date and arrival_date > today:
        return arrival_date

    return today


def log_activity(cursor, user_id, activity_type, title):
    """Add one line to the user's Recent Activity feed."""
    cursor.execute("""
        INSERT INTO activity_log (user_id, activity_type, title)
        VALUES (%s, %s, %s)
    """, (user_id, activity_type, title))


def ensure_user_settings(cursor, user_id):
    """Create the notification preferences row if it doesn't exist."""
    cursor.execute("""
        INSERT IGNORE INTO user_settings (user_id)
        VALUES (%s)
    """, (user_id,))


def seed_user_tasks(cursor, user_id, arrival_date=None):
    """Give the user a checklist row for every task, keeping any progress."""
    start = _start_date(arrival_date)

    for task_id, _cat, _name, _desc, _time, _link, _priority, offset_days, _order in TASKS:
        due_date = start + timedelta(days=offset_days)

        # INSERT IGNORE relies on the unique (user_id, task_id) index, so
        # re-running this never wipes a task the student already completed.
        cursor.execute("""
            INSERT IGNORE INTO user_tasks (user_id, task_id, status, due_date)
            VALUES (%s, %s, 'Not Started', %s)
        """, (user_id, task_id, due_date))


def seed_user_documents(cursor, user_id):
    """Add the standard document checklist, but only for an empty account."""
    cursor.execute(
        "SELECT COUNT(*) AS total FROM documents WHERE user_id = %s",
        (user_id,)
    )

    if cursor.fetchone()["total"] > 0:
        return

    for document_name, document_type, provider, notes in STARTER_DOCUMENTS:
        cursor.execute("""
            INSERT INTO documents
                (user_id, document_name, document_type, status, provider, notes)
            VALUES (%s, %s, %s, 'Pending', %s, %s)
        """, (user_id, document_name, document_type, provider, notes))


def seed_user_reminders(cursor, user_id, arrival_date=None):
    """Create a few starter reminders for the most time-critical tasks."""
    cursor.execute(
        "SELECT COUNT(*) AS total FROM reminders WHERE user_id = %s",
        (user_id,)
    )

    if cursor.fetchone()["total"] > 0:
        return

    start = _start_date(arrival_date)
    task_names = {task[0]: task[2] for task in TASKS}

    for task_id, days_from_now, category in STARTER_REMINDERS:
        cursor.execute("""
            INSERT INTO reminders (user_id, title, reminder_date, category, task_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            task_names.get(task_id, "Settlement task"),
            start + timedelta(days=days_from_now),
            category,
            task_id
        ))


def provision_user(cursor, user_id, arrival_date=None, is_new=False):
    """Run every setup step for one account."""
    ensure_user_settings(cursor, user_id)
    seed_user_tasks(cursor, user_id, arrival_date)
    seed_user_documents(cursor, user_id)
    seed_user_reminders(cursor, user_id, arrival_date)

    if is_new:
        log_activity(cursor, user_id, "account", "Account created — welcome to SettleSmart")
