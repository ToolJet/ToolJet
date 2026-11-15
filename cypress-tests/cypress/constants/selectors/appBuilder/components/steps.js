// Selectors for the Steps widget (frontend/src/AppBuilder/Widgets/Steps.jsx).
// Pass the runtime name (e.g. "steps1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const stepsSelector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING / padding:none, `disabled` class when disabled
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Steps.jsx:164-181 — role=navigation root carrying the colour CSS variables and box shadow
  root: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`,
  // Steps.jsx:182 — flex row holding milestones and connectors
  line: (name) => `[data-cy="draggable-widget-${name}"] .progress-line-container`,
  // Steps.jsx:200-242 — one native <button> per visible step
  milestones: (name) => `[data-cy="draggable-widget-${name}"] button.milestone`,
  // Steps.jsx:245 — connector between two milestones
  connectors: (name) => `[data-cy="draggable-widget-${name}"] .step-connector`,
  // Steps.jsx:232-238 — Label-variant caption under a dot
  labels: (name) => `[data-cy="draggable-widget-${name}"] .label`,
  // ToolTip.jsx:25-31 — react-bootstrap tooltip (portalled to body)
  tooltip: ".tooltip.show",
  // Bootstrap 5.3 tooltip arrow (react-bootstrap 2.x)
  tooltipArrow: ".tooltip-arrow",
};
