// Selectors for the Spinner widget (frontend/src/AppBuilder/Widgets/Spinner.jsx).
// Pass the runtime name (e.g. "spinner1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const spinnerSelector = {
  // RenderWidget.jsx:340-347 — inner box with BOX_PADDING
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Spinner.jsx:13 — `.spinner-container` (inline height + display:none when visibility is off)
  container: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"].spinner-container`,
  // Spinner.jsx:14 — the rotating ring `.spinner-border.spinner-border-<size>` (role="status")
  ring: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] .spinner-border`,
};
