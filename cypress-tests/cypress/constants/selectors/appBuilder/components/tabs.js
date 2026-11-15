// Selectors for the Tabs widget (frontend/src/AppBuilder/Widgets/Tabs/Tabs.jsx).
// Pass the runtime name (e.g. "tabs1"). RenderWidget passes dataCy = componentName.
const box = (name) => `.canvas-component[data-cy="draggable-widget-${name}"]`;

export const tabsSelector = {
  // RenderWidget box (grid cell) — `.canvas-component` scopes away from nested child boxes
  draggableWidget: box,
  // Tabs.jsx:303-318 — `.card.tabs-component` root (data-disabled, inert, display none when hidden)
  root: (name) => `${box(name)} .tabs-component[data-cy="${name}"]`,
  // Tabs.jsx:344-363 — scrollable header row
  nav: (name) => `${box(name)} .tabs-component[data-cy="${name}"] > div > ul.nav`,
  // Tabs.jsx:364-446 — one <li> per visible tab; `.active` on the current one
  headers: (name) => `${box(name)} .tabs-component[data-cy="${name}"] > div > ul.nav > li.nav-item`,
  activeHeader: (name) => `${box(name)} .tabs-component[data-cy="${name}"] > div > ul.nav > li.nav-item.active`,
  // Tabs.jsx:331-342 / 449-460 — nav scroll arrows, siblings of the <ul> (only rendered on overflow)
  arrows: (name) => `${box(name)} .tabs-component[data-cy="${name}"] > div > div.px-2`,
  // Tabs.jsx:576-594 — the pane of one tab (`activetab` attribute = tab id)
  pane: (name, tabId) => `${box(name)} .tab-pane[activetab="${tabId}"]`,
  // SubContainer canvas of one tab (`canvas-<componentId>-<tabId>`; Tabs.jsx:182, 607-608)
  paneCanvas: (componentId, tabId) => `#canvas-${componentId}-${tabId}`,
};
