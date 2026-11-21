// Selectors for the Text Input widget (BaseInput family).
//
// TextInput renders through BaseInput (frontend/src/AppBuilder/Widgets/BaseComponents/BaseInput.jsx),
// which lower-cases the component name into every data-cy. Pass the runtime name (e.g. "textinput1").
const cy_ = (name) => String(name).toLowerCase();

export const textInputSelector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // BaseInput.jsx:208 → Label.jsx `${dataCy}-label` (the <label>, carries width/maxWidth)
  label: (name) => `[data-cy="${cy_(name)}-label"]`,
  // BaseInput.jsx:212 — field container: background/border/radius/shadow live here
  field: (name) => `[data-cy="${cy_(name)}-actionable-section"]`,
  // BaseInput.jsx:274 — the <input type="text">
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
  // BaseInput.jsx:305 — rendered only while an error is revealed
  invalidFeedback: (name) => `[data-cy="${cy_(name)}-invalid-feedback"]`,
  // BaseInput.jsx:146 — clear button has no data-cy; scoped to the widget so a second input can't match
  clearButton: (name) => `[data-cy="draggable-widget-${name}"] .tj-input-clear-btn`,
  // BaseInput.jsx:171 — the relative-positioned row that holds label + field (no data-cy)
  row: (name) => `[data-cy="draggable-widget-${name}"] .text-input`,
  // BaseInput.jsx:299 — Loader (no data-cy) inside the field while loading
  loader: (name) => `[data-cy="${cy_(name)}-actionable-section"] .tj-widget-loader`,
  // Styles tab › Deprecated styles (textinput.js:15)
  legacyInputSizeToggle: '[data-cy="legacy-input-size-toggle-button"]',
};
