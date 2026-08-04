# SettleSmart

## Student Settlement Management System

SettleSmart is a web application designed to help newly arrived international students in Australia organise and track the important setup tasks they need to complete after arriving.

The system provides a guided settlement checklist, document and card tracking, progress monitoring, reminders, and official resource links. It is designed to reduce confusion for students who may be unfamiliar with Australian systems such as TFN, USI, Go Card, OSHC, bank setup, SIM cards, and work-related screening cards.

---

## Running the Application

You need **MySQL** and **Python 3** installed and MySQL running.

**1. Install the Python packages**

```bash
pip3 install -r backend/requirements.txt
```

**2. Tell the app how to reach MySQL**

Open `backend/config.py` and set `MYSQL_USER` and `MYSQL_PASSWORD` to your own
MySQL login. You can also set them as environment variables instead of editing
the file:

```bash
export MYSQL_USER=root
export MYSQL_PASSWORD=yourpassword
```

**3. Build the database**

```bash
python3 backend/init_db.py
```

This creates the `settlesmart` database, all nine tables, and the settlement
categories, tasks and official resources. It is safe to run again at any time —
existing accounts, uploaded files and checklist progress are kept.

**4. Start the server**

```bash
python3 backend/app.py
```

The server prints the address to open, for example:

```
====================================================
  SettleSmart is running
  Open this in your browser:  http://localhost:5000
====================================================
```

On macOS, port 5000 is often taken by the AirPlay Receiver. If that happens the
server automatically moves to the next free port (5001) and says so — just use
the address it prints.

**5. Create an account**

Open the address in your browser, click **Get Started → Create an account**, and
sign up. Every new account is set up automatically with its own settlement
checklist, document list and starter reminders, so the dashboard has real data
from the first visit.

> To rebuild the database from SQL instead of the setup script:
> `mysql -u root -p < database/settlesmart_schema.sql`

---

## Project Information

**Subject:** CP3404 Agile Software Engineering  
**Project Type:** Group Web Application  
**Project Name:** SettleSmart  

---

## Group Members

- Patience Shirandula
- Sijan MD Tanvir
- Fabian Uchendu
- Aaditya Maharjan

---

## Problem Statement

Newly arrived international students in Australia often struggle to understand and manage the essential setup tasks required for study, work, transport, accommodation, healthcare, and daily life.

Important information is usually spread across university websites, government portals, transport websites, banking services, emails, and personal notes. This can lead to confusion, missed tasks, duplicated information, and delays in completing important requirements.

SettleSmart addresses this problem by providing one organised platform where students can track tasks, store document details, monitor progress, receive reminders, and access official resources.

---

## Project Aim

The aim of SettleSmart is to help international students settle into Australia more confidently by providing a structured and easy-to-use platform for managing settlement tasks.

The application focuses on helping students answer three simple questions:

1. What do I need to complete?
2. What have I already completed?
3. What should I do next?

---

## Key Features

### 1. Student Dashboard

The dashboard provides an overview of the student’s settlement progress.

It includes:

- Overall completion percentage
- Completed tasks
- Pending tasks
- Upcoming reminders
- Recent activity
- Quick access to important resources

---

### 2. Settlement Checklist

The checklist helps students track essential setup tasks after arriving in Australia.

Example checklist categories include:

- Study
- Employment
- Transport
- Health
- Accommodation
- Worker Screening
- Communication
- Financial Setup

---

### 3. Document and Card Tracker

Students can record important cards, accounts, and documents in one place.

Examples include:

- Tax File Number (TFN)
- Unique Student Identifier (USI)
- Student ID
- Bank card
- Go Card
- OSHC details
- Blue Card
- Yellow Card / NDIS Worker Screening
- Red Card, if applicable
- Australian SIM card
- International driver licence verification

---

### 4. Progress Tracking

SettleSmart shows students how much of their settlement process they have completed.

Progress tracking may include:

- Total tasks completed
- Pending tasks
- Category progress
- Tasks needing attention
- Settlement completion percentage

---

### 5. Reminders and Due Dates

