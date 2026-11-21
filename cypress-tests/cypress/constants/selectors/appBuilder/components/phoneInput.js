// Selectors for the Phone Input widget.
//
// PhoneInput renders through its own component (frontend/src/AppBuilder/Widgets/PhoneCurrency/PhoneInput.jsx),
// not BaseInput, but keeps the same lower-cased data-cy scheme. Pass the runtime name (e.g. "phoneinput1").
const cy_ = (name) => String(name).toLowerCase();

export const phoneInputSelector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // WidgetWrapper.jsx:252-267 — the canvas wrapper (ancestor of the draggable): id = component id,
  // `.active-target` while selected. Reach it with .closest(phoneInputSelector.wrapper).
  wrapper: "[component-type]",
  // PhoneInput.jsx:259 → Label.jsx `${dataCy}-label`
  label: (name) => `[data-cy="${cy_(name)}-label"]`,
  // PhoneInput.jsx:286 — the row holding the country select + the number field
  field: (name) => `[data-cy="${cy_(name)}-actionable-section"]`,
  // PhoneInput.jsx:343 — the react-phone-number-input <input type="tel">
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
  // CountrySelect.jsx:125 — wrapper around the react-select country picker
  countrySelect: (name) => `[data-cy="${cy_(name)}-country-select-dropdown"]`,
  // react-select control inside the country picker (classNamePrefix country-<componentId>, CountrySelect.jsx:160)
  countryControl: (name) => `[data-cy="${cy_(name)}-country-select-dropdown"] [class*="__control"]`,
  // CustomValueContainer.jsx:30 — the dial code shown next to the flag
  dialCode: (name) => `[data-cy="${cy_(name)}-country-select-dropdown"] [class*="__value-container"] span`,
  // PhoneInput.jsx:378 — rendered only while an error is revealed
  invalidFeedback: (name) => `[data-cy="${cy_(name)}-invalid-feedback"]`,
  // PhoneInput.jsx:347-349 — clear button; scoped to the widget so a second input can't match
  clearButton: (name) => `[data-cy="draggable-widget-${name}"] .tj-input-clear-btn`,
  // PhoneInput.jsx:374 → ToolJetUI/Loader/Loader.jsx:11
  loader: (name) => `[data-cy="draggable-widget-${name}"] .tj-widget-loader`,
  // PhoneInput.jsx:244 — the relative-positioned row that holds label + field
  row: (name) => `[data-cy="draggable-widget-${name}"] .text-input`,

  // Inspector › Properties tab (the Styles tab is commonWidgetSelector.buttonStylesEditorSideBar)
  propertiesTab: "#inspector .nav-link:eq(0)",

  // Portalled menu (menuPortalTarget=document.body, CountrySelect.jsx:134) — keyed by the component id
  menu: (componentId) => `.country-${componentId}__menu`,
  menuList: (componentId) => `.country-${componentId}__menu-list`,
  option: (componentId) => `.country-${componentId}__option`,
  selectedOption: (componentId) => `.country-${componentId}__option--is-selected`,
  // any open country menu, whatever the component id
  anyCountryMenu: '[class*="country-"][class*="__menu"]',
  // CustomMenuList.jsx:23-29 — search box at the top of the menu
  menuSearch: (componentId) => `.country-${componentId}__menu .currency-select-search-box`,
};
