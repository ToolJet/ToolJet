// Selectors for the Horizontal Divider widget (frontend/src/AppBuilder/Widgets/Divider.jsx).
// Pass the runtime name (e.g. "horizontaldivider1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367),
// so the same name selector also fits the Vertical Divider (VerticalDivider.jsx:14).
export const dividerSelector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING / padding:none
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Divider.jsx:57-65 (no label) / 73-83 (label) — flex root: display, overflow, justify-content
  root: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`,
  // Divider.jsx:86/102/110 — the label <span>
  label: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] span`,
};
