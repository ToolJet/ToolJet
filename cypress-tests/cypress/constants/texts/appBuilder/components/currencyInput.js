// Texts for the Currency Input widget.
export const currencyInputText = {
  // packages/widget-definitions/src/widgets/currencyinput.js:3
  displayName: "Currency Input",
  defaultWidgetName: "currencyinput1",
  widgetPrefix: "currencyinput",

  // Inspector labels (currencyinput.js property/validation displayNames)
  label: "Label", // currencyinput.js:24
  decimalPlaces: "Decimal places", // currencyinput.js:49
  enableClearButton: "Enable clear button", // currencyinput.js:64
  loadingState: "Loading state", // currencyinput.js:70
  disable: "Disable", // currencyinput.js:90
  mandatory: "Make this field mandatory", // currencyinput.js:120
  accordionAdditionalActions: "Additional Actions",
  accordionValidation: "Validation",
  // RightSideBar/Inspector/Components/CurrencyInput/CurrencyInput.jsx:117
  numberFormat: "Number Format",
  // PhoneCurrency/constants.js:7 NUMBER_FORMATS.eu.name
  numberFormatEuropean: "European (eg. 1.234.567,89)",

  // Default value '0' (currencyinput.js:363) rendered by the library
  defaultDisplay: "0",

  // Currency menu option labels: `${prefix} (${currency})` (CurrencyInput.jsx:97, PhoneCurrency/constants.js CurrencyMap)
  usd: { code: "US", prefix: "$", option: "$ (USD)", country: "United States" }, // constants.js:662-665
  gbp: { prefix: "£", option: "£ (GBP)", country: "United Kingdom" }, // constants.js:297-300
  jpy: { prefix: "￥", option: "￥ (JPY)", country: "Japan" }, // constants.js:382-385
  eur: { prefix: "€", option: "€ (EUR)", country: "European Union" }, // constants.js:287-290

  // CountrySelect.jsx:73-74 — portalled menu size
  menuWidth: 208,
  menuHeight: 236,
  menuMarginTop: 2, // CountrySelect.jsx:76

  // frontend/src/AppBuilder/_stores/slices/componentsSlice.js validateWidget
  errorMandatory: "Field cannot be empty",

  // probe widgets
  textDisplayName: "Text",
  textWidgetName: "text1",
  textInputDisplayName: "Text Input",
  textInputWidgetName: "textinput1",
};
