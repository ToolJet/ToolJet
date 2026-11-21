// Selectors for the Number Input widget (BaseInput family).
//
// NumberInput (frontend/src/AppBuilder/Widgets/NumberInput.jsx) renders through BaseInput with
// inputType="number", which lower-cases the component name into every data-cy.
// Pass the runtime name (e.g. "numberinput1").
const cy_ = (name) => String(name).toLowerCase();

export const numberInputSelector = {
  // AppCanvas widget wrapper
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // BaseInput.jsx:274 — the <input type="number">
  input: (name) => `[data-cy="${cy_(name)}-input"]`,
  // NumberInput.jsx:81/88 — the up/down step arrows (no data-cy; rendered only while step controls are on)
  stepArrows: (name) => `[data-cy="draggable-widget-${name}"] .number-input-arrow`,
};
