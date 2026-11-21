// Selectors for the Icon widget (frontend/src/AppBuilder/Widgets/Icon.jsx).
// Pass the runtime name (e.g. "icon1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const iconSelector = {
  // RenderWidget.jsx:340-347 — inner box: BOX_PADDING / padding:none, carries the `disabled` class
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Icon.jsx:97-118 — `.icon-widget` root: flex box, alignment, box shadow, cursor, onClick/onMouseEnter
  root: (name) => `[data-cy="${name}"].icon-widget`,
  // Icon.jsx:119-128 — the Tabler <svg> (TablerIcon replaces the tabler-icon-<name> class; match by path d)
  svg: (name) => `[data-cy="${name}"].icon-widget > svg`,
};
