// Texts for the Date Picker (DatePickerV2) widget.
// Config: packages/widget-definitions/src/widgets/datepickerV2.js
// Runtime: frontend/src/AppBuilder/Widgets/Date/DatePickerV2.jsx (+ BaseDateComponent / DatepickerInput)
export const datePickerV2Text = {
  displayName: "Date Picker", // datepickerV2.js:3
  componentType: "DatePickerV2", // datepickerV2.js:5
  defaultWidgetName: "datepicker1", // runtime name = config `name` lower-cased + 1 (datepickerV2.js:2)
  widgetPrefix: "datepicker",
  defaultSize: { width: 10, height: 40 }, // datepickerV2.js:6-9

  // Definition defaults the specs assert against
  defaultValue: "01/01/2022", // datepickerV2.js:402
  dateFormat: "DD/MM/YYYY", // datepickerV2.js:404
  placeholder: "Select date", // datepickerV2.js:403 (DatePickerV2.jsx:35 fallback)

  // Inspector labels
  labelPlaceholder: "Placeholder", // datepickerV2.js:60

  // Validation messages (frontend/src/AppBuilder/Widgets/Date/utils.js isDateValid; DatePickerV2.jsx:180)
  errorMandatory: "Input is mandatory",
  errorInvalidDate: "Invalid date",

  // Popup header month names (CustomDatePickerHeader.jsx)
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],

  // Browser timezone the date specs pin (CDP Emulation.setTimezoneOverride) — no DST, so the
  // widget's local-midnight values are deterministic on any CI machine.
  browserTimezone: "Asia/Kolkata",
  browserOffset: "+05:30",
  // A DST zone for the timezone-display scenario: EST -05:00 in January, EDT -04:00 in July
  dstTimezone: "America/New_York",
};
