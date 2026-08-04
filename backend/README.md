# Backend

The SettleSmart REST API, written in Python with Flask and MySQL.

## Setup

```bash
pip3 install -r requirements.txt   # once
python3 init_db.py                 # create or update the database
python3 app.py                     # start the server
```

`app.py` also serves the pages in `../frontend`, so opening the address it
prints is enough to use the whole application.

## Files

| File | Purpose |
|---|---|
| `app.py` | All API routes, and serves the frontend |
| `init_db.py` | Creates the database, tables and reference data. Safe to re-run |
| `config.py` | MySQL details and upload limits (overridable with env variables) |
| `db.py` | Opens MySQL connections |
| `seed_data.py` | The categories, tasks, resources and starter documents |
| `provisioning.py` | Builds a new account's checklist, documents and reminders |
| `uploads/` | Uploaded document files, one folder per user. Not committed to Git |

## Notes

- Passwords are hashed with Werkzeug before they are stored. `init_db.py`
  converts any old plain-text passwords the first time it runs.
- Uploads are limited to 10 MB and to document and image file types. Each file
  is stored under a generated name so two files with the same name can't clash.
- `init_db.py` only adds what is missing, so running it after a schema change
  keeps existing accounts, progress and uploaded files.
