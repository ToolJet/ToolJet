// Selectors shared by the date/time widgets (DatetimePickerV2, DatePickerV2, DaterangePicker, TimePicker).
//
// The popup is react-datepicker, portalled into `#component-portal` (BaseDateComponent.jsx:207) — only one
// popup is open at a time, so these are scoped to the portal, not to a widget. None of these nodes carry a
// data-cy (see the data-cy gap list in the DatetimePickerV2 report).
const POPUP = "#component-portal .react-datepicker-popper";

export const dateTimeCommonSelector = {
  // BaseDateComponent.jsx:190-206 + DatetimePickerV2.jsx:403 popperClassName
  popup: POPUP,
  calendar: `${POPUP} .react-datepicker`,
  // react-datepicker month grid (left) and the time panel that hosts customTimeInput (right)
  monthContainer: `${POPUP} .react-datepicker__month-container`,
  timePanel: `${POPUP} .react-datepicker__input-time-container`,
  // a day of the shown month (outside-month cells excluded), e.g. day(20)
  day: (n) =>
    `${POPUP} .react-datepicker__day--${String(n).padStart(3, "0")}:not(.react-datepicker__day--outside-month)`,
  selectedDay: `${POPUP} .react-datepicker__day--selected`,
  // CustomDatePickerHeader.jsx:162,177,182,225
  prevArrow: `${POPUP} .tj-datepicker-widget-left`,
  nextArrow: `${POPUP} .tj-datepicker-widget-right`,
  monthSelector: `${POPUP} .tj-datepicker-widget-month-selector`,
  yearSelector: `${POPUP} .tj-datepicker-widget-year-selector`,
  // month / year picker modes (DatetimePickerV2.jsx:404-406, 432-433)
  monthText: `${POPUP} .react-datepicker__month-text`,
  yearText: `${POPUP} .react-datepicker__year-text`,
  // TimepickerInput.jsx:159-249 — one `.time-col` per column (hours, minutes, am/pm)
  timeHeader: `${POPUP} .custom-time-input .time-header`,
  timeColumn: `${POPUP} .custom-time-input .time-col`,
  timeItem: ".time-item",
  selectedTimeItem: ".selected-time",
};
