// Texts for the Calendar widget (the react-big-calendar event calendar — month / week / day views).
// Config: packages/widget-definitions/src/widgets/calendar.js
// Runtime: frontend/src/AppBuilder/Widgets/Calendar/Calendar.jsx (+ CalendarPopover.jsx)
export const calendarText = {
  displayName: "Calendar", // calendar.js:3
  componentType: "Calendar", // calendar.js:5
  defaultWidgetName: "calendar1", // runtime name = config `name` lower-cased + 1 (calendar.js:2)
  widgetPrefix: "calendar",
  defaultSize: { width: 30, height: 600 }, // calendar.js:6-9

  // Definition defaults the specs assert against
  defaultView: "month", // calendar.js:99 + exposedVariables.currentView (calendar.js:76)
  defaultDateFormat: "MM-DD-YYYY HH:mm:ss A Z", // calendar.js:86

  // Fixed explicit seed (TESTING.md D-03: the config defaults are moment()-based, never assert on them)
  dateFormat: "MM-DD-YYYY HH:mm",
  dayFormat: "MM-DD-YYYY",
  defaultDate: "06-15-2022 00:00",
  defaultDay: "06-15-2022",
  monthLabel: "June 2022", // react-big-calendar month toolbar label for the seeded date
  nextMonthLabel: "July 2022",
  weekLabel: "June 12 – 18", // react-big-calendar week label (Sun-start week holding 15 Jun 2022)
  bandStart: "06-15-2022 08:00",
  bandEnd: "06-15-2022 18:00",

  // Toolbar buttons (react-big-calendar default messages; Calendar.jsx:154 views month/week/day)
  toolbar: { today: "Today", back: "Back", next: "Next", month: "Month", week: "Week", day: "Day" },
  weekdayHeaders: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  weekHeaders: ["12 Jun", "13 Jun", "14 Jun", "15 Jun", "16 Jun", "17 Jun", "18 Jun"], // weekDateFormat 'DD MMM' (calendar.js:124)

  // react-big-calendar time gutter labels for an 08:00–18:00 band and for the whole day
  bandGutter: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"],
  fullDayFirstLabel: "12:00 AM",
  fullDayLastLabel: "11:00 PM",

  // Resources (Calendar.jsx:44,163-164 resourceIdAccessor 'resourceId', resourceTitleAccessor 'title')
  resources: [
    { resourceId: 1, title: "Room A" },
    { resourceId: 2, title: "Room B" },
  ],
  cellSize: { compact: "compact", spacious: "spacious" }, // calendar.js:48-49
  spaciousMinColumn: 140, // react-big-calendar.css `.rbc-time-view-resources .rbc-day-slot { min-width: 140px }`
  compactMinColumn: 50, // theme.scss `.calendar-widget.compact .rbc-time-view-resources .rbc-day-slot`

  // CalendarPopover.jsx:116-118 (width / min-height of the event popover)
  popoverWidth: 300,
  popoverMinHeight: 400,
  // componentsSlice.js canAddToParent toast for a restricted child (restrictedWidgetsConfig.js Calendar: [Calendar, Kanban])
  restrictedToast: (child) => `${child} is not compatible as a child component of Calendar`,
  kanbanDisplayName: "Kanban", // kanban.js:3
  buttonDisplayName: "Button",

  // Browser timezone every calendar spec pins (CDP) — no DST, so local-time slot math is machine-independent
  browserTimezone: "Asia/Kolkata",
};
