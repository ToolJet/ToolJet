// Selectors for the Text Area widget (BaseInput family).
//
// TextArea (frontend/src/AppBuilder/Widgets/TextArea.jsx) renders through BaseInput with
// inputType="textarea", which lower-cases the component name into every data-cy.
// Pass the runtime name (e.g. "textarea1").
const cy_ = (name) => String(name).toLowerCase();

export const textAreaSelector = {
  // AppCanvas widget wrapper — the box the grid lays out and dynamic height resizes
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // BaseInput.jsx:212 — field container (padding + border around the <textarea>)
  field: (name) => `[data-cy="${cy_(name)}-actionable-section"]`,
  // BaseInput.jsx:21 + :274 — the <textarea rows={1}>
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
};
