// Selectors for the Calendar widget. Pass the runtime name (e.g. "calendar1").
// Calendar.jsx:138 puts `data-cy={dataCy}` (= the widget name) on the root `.scrollbar-container`; NOTHING inside
// the react-big-calendar tree (toolbar, cells, slots, events) or the event popover carries a data-cy — every inner
// selector below is a react-big-calendar class (see the data-cy gap list in the Calendar report).
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const calendarSelector = {
  draggableWidget: box,
  // Calendar.jsx:130-140 — root div (display / border / radius inline styles)
  root: (name) => `[data-cy="${String(name).toLowerCase()}"]`,
  // Calendar.jsx:141-147 — <ReactCalendar className="calendar-widget …"> → `.rbc-calendar`
  calendar: (name) => `${box(name)} .rbc-calendar`,
  toolbar: (name) => `${box(name)} .rbc-toolbar`,
  toolbarButtons: (name) => `${box(name)} .rbc-toolbar button`,
  toolbarLabel: (name) => `${box(name)} .rbc-toolbar-label`,
  activeViewButton: (name) => `${box(name)} .rbc-toolbar button.rbc-active`,

  // month view
  monthView: (name) => `${box(name)} .rbc-month-view`,
  monthHeader: (name) => `${box(name)} .rbc-month-header .rbc-header`,
  monthRow: (name) => `${box(name)} .rbc-month-row`,
  // day background cell `col` (0 = Sunday) of month row `row`
  monthCell: (name, row, col) => `${box(name)} .rbc-month-row:eq(${row}) .rbc-day-bg:eq(${col})`,
  selectedCell: (name) => `${box(name)} .rbc-selected-cell`,
  todayCell: (name) => `${box(name)} .rbc-day-bg.rbc-today`,

  // week / day (time grid) views
  timeView: (name) => `${box(name)} .rbc-time-view`,
  resourceTimeView: (name) => `${box(name)} .rbc-time-view.rbc-time-view-resources`,
  timeContent: (name) => `${box(name)} .rbc-time-content`,
  gutterLabel: (name) => `${box(name)} .rbc-time-gutter .rbc-label`,
  dayColumn: (name) => `${box(name)} .rbc-time-content .rbc-day-slot`,
  // half-hour slot `slot` (0-based from the band start) of day column `col`
  timeSlot: (name, col, slot) => `${box(name)} .rbc-time-content .rbc-day-slot:eq(${col}) .rbc-time-slot:eq(${slot})`,
  slotSelection: (name) => `${box(name)} .rbc-slot-selection`,
  resourceHeader: (name) => `${box(name)} .rbc-time-header .rbc-row-resource .rbc-header`,
  dayHeader: (name) => `${box(name)} .rbc-time-header-cell .rbc-header`,

  event: (name) => `${box(name)} .rbc-event`,

  // CalendarPopover.jsx:112-128 — `<div id="<componentId>-popover" class="popover …">` + its sub-canvas
  popover: (name) => `${box(name)} .popover[id$="-popover"]`,
  popoverCanvas: (name) => `${box(name)} .popover[id$="-popover"] [data-cy="real-canvas"]`,

  // a widget that threw while rendering is replaced by the shared inline error boundary (no draggable box)
  // (the outer canvas wrapper is `.ele-<componentId>`; the Calendar root div reuses the same id)
  widgetWrapper: (componentId) => `.ele-${componentId}`,
  errorBoundary: (componentId) => `.ele-${componentId} [data-cy="error-boundary-fallback"]`,
};
