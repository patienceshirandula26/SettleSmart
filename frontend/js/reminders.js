"use strict";

const STORAGE_KEY = "settlesmart-reminders";

const starterReminders = [
  {
    id: "reminder-1",
    title: "TFN Application",
    date: "2026-08-05",
    category: "visa"
  },
  {
    id: "reminder-2",
    title: "USI Registration",
    date: "2026-08-08",
    category: "study"
  },
  {
    id: "reminder-3",
    title: "SIM Card Activation",
    date: "2026-08-10",
    category: "general"
  },
  {
    id: "reminder-4",
    title: "Go Card Top-up",
    date: "2026-08-14",
    category: "transport"
  },
  {
    id: "reminder-5",
    title: "OSHC Renewal",
    date: "2026-08-20",
    category: "health"
  },
  {
    id: "reminder-6",
    title: "Rental Inspection",
    date: "2026-08-26",
    category: "housing"
  }
];

const reminderModal =
  document.getElementById("reminderModal");

const reminderForm =
  document.getElementById("reminderForm");

const reminderList =
  document.getElementById("reminderList");

const reminderCount =
  document.getElementById("reminderCount");

const emptyMessage =
  document.getElementById("emptyMessage");

const searchInput =
  document.getElementById("searchInput");

const createReminderButton =
  document.getElementById("createReminderButton");

const reminderTitle =
  document.getElementById("reminderTitle");

const reminderDate =
  document.getElementById("reminderDate");

let reminders = loadReminders();

/**
 * Creates a unique reminder ID.
 */
function createReminderId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `reminder-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

/**
 * Gets today's local date in YYYY-MM-DD format.
 */
function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Loads reminders from localStorage.
 */
function loadReminders() {
  try {
    const savedReminders =
      localStorage.getItem(STORAGE_KEY);

    if (!savedReminders) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(starterReminders)
      );

      return [...starterReminders];
    }

    const parsedReminders =
      JSON.parse(savedReminders);

    if (!Array.isArray(parsedReminders)) {
      return [...starterReminders];
    }

    return parsedReminders;
  } catch (error) {
    console.error(
      "Unable to load reminders:",
      error
    );

    return [...starterReminders];
  }
}

/**
 * Saves reminders to localStorage.
 */
function saveReminders() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(reminders)
    );
  } catch (error) {
    console.error(
      "Unable to save reminders:",
      error
    );
  }
}

/**
 * Formats a date using Australian formatting.
 */
function formatReminderDate(dateValue) {
  const date =
    new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}

/**
 * Displays all reminders that match the search.
 */
function renderReminders() {
  const searchText =
    searchInput.value
      .trim()
      .toLowerCase();

  const visibleReminders =
    reminders
      .filter((reminder) => {
        const title =
          reminder.title.toLowerCase();

        const category =
          reminder.category.toLowerCase();

        return (
          title.includes(searchText) ||
          category.includes(searchText)
        );
      })
      .sort((firstReminder, secondReminder) => {
        return (
          new Date(firstReminder.date) -
          new Date(secondReminder.date)
        );
      });

  reminderList.replaceChildren();

  const reminderWord =
    visibleReminders.length === 1
      ? "reminder"
      : "reminders";

  reminderCount.textContent =
    `${visibleReminders.length} ${reminderWord}`;

  emptyMessage.hidden =
    visibleReminders.length > 0;

  visibleReminders.forEach((reminder) => {
    const reminderItem =
      document.createElement("div");

    reminderItem.className =
      "reminder-item";

    const reminderDot =
      document.createElement("span");

    reminderDot.className =
      `reminder-dot ${reminder.category}`;

    reminderDot.setAttribute(
      "aria-hidden",
      "true"
    );

    const reminderTitleElement =
      document.createElement("span");

    reminderTitleElement.className =
      "reminder-title";

    reminderTitleElement.textContent =
      reminder.title;

    const reminderDateElement =
      document.createElement("time");

    reminderDateElement.className =
      "reminder-date";

    reminderDateElement.dateTime =
      reminder.date;

    reminderDateElement.textContent =
      formatReminderDate(reminder.date);

    const deleteButton =
      document.createElement("button");

    deleteButton.className =
      "delete-reminder-button";

    deleteButton.type = "button";
    deleteButton.textContent = "×";

    deleteButton.setAttribute(
      "aria-label",
      `Delete ${reminder.title}`
    );

    deleteButton.title =
      `Delete ${reminder.title}`;

    deleteButton.addEventListener(
      "click",
      () => {
        deleteReminder(reminder.id);
      }
    );

    reminderItem.append(
      reminderDot,
      reminderTitleElement,
      reminderDateElement,
      deleteButton
    );

    reminderList.appendChild(
      reminderItem
    );
  });
}

/**
 * Opens the Create Reminder form.
 */
function openReminderModal() {
  reminderDate.min = getTodayDate();

  reminderModal.hidden = false;

  document.body.style.overflow =
    "hidden";

  window.setTimeout(() => {
    reminderTitle.focus();
  }, 0);
}

/**
 * Closes and resets the Create Reminder form.
 */
function closeReminderModal() {
  reminderModal.hidden = true;

  document.body.style.overflow = "";

  reminderForm.reset();
}

/**
 * Deletes a reminder.
 */
function deleteReminder(reminderId) {
  const selectedReminder =
    reminders.find(
      (reminder) =>
        reminder.id === reminderId
    );

  if (!selectedReminder) {
    return;
  }

  const confirmed =
    window.confirm(
      `Delete "${selectedReminder.title}"?`
    );

  if (!confirmed) {
    return;
  }

  reminders =
    reminders.filter(
      (reminder) =>
        reminder.id !== reminderId
    );

  saveReminders();
  renderReminders();
}

/**
 * Saves a newly created reminder.
 */
reminderForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const formData =
      new FormData(reminderForm);

    const title =
      String(
        formData.get("title") || ""
      ).trim();

    const date =
      String(
        formData.get("date") || ""
      );

    const category =
      String(
        formData.get("category") ||
        "general"
      );

    if (!title || !date) {
      window.alert(
        "Please enter a reminder title and due date."
      );

      return;
    }

    const newReminder = {
      id: createReminderId(),
      title,
      date,
      category
    };

    reminders.push(newReminder);

    saveReminders();
    closeReminderModal();
    renderReminders();
  }
);

/**
 * Opens the form.
 */
createReminderButton.addEventListener(
  "click",
  openReminderModal
);

/**
 * Searches reminders while typing.
 */
searchInput.addEventListener(
  "input",
  renderReminders
);

/**
 * Closes the form using the cancel button,
 * close button or dark background.
 */
document
  .querySelectorAll("[data-close-modal]")
  .forEach((element) => {
    element.addEventListener(
      "click",
      closeReminderModal
    );
  });

/**
 * Closes the form when Escape is pressed.
 */
document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      !reminderModal.hidden
    ) {
      closeReminderModal();
    }
  }
);

/**
 * Shows reminders when the page loads.
 */
renderReminders();