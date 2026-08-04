# Frontend

Plain HTML, CSS and JavaScript — no framework and no build step.

The pages are served by the Flask backend, so start the server and open the
address it prints:

```bash
python3 ../backend/init_db.py   # first time only
python3 ../backend/app.py
```

## Structure

```text
index.html        Landing page
pages/            login, register, dashboard, checklist, documents,
                  reminders, resources, profile, settings
css/              One stylesheet per page, plus shared app.css
js/               One script per page, plus shared api.js and user.js
```

## How the JavaScript fits together

`api.js` loads first on every page. It works out where the backend is, wraps
the API calls, and provides the shared helpers (date formatting, escaping,
toast messages, and the logged-in user).

`user.js` loads next on the pages inside the app. It sends anyone who isn't
logged in back to `login.html`, fills in every element marked with a
`data-user-*` attribute, and wires up the logout links.

Each page then loads its own script, which fetches that page's data and renders
it. Nothing on these pages is hardcoded — the numbers, task lists, documents and
reminders all come from the database.

## Pointing at a different server

The pages normally talk to whichever server delivered them. To use a different
backend, run this once in the browser console:

```js
localStorage.setItem("settlesmart-api", "http://192.168.0.5:5000");
```
