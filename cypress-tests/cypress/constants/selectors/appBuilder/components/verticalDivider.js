// Selectors for the Vertical Divider widget (frontend/src/AppBuilder/Widgets/VerticalDivider.jsx).
// Pass the runtime name (e.g. "verticaldivider1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const verticalDividerSelector = {
  // RenderWidget.jsx:339-346 — inner box: BOX_PADDING / padding:none
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // VerticalDivider.jsx:10-14 — full-size flex root (display flex / none, justify-content center)
  root: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`,
  // VerticalDivider.jsx:16-33 — the only painted line
  line: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] > div`,
};
