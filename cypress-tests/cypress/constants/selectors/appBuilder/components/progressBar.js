// Selectors for the ProgressBar widget (frontend/src/AppBuilder/Widgets/Progressbar/Progressbar.jsx).
// Pass the runtime name (e.g. "progressbar1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const progressBarSelector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING / padding:none
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Progressbar.jsx:183 — flex root carrying boxShadow (row / row-reverse / column)
  root: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`,
  // Label.jsx:83-99 — shared <label>; ProgressBar passes no dataCy, so it is matched by tag (id `<componentId>-label`)
  label: (name) => `[data-cy="draggable-widget-${name}"] [data-cy="${name}"] label`,
};
