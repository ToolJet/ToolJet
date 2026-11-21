// Texts for the Date Range Picker (DaterangePicker) widget.
// Config: packages/widget-definitions/src/widgets/daterangepicker.js
// Runtime: frontend/src/AppBuilder/Widgets/Date/DaterangePicker.jsx (+ BaseDateComponent / DatepickerInput)
export const daterangePickerText = {
  displayName: "Date Range Picker", // daterangepicker.js:3
  componentType: "DaterangePicker", // daterangepicker.js:5
  defaultWidgetName: "daterangepicker1", // runtime name = config `name` lower-cased + 1 (daterangepicker.js:2)
  widgetPrefix: "daterangepicker",
  defaultSize: { width: 10, height: 40 }, // daterangepicker.js:6-9

  // Definition defaults the specs assert against
  defaultStartDate: "01/04/2022", // daterangepicker.js:425
  defaultEndDate: "10/04/2022", // daterangepicker.js:426
  format: "DD/MM/YYYY", // daterangepicker.js:427
  placeholder: "Select Date Range", // daterangepicker.js:428 (DaterangePicker.jsx:28 fallback)
  label: "Label", // daterangepicker.js:424

  // The field shows the range with an arrow (DaterangePicker.jsx:69-80); the exposed selectedDateRange joins
  // with a hyphen (utils.js formatExposedDateRange)
  displaySeparator: " → ",
  exposedSeparator: " - ",

  // Inspector labels
  labelPlaceholder: "Placeholder", // daterangepicker.js:57

  // Validation messages (frontend/src/AppBuilder/Widgets/Date/utils.js isDateValid / isDateRangeValid)
  errorMandatory: "Input is mandatory",
  errorOrder: "Start date cannot be greater than end date",

  // Range header month names (CustomDatePickerHeader.jsx:34-47)
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],

  // Browser timezone every date spec pins (CDP Emulation.setTimezoneOverride) — no DST, so the unix values
  // are deterministic on any CI machine.
  browserTimezone: "Asia/Kolkata",
};