Students can set reminders for important tasks so they do not forget deadlines or required actions.

Examples:

- Apply for TFN
- Create USI
- Activate SIM card
- Register Go Card
- Upload rental agreement

---

### 6. Official Resources

The application provides quick access to official services and resources.

Examples:

- Australian Taxation Office
- USI Registry
- Translink
- Queensland Transport
- Blue Card Services
- OSHC provider information

---

## Target Users

### Primary Users

The primary users are newly arrived international students in Australia.

These students may need support understanding Australian systems, services, cards, documents, and processes.

### Secondary Users

Secondary users may include:

- University support staff
- Student mentors
- Peer support volunteers

---

## Technology Stack

| Area | Technology |
|---|---|
| UI/UX Design | Figma |
| Frontend | HTML, CSS, JavaScript (no framework) |
| Backend | Python 3, Flask, Flask-CORS |
| Database | MySQL 8 (accessed with PyMySQL) |
| Password security | Werkzeug password hashing (scrypt) |
| File storage | Uploaded documents saved under `backend/uploads/` |
| Version Control | Git and GitHub |
| Project Management | Notion |
| Documentation | Markdown and project documentation files |

---

## UI/UX Design

The user interface design is created using Figma.

The current Figma dashboard includes:

- Sidebar navigation
- Search bar
- Student profile area
- Settlement progress card
- Category progress cards
- Pending tasks table
- Recent activity panel
- Reminder section
- Official resource cards

The design aims to be clean, simple, organised, and easy for newly arrived students to understand.

---

## Agile Methodology

SettleSmart follows an Agile iterative development approach.

The project is planned around weekly sprints that include:

- Planning
- Development
- Testing
- Review
- Retrospective

This approach allows the team to build the system gradually, review progress regularly, and improve the application based on feedback.

---

## Current Project Status

### Completed So Far

- Project idea, problem statement and target users defined
- User stories and product backlog created
- GitHub repository and Figma dashboard design created
- Technology stack selected
- MySQL database designed and built (9 tables, see the ERD section below)
- Flask REST API covering accounts, checklist, documents, reminders,
  resources, activity and settings
- Registration and login with hashed passwords
- All eight pages built and connected to the database
- Document file upload, download, replace and delete
- Dashboard progress, category progress and activity feed driven by real data

### Next Steps

- Email and SMS delivery for reminders (currently stored as preferences only)
- Shared/mentor view for university support staff
- Deployment to a hosted server

---

## Planned Main Pages

The planned web application pages include:

1. Login Page
2. Dashboard
3. Settlement Checklist
4. Documents / Card Tracker
5. Reminders
6. Official Resources
7. Profile
8. Settings

---

## Database Design

Nine tables, defined in `database/settlesmart_schema.sql` and built by
`backend/init_db.py`.

| Table | Holds |
|---|---|
| `users` | Account details and the hashed password |
| `user_settings` | Notification preferences and language, one row per user |
| `categories` | The eight settlement categories |
| `tasks` | The 19 standard checklist tasks, with priority and a due-date offset |
| `user_tasks` | One row per user per task: status, due date, completion date |
| `documents` | A student's documents, including the uploaded file details |
| `reminders` | Reminders a student has created or been given |
| `resources` | Official government and university links |
| `activity_log` | The Recent Activity feed on the dashboard |

`categories`, `tasks` and `resources` are shared reference data. Everything else
belongs to a single student, and deleting an account removes their rows with it.

