// Selectors for the Date Range Picker (DaterangePicker) widget. Pass the runtime name (e.g. "daterangepicker1").
//
// DaterangePicker.jsx does NOT forward `dataCy` to BaseDateComponent (DaterangePicker.jsx:376-394), so the input /
// icon / clear button render `data-cy="undefined-input-field"` etc. (DatepickerInput.jsx:97,104,143) — duplicated
// across every range picker on a page. These selectors scope stable classes under the widget's
// `draggable-widget-<name>` box instead (see the data-cy gap list in the DaterangePicker report).
const box = (name) => `[data-cy="draggable-widget-${name}"]`;
const POPUP = "#component-portal .react-datepicker-popper";

export const daterangePickerSelector = {
  draggableWidget: box,
  // DatepickerInput.jsx:58-98
  input: (name) => `${box(name)} input.table-column-datepicker-input`,
  // DatepickerInput.jsx:123-147 (rendered only while showClearBtn and a value is shown)
  clearButton: (name) => `${box(name)} .tj-input-clear-btn`,
  // BaseDateComponent.jsx:155 — label + field row
  root: (name) => `${box(name)} .datetimepicker-component`,
  // DatepickerInput.jsx:107-121 — the validation message <div> (mounted only while revealed)
  errorText: (name) => `${box(name)} .react-datepicker__input-container > span > div`,

  // The open popup (one at a time, portalled — BaseDateComponent.jsx:207). DaterangePicker.jsx:305 popperClassName.
  rangePopup: `${POPUP}.tj-daterange-widget`,
  // CustomDatePickerHeader.jsx:188-218 — one month + one year react-select per month container
  monthHeaderValues: `${POPUP} .daterangepicker-header .react-select__single-value`,
  // react-datepicker day cell inside ONE month container (outside-month cells excluded): dayCell(20)
  dayCell: (n) => `.react-datepicker__day--${String(n).padStart(3, "0")}:not(.react-datepicker__day--outside-month)`,
  // range state classes (react-datepicker 7)
  rangeStart: `${POPUP} .react-datepicker__day--range-start:not(.react-datepicker__day--outside-month)`,
  rangeEnd: `${POPUP} .react-datepicker__day--range-end:not(.react-datepicker__day--outside-month)`,
  inRange: `${POPUP} .react-datepicker__day--in-range:not(.react-datepicker__day--outside-month)`,
  inSelectingRange: `${POPUP} .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--outside-month)`,
  keyboardSelected: `${POPUP} .react-datepicker__day--keyboard-selected:not(.react-datepicker__day--outside-month)`,
};
