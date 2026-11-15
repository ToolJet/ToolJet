// Selectors for the Time Picker (TimePicker) widget. Pass the runtime name (e.g. "timepicker1").
// TimePicker.jsx:229 forwards `dataCy` to BaseDateComponent; DatepickerInput.jsx lower-cases it into its data-cy values.
// The popup is react-datepicker portalled into #component-portal — generic popup nodes are in dateTimeCommon.js.
const cy_ = (name) => String(name).toLowerCase();
const box = (name) => `[data-cy="draggable-widget-${name}"]`;
const POPUP = "#component-portal .react-datepicker-popper";

export const timePickerSelector = {
  draggableWidget: box,
  // DatepickerInput.jsx:97
  input: (name) => `[data-cy="${cy_(name)}-input-field"]`,
  // DatepickerInput.jsx:104
  icon: (name) => `[data-cy="${cy_(name)}-icon"]`,
  // DatepickerInput.jsx:143
  clearButton: (name) => `[data-cy="${cy_(name)}-clear-button"]`,
  // BaseDateComponent.jsx:155 — label + field row (no data-cy)
  root: (name) => `${box(name)} .datetimepicker-component`,
  // DatepickerInput.jsx:107-121 — the validation message <div> (no data-cy; mounted only while revealed)
  errorText: (name) => `${box(name)} .react-datepicker__input-container > span > div`,

  // TimePicker.jsx:166-171 popperClassName — the time-only popup (no data-cy)
  timePopup: `${POPUP}.cc-timepicker-widget`,
  // react-datepicker's time-only dialog (showTimeSelectOnly, TimePicker.jsx:178)
  timeOnlyDialog: `${POPUP} .react-datepicker--time-only`,
  // TimepickerInput.jsx:95-108 — the column wrappers + the auto-hiding overlay scrollbar of each column
  timeColWrap: `${POPUP} .custom-time-input .time-colwrap`,
  timeScrollbar: `${POPUP} .custom-time-input .time-scrollbar`,
  timeScrollbarThumb: `${POPUP} .custom-time-input .time-scrollbar-thumb`,
  // TimepickerInput.jsx:174,190,207,224,238 — items outside minTime/maxTime
  disabledTimeItem: ".disabled-time",
};
