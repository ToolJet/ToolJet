// Selectors for the Email Input widget (BaseInput family).
//
// EmailInput renders through BaseInput (frontend/src/AppBuilder/Widgets/BaseComponents/BaseInput.jsx),
// which lower-cases the component name into every data-cy. Pass the runtime name (e.g. "emailinput1").
const cy_ = (name) => String(name).toLowerCase();

export const emailInputSelector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // BaseInput.jsx:208 → Label.jsx:98 `${dataCy}-label` (the <label>, carries width/maxWidth)
  label: (name) => `[data-cy="${cy_(name)}-label"]`,
  // BaseInput.jsx:212 — field container: background/border/radius/shadow live here
  field: (name) => `[data-cy="${cy_(name)}-actionable-section"]`,
  // BaseInput.jsx:274 — the <input type="email">
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
  // BaseInput.jsx:259 — left icon (TablerIcon <svg>)
  icon: (name) => `[data-cy="${cy_(name)}-icon"]`,
  // BaseInput.jsx:305 — rendered only while an error is revealed
  invalidFeedback: (name) => `[data-cy="${cy_(name)}-invalid-feedback"]`,
  // BaseInput.jsx:146 — clear button; scoped to the widget so a second input can't match
  clearButton: (name) => `[data-cy="draggable-widget-${name}"] .tj-input-clear-btn`,
  // BaseInput.jsx:171 — the relative-positioned row that holds label + field
  row: (name) => `[data-cy="draggable-widget-${name}"] .text-input`,
};

// Styles-tab controls for the label/field accordions (shared by the BaseInput family).
export const baseInputStyleSelector = {
  autoWidthCheckbox: '[data-cy="auto-width-checkbox"]',
  widthInput: '[data-cy="width-input-field"]',
  // CodeBuilder/Elements/Slider.jsx — Radix <Slider.Thumb className="SliderThumb"> next to the width box
  sliderThumb: ".SliderThumb",
  widthTypeDropdown: '[data-cy="dropdown-common"]',
  switchOption: (value) => `[data-cy="togglr-button-${value}"]`,
  borderRadiusInput: '[data-cy="border-radius-input"]',
};
