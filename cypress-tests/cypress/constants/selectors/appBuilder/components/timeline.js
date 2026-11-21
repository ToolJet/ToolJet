// Selectors for the Timeline widget (frontend/src/AppBuilder/Widgets/Timeline.jsx).
// Pass the runtime name (e.g. "timeline1"). RenderWidget passes dataCy = componentName.
export const timelineSelector = {
  // RenderWidget.jsx — inner box (BOX_PADDING); its parent is the WidgetWrapper (`.ele-<id>`, grid height)
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Timeline.jsx:41-51 — `.card` root: display, height / min-height, overflow, box-shadow
  card: (name) => `[data-cy="draggable-widget-${name}"] .card[data-cy="${name}"]`,
  // Timeline.jsx:54-55 — the list (`list-timeline`, `list-timeline-simple` when hideDate)
  list: (name) => `[data-cy="draggable-widget-${name}"] ul.list-timeline`,
  // Timeline.jsx:57 — one <li> per data item
  items: (name) => `[data-cy="draggable-widget-${name}"] ul.list-timeline > li`,
  // Timeline.jsx:62-64 — date column (absent when hideDate)
  dates: (name) => `[data-cy="draggable-widget-${name}"] .list-timeline-time`,
  titles: (name) => `[data-cy="draggable-widget-${name}"] .list-timeline-title`,
};
