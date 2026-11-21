// Selectors for the Link widget (frontend/src/AppBuilder/Widgets/Link/Link.jsx).
// Pass the runtime name (e.g. "link1"). RenderWidget passes dataCy = componentName (RenderWidget.jsx:367).
export const linkSelector = {
  // WidgetWrapper grid box — the one that moves/resizes on the canvas
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Link.jsx:152-157 — `.link-widget` wrapper: flex box, `overflow: auto` (theme.scss .link-widget), hover var
  wrapper: (name) => `[data-cy="${name}"].link-widget`,
  // Link.jsx:158 — the <a> (href / target / aria-disabled)
  anchor: (name) => `[data-cy="${name}"].link-widget > a`,
  // Link.jsx:185 — `display: block` container of the icon box + text
  textBlock: (name) => `[data-cy="${name}"].link-widget > a > span`,
  // Link.jsx:197 — inline-flex icon box (zero-width space + TablerIcon)
  iconBox: (name) => `[data-cy="${name}"].link-widget > a > span > span:not(.link-text)`,
  // Link.jsx:199 — the Tabler <svg>
  icon: (name) => `[data-cy="${name}"].link-widget > a > span > span:not(.link-text) svg`,
  // Link.jsx:211-213 — `.link-text`, the only pointer hit-target (link.scss)
  linkText: (name) => `[data-cy="${name}"].link-widget .link-text`,
};
