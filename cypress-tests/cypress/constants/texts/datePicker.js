export const datePickerText = {
  customValidation: (name, message) => {
    return [
      "{{",
      `moment(components.${name}.value,'DD/MM/YYYY').isAfter(moment()) ? true : '${message}'}}`,
    ];
  },

  datepicker1: "datepicker1",
  labelDefaultValue: "Default Value",
  labelformat: "Format",
  labelEnableDateSection: "Enable date selection?",
  labelEnableTimeSection: "Enable time selection?",
  labelDisabledDates: "Disabled dates",

  noEventMessage: "No event handlers",
  defaultTime: "12:00 AM",
};
