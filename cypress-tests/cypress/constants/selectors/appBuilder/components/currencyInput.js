// Selectors for the Currency Input widget.
//
// CurrencyInput renders through its own component (frontend/src/AppBuilder/Widgets/PhoneCurrency/CurrencyInput.jsx),
// not BaseInput, but keeps the same lower-cased data-cy scheme. Pass the runtime name (e.g. "currencyinput1").
const cy_ = (name) => String(name).toLowerCase();

export const currencyInputSelector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // WidgetWrapper — canvas wrapper (ancestor of the draggable): id = component id, `.active-target` while selected
  wrapper: "[component-type]",
  // CurrencyInput.jsx:265 → Label.jsx `${dataCy}-label`
  label: (name) => `[data-cy="${cy_(name)}-label"]`,
  // CurrencyInput.jsx:284 — the row holding the currency select + the amount field
  field: (name) => `[data-cy="${cy_(name)}-actionable-section"]`,
  // CurrencyInput.jsx:362 — the react-currency-input-field <input>
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
  // CountrySelect.jsx:125 — wrapper around the react-select currency picker
  currencySelect: (name) => `[data-cy="${cy_(name)}-country-select-dropdown"]`,
  // react-select control inside the picker (classNamePrefix country-<componentId>, CountrySelect.jsx:160)
  currencyControl: (name) => `[data-cy="${cy_(name)}-country-select-dropdown"] [class*="__control"]`,
  // CustomValueContainer.jsx:30 — the currency prefix shown next to the flag
  prefix: (name) => `[data-cy="${cy_(name)}-country-select-dropdown"] [class*="__value-container"] span`,
  // CurrencyInput.jsx:397 — rendered only while an error is revealed
  invalidFeedback: (name) => `[data-cy="${cy_(name)}-invalid-feedback"]`,
  // CurrencyInput.jsx:366-368 — clear button; scoped to the widget so a second input can't match
  clearButton: (name) => `[data-cy="draggable-widget-${name}"] .tj-input-clear-btn`,
  // CurrencyInput.jsx:393 → ToolJetUI/Loader/Loader.jsx:11
  loader: (name) => `[data-cy="draggable-widget-${name}"] .tj-widget-loader`,
  // CurrencyInput.jsx:249-257 — the relative-positioned row that holds label + field
  row: (name) => `[data-cy="draggable-widget-${name}"] .text-input`,

  // Portalled menu (menuPortalTarget=document.body, CountrySelect.jsx:134) — keyed by the component id
  menu: (componentId) => `.country-${componentId}__menu`,
  option: (componentId) => `.country-${componentId}__option`,
  // CustomMenuList.jsx:23-29 — search box at the top of the menu
  menuSearch: (componentId) => `.country-${componentId}__menu .currency-select-search-box`,
};

// Inspector controls specific to Currency Input (RightSideBar/Inspector/Components/CurrencyInput/CurrencyInput.jsx)
export const currencyInputInspectorSelector = {
  // CurrencyInput inspector:117 — the block label; its _ui/Select (classNamePrefix includes "react-select") sits beside it
  formLabel: "label.form-label",
  selectControl: ".react-select__control",
  selectOption: ".react-select__option",
};
