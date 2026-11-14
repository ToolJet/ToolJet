// Texts for the Phone Input widget.
export const phoneInputText = {
  // packages/widget-definitions/src/widgets/phoneinput.js:3
  displayName: "Phone Input",
  defaultWidgetName: "phoneinput1",
  widgetPrefix: "phoneinput",
  // companion Text Input (Tab start point / exposed-value mirror) — packages/widget-definitions/src/widgets/textinput.js
  textInputDisplayName: "Text Input",
  textInputWidgetName: "textinput1",

  // Inspector labels (phoneinput.js property/validation displayNames)
  enableClearButton: "Enable clear button", // phoneinput.js:52
  loadingState: "Loading state", // phoneinput.js:58
  disable: "Disable", // phoneinput.js:77
  mandatory: "Make this field mandatory", // phoneinput.js:108
  defaultValue: "Default value", // phoneinput.js:37 (same label on the Text Input mirror)
  accordionAdditionalActions: "Additional Actions",
  accordionValidation: "Validation",

  // frontend/src/AppBuilder/_stores/slices/componentsSlice.js:934 validateWidget
  errorMandatory: "Field cannot be empty",

  // Portalled country menu box (CountrySelect.jsx:73-76): width 208, height 236, marginTop 2
  menuWidth: 208,
  menuHeight: 236,
  menuMarginTop: 2,

  // Default country when none is configured (PhoneInput.jsx:66 `defaultCountry = 'US'`)
  defaultDialCode: "+1",
  // Country picked through the menu search — option label is `${en[country]} +${callingCode}` (PhoneInput.jsx:103)
  searchCountry: { query: "Germany", optionLabel: "Germany +49", dialCode: "+49" },
  // A country reached by scrolling the list (alphabetical, PhoneInput.jsx:106) — far below the first page
  scrollCountry: { optionLabel: "Zimbabwe +263", dialCode: "+263" },
};
