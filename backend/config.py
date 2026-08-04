import os

# Absolute path to the backend/ folder, so uploads always land in the same
# place no matter which directory the server was started from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    # Database connection. Each value can be overridden with an environment
    # variable so the same code runs on another machine without editing it.
    MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
    MYSQL_USER = os.environ.get("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "Muteshi@23")
    MYSQL_DB = os.environ.get("MYSQL_DB", "settlesmart")

    # Where uploaded document files are stored on disk.
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))

    # Reject uploads larger than 10 MB.
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    # File types a student is allowed to upload.
    ALLOWED_EXTENSIONS = {
        "pdf", "png", "jpg", "jpeg", "webp", "heic", "gif",
        "doc", "docx", "txt"
    }
