// Selectors for the Password Input widget (BaseInput family).
//
// PasswordInput (frontend/src/AppBuilder/Widgets/PasswordInput.jsx) renders through BaseInput
// (frontend/src/AppBuilder/Widgets/BaseComponents/BaseInput.jsx), which lower-cases the component name into
// every data-cy. Pass the runtime name (e.g. "passwordinput1").
const cy_ = (name) => String(name).toLowerCase();

export const passwordInputSelector = {
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // BaseInput.jsx:208 → Label.jsx `${dataCy}-label` (the <label>, carries width/maxWidth)
  label: (name) => `[data-cy="${cy_(name)}-label"]`,
  // BaseInput.jsx:212 — field container: background/border/radius/shadow live here
  field: (name) => `[data-cy="${cy_(name)}-actionable-section"]`,
  // BaseInput.jsx:274 — the <input type="password|text">
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
  // BaseInput.jsx:259 — left icon (TablerIcon <svg>, IconLock by default)
  icon: (name) => `[data-cy="${cy_(name)}-icon"]`,
  // BaseInput.jsx:305 — rendered only while an error is revealed
  invalidFeedback: (name) => `[data-cy="${cy_(name)}-invalid-feedback"]`,
  // PasswordInput.jsx:20 — the reveal (eye) toggle. Its data-cy is NOT widget-scoped
  // (`password-visibility-icon` on every Password Input), so scope it under the widget wrapper.
  revealToggle: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="password-visibility-icon"]`,
  // BaseInput.jsx:171 — the relative-positioned row that holds label + field
  row: (name) => `[data-cy="draggable-widget-${name}"] .text-input`,
};
