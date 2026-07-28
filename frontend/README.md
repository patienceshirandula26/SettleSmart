# Frontend

This folder contains the React frontend for SettleSmart.
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Settings | SettleSmart</title>

    <link rel="stylesheet"
          href="/static/css/style.css">

    <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        rel="stylesheet">

</head>

<body>

<div class="sidebar">

    <h2>SettleSmart</h2>

    <ul>

        <li><a href="/dashboard"><i class="fa fa-home"></i> Dashboard</a></li>

        <li><a href="/checklist"><i class="fa fa-list-check"></i> Checklist</a></li>

        <li><a href="/documents"><i class="fa fa-folder"></i> Documents</a></li>

        <li><a href="/resources"><i class="fa fa-book"></i> Resources</a></li>

        <li><a href="/reminders"><i class="fa fa-bell"></i> Reminders</a></li>

        <li class="active"><a href="/settings"><i class="fa fa-gear"></i> Settings</a></li>

        <li><a href="/logout"><i class="fa fa-right-from-bracket"></i> Logout</a></li>

    </ul>

</div>


<div class="content">

<h1>Account Settings</h1>

<div class="settings-container">

<form id="settingsForm">

<div class="card">

<h2>Profile Information</h2>

<label>Full Name</label>

<input
type="text"
id="fullname"
placeholder="Enter Full Name">

<label>Email Address</label>

<input
type="email"
id="email"
placeholder="Email Address">

<label>Phone Number</label>

<input
type="text"
id="phone"
placeholder="Phone Number">

<label>University</label>

<input
type="text"
id="university"
placeholder="University">

</div>


<div class="card">

<h2>Password</h2>

<label>Current Password</label>

<input
type="password"
id="currentPassword">

<label>New Password</label>

<input
type="password"
id="newPassword">

<label>Confirm Password</label>

<input
type="password"
id="confirmPassword">

</div>


<div class="card">

<h2>Notification Settings</h2>

<label>

<input type="checkbox"
checked>

Email Notifications

</label>

<label>

<input type="checkbox"
checked>

Reminder Notifications

</label>

<label>

<input type="checkbox">

SMS Notifications

</label>

</div>


<div class="card">

<h2>Appearance</h2>

<select id="theme">

<option>Light</option>

<option>Dark</option>

</select>

</div>


<button
type="submit"
class="save-btn">

Save Changes

</button>

</form>

</div>

</div>

<script src="/static/js/settings.js"></script>

</body>

</html>