**How a new account is set up.** Registering does more than insert a row into
`users`. The backend also creates a `user_tasks` row for all 19 tasks (with a due
date worked out from the student's arrival date), a starting list of 12 documents
to upload, four reminders for the most urgent tasks, and a settings row. That is
why the dashboard shows a real 0% starting point rather than an empty page.

---

## Password Security

Passwords are never stored in a readable form. When someone registers or
changes their password, the plain text is passed to Werkzeug's
`generate_password_hash()` and only the result is written to the database:

```
scrypt:32768:8:1$KG7Q9AnKgmhtEbcN$52d33c4e13295e27509867b0ddcb...
         │            │                       │
    cost settings   random salt          the hash itself
```

**scrypt** is a deliberately slow, memory-hard algorithm. The `32768:8:1`
settings mean each guess costs an attacker real time and memory, which makes
large-scale guessing impractical. The **salt** is different for every account,
so two students who happen to choose the same password get completely
different hashes, and a precomputed table of common hashes is useless.

Logging in never decrypts anything — that isn't possible. The password typed
at login is hashed the same way and the two hashes are compared with
`check_password_hash()`, which uses a constant-time comparison so an attacker
can't learn anything from how long the check takes.

**Strength rules**, enforced in `check_password_strength()` in `backend/app.py`:

| Rule | Reason |
|---|---|
| At least 8 characters | Short passwords fall to brute force quickly |
| Must contain a letter | Blocks all-numeric PINs |
| Must contain a number | Blocks dictionary words on their own |
| Not a known common password | `password1`, `12345678` and similar are tried first in real attacks |
| Must not contain your name or email | Personal details are the first thing an attacker guesses |
| Must differ from the old one when changing | Stops a "change" that changes nothing |

These are checked **on the server**, so they cannot be bypassed by editing the
page or calling the API directly. The registration form also shows the rules
live with a strength meter, but that is only a convenience — the server is
what actually enforces them.

Accounts created before hashing was added were converted automatically the
first time `init_db.py` ran, so no plain-text passwords remain in the database.

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/register` | Create an account and set up its settlement data |
| POST | `/api/login` | Sign in |
| GET/PUT | `/api/profile/<user_id>` | Read or update profile details |
| PUT | `/api/profile/<user_id>/password` | Change password |
| GET | `/api/dashboard/<user_id>` | Everything the dashboard shows, in one call |
| GET | `/api/checklist/<user_id>` | Checklist grouped by category |
| PUT | `/api/tasks/update` | Tick a task off or reopen it |
| GET | `/api/documents/<user_id>` | A student's documents |
| POST | `/api/documents` | Add a document, with an optional file |
| POST | `/api/documents/<id>/upload` | Attach or replace a document's file |
| GET | `/api/documents/file/<id>` | View or download an uploaded file |
| PUT/DELETE | `/api/documents/<id>` | Edit or delete a document |
| GET/POST | `/api/reminders` | List or create reminders |
| PUT/DELETE | `/api/reminders/<id>` | Update or delete a reminder |
| GET | `/api/resources` | Official links |
| GET | `/api/activity/<user_id>` | Activity history |
| GET/PUT | `/api/settings/<user_id>` | Notification preferences |

---

## Project Structure

```text
SettleSmart/
│
├── README.md
│
├── backend/
│   ├── app.py              Flask API and static file server
│   ├── init_db.py          Creates and updates the database
│   ├── config.py           Database and upload settings
│   ├── db.py               MySQL connection helpers
│   ├── seed_data.py        Categories, tasks, resources, starter documents
│   ├── provisioning.py     Sets a new account up with its own data
│   ├── requirements.txt
│   └── uploads/            Uploaded document files (not in Git)
│
├── frontend/
│   ├── index.html
│   ├── pages/              login, register, dashboard, checklist,
│   │                       documents, reminders, resources, profile, settings
│   ├── css/
│   └── js/
│       ├── api.js          Shared API calls, formatting and helpers
│       ├── user.js         Page guard and logged-in user details
│       ├── script.js       Login
│       ├── register.js     Registration
│       ├── dashboard.js    Progress, stats, categories, activity
│       ├── checklist.js    Checklist with saved progress
│       ├── documents.js    Uploads, status changes, deletion
│       ├── reminders.js    Reminder management
│       ├── resources.js    Official links and getting-started steps
│       ├── profile.js      Profile viewing and editing
│       └── settings.js     Preferences and password change
│
├── database/
│   ├── settlesmart_schema.sql   Full schema plus reference data
│   └── settlesmart.sql/         Per-table dumps
│
└── docs/                   Sprint plan, test report, presentation
```
