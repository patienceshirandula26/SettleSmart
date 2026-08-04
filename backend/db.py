"""Shared database helpers for SettleSmart.

Both the Flask app and the database setup script (init_db.py) import from
here so there is only ever one place that knows how to reach MySQL.
"""

import pymysql

from config import Config


def get_connection(database=Config.MYSQL_DB):
    """Open a connection to MySQL that returns rows as dictionaries."""
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )


def get_server_connection():
    """Connect to the MySQL server without selecting a database.

    Used by init_db.py so it can create the database if it doesn't exist yet.
    """
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )
