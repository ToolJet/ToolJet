// Selectors for the Checkbox widget.
//
// RenderWidget.jsx:367 passes dataCy={componentName}; Checkbox.jsx:205 puts it on the inner row
// (box + label). Pass the runtime name (e.g. "checkbox1").
export const checkboxSelector = {
  // AppCanvas widget wrapper
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Checkbox.jsx:193-205 — the row holding the box and the label (display:none while hidden)
  row: (name) => `[data-cy="${name}"]`,
  // Checkbox.jsx:220 — the visually hidden native <input type="checkbox"> (no data-cy of its own)
  input: (name) => `[data-cy="${name}"] .form-check-input`,
};
