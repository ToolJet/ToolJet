export const datePickerSelector = {
  draggableDatePicker: "[data-cy='dragable-widget-datepicker']",
  calendarYearSelect: ".react-datepicker__year-select",
  calendarMonthSelect: ".react-datepicker__month-select",
  calendarDaySelect: ".react-datepicker__day",
  calendarTimeInput: "input.react-datepicker-time__input",
  validationFeedbackMessage: "[data-cy=date-picker-invalid-feedback]",
  calendarMonth: "[aria-label*='month']",
  calendarDayOutsideMonth: "[class*='outside-month']",
  // DatePickerV2 input — data-cy is `<componentName>-input-field`, lowercased.
  // source: frontend/src/AppBuilder/Widgets/Date/DatepickerInput.jsx:96
  v2Input: (name) => `[data-cy="${name.toLowerCase()}-input-field"]`,
  // source: frontend/src/AppBuilder/Widgets/Date/DatepickerInput.jsx:142
  v2ClearButton: (name) => `[data-cy="${name.toLowerCase()}-clear-button"]`,
};
