// Texts for the Time Picker (TimePicker) widget.
// Config: packages/widget-definitions/src/widgets/timepicker.js
// Runtime: frontend/src/AppBuilder/Widgets/Date/TimePicker.jsx (+ BaseDateComponent / DatepickerInput / TimepickerInput)
export const timePickerText = {
  displayName: "Time Picker", // timepicker.js:3
  componentType: "TimePicker", // timepicker.js:5
  defaultWidgetName: "timepicker1", // runtime name = config `name` lower-cased + 1 (timepicker.js:2)
  widgetPrefix: "timepicker",
  defaultSize: { width: 10, height: 40 }, // timepicker.js:6-9

  // Definition defaults the specs assert against
  defaultValue: "00:00", // timepicker.js:375
  timeFormat: "HH:mm", // timepicker.js:377 (runtime-read; no inspector control)
  placeholder: "Select time", // timepicker.js:376 (TimePicker.jsx:27 fallback)
  label: "Label", // timepicker.js:374

  // Inspector labels
  labelPlaceholder: "Placeholder", // timepicker.js:48

  // Validation messages (frontend/src/AppBuilder/Widgets/Date/utils.js isDateValid; TimePicker.jsx:155)
  errorMandatory: "Input is mandatory",
  errorInvalid: "Invalid time",
  errorMinTime: (t) => `Selected time is less than minimum time (${t})`,
  errorMaxTime: (t) => `Selected time is greater than maximum time (${t})`,

  // Time panel headers (TimepickerInput.jsx:161-163)
  timeHeaders24h: ["Hours", "Minutes"],
  timeHeaders12h: ["Hours", "Minutes", "am/pm"],
  hours12: ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"], // TimepickerInput.jsx:183

  // Browser timezone every time spec pins (CDP Emulation.setTimezoneOverride) — no DST, so the widget's
  // local-time math is the same on any CI machine.
  browserTimezone: "Asia/Kolkata",
};
