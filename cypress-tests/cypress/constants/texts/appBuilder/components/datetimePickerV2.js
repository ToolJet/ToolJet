// Texts for the Date Time Picker (DatetimePickerV2) widget.
// Config: packages/widget-definitions/src/widgets/datetimepickerV2.js
// Runtime: frontend/src/AppBuilder/Widgets/Date/DatetimePickerV2.jsx (+ BaseDateComponent / DatepickerInput)
export const datetimePickerV2Text = {
  displayName: "Date Time Picker", // datetimepickerV2.js:4
  componentType: "DatetimePickerV2", // datetimepickerV2.js:6
  defaultWidgetName: "datetimepicker1", // runtime name = config `name` lower-cased + 1 (datetimepickerV2.js:2)
  widgetPrefix: "datetimepicker",
  defaultSize: { width: 10, height: 40 }, // datetimepickerV2.js:7-10

  // Definition defaults the specs assert against
  defaultValue: "01/01/2022", // datetimepickerV2.js:448
  dateFormat: "DD/MM/YYYY", // datetimepickerV2.js:450
  timeFormat: "HH:mm", // datetimepickerV2.js:451
  placeholder: "Select date and time", // datetimepickerV2.js:449 (DatetimePickerV2.jsx:57 fallback)

  // Inspector labels
  labelPlaceholder: "Placeholder", // datetimepickerV2.js:75
  labelDefaultValue: "Default value", // datetimepickerV2.js:84

  // Validation message (frontend/src/AppBuilder/Widgets/Date/utils.js isDateValid)
  errorMandatory: "Input is mandatory",

  // Popup header + time panel (CustomDatePickerHeader.jsx:34-47, TimepickerInput.jsx:161-163)
  timeHeaders24h: ["Hours", "Minutes"],
  timeHeaders12h: ["Hours", "Minutes", "am/pm"],
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],

  // Popup positioning (BaseDateComponent.jsx:202-206): bottom-start, offset mainAxis -7, no flip
  popupOffsetPx: -7,

  // Browser timezone every date spec pins (CDP Emulation.setTimezoneOverride) — no DST, so the
  // widget's local-offset math is deterministic on any CI machine.
  browserTimezone: "Asia/Kolkata",
  browserOffset: "+05:30",
};
