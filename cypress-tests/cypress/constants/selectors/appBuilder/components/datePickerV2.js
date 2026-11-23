// Selectors for the Date Picker (DatePickerV2) widget. Pass the runtime name (e.g. "datepicker1").
// DatepickerInput.jsx lower-cases the component name into its data-cy values.
// The react-datepicker popup selectors are shared: Selectors/appBuilder/components/dateTimeCommon.
const cy_ = (name) => String(name).toLowerCase();

export const datePickerV2Selector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // DatepickerInput.jsx:97
  input: (name) => `[data-cy="${cy_(name)}-input-field"]`,
  // DatepickerInput.jsx:104
  icon: (name) => `[data-cy="${cy_(name)}-icon"]`,
  // DatepickerInput.jsx:143
  clearButton: (name) => `[data-cy="${cy_(name)}-clear-button"]`,
  // BaseDateComponent.jsx:155 — label + field row (no data-cy)
  root: (name) => `[data-cy="draggable-widget-${name}"] .datetimepicker-component`,
  // DatepickerInput.jsx:107-122 — the validation message <div> (no data-cy; mounted only while revealed)
  errorText: (name) => `[data-cy="draggable-widget-${name}"] .react-datepicker__input-container > span > div`,
};
