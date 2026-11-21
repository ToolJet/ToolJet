// Selectors for the Pagination widget (frontend/src/AppBuilder/Widgets/Pagination/Pagination.jsx).
// Pass the runtime name (e.g. "pagination1"). RenderWidget passes dataCy = componentName.
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const paginationSelector = {
  // RenderWidget box (WidgetWrapper); its inner node carries the shared `disabled` class while disabled
  draggableWidget: box,
  // Pagination.jsx:145-155 — role=navigation root (d-flex, justify-content = alignment, box shadow)
  root: (name) => `${box(name)} [data-cy="${name}"]`,
  // Pagination.jsx:165-174 — the control row (ul.pagination, overflow-x: clip, min-width: 0); unmounted while loading
  list: (name) => `${box(name)} ul.pagination`,
  // Pagination.jsx:175-210, 393-435 — every item of the row (operators, page numbers, ellipses)
  items: (name) => `${box(name)} ul.pagination > li`,
  // Pagination.jsx:331-334 — an operator <li> by its aria-label (see paginationText.operators)
  operator: (name, ariaLabel) => `${box(name)} ul.pagination > li[aria-label="${ariaLabel}"]`,
  // Pagination.jsx:395 — the highlighted page number
  activeItem: (name) => `${box(name)} ul.pagination > li.active`,
};
