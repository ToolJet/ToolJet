// Selectors for the Navigation widget (frontend/src/AppBuilder/Widgets/Navigation/Navigation.jsx) and its Inspector
// menu-items tree (frontend/src/AppBuilder/RightSideBar/Inspector/Components/Navigation/**).
// Pass the runtime name (e.g. "navigation1"). RenderWidget passes dataCy = componentName.
export const navigationSelector = {
  // RenderWidget.jsx — inner box; its parent is the WidgetWrapper (grid box)
  draggableWidget: (name) => `[data-cy="draggable-widget-${name}"]`,
  // Navigation.jsx:786-800 — `.navigation-widget` root (role=navigation, display:none while hidden)
  root: (name) => `[data-cy="draggable-widget-${name}"] .navigation-widget[data-cy="${name}"]`,
  // Navigation.jsx:629-633 — horizontal row (Radix NavigationMenu) of visible items, groups and the "More" button
  row: (name) => `[data-cy="draggable-widget-${name}"] nav.navigation-horizontal-menu`,
  // Navigation.jsx:47-55 item <button data-cy="nav-item-<id>">; :169 horizontal group trigger / :221 vertical group wrapper nav-group-<id>
  item: (name, id) => `[data-cy="draggable-widget-${name}"] [data-cy="nav-item-${id}"]`,
  group: (name, id) => `[data-cy="draggable-widget-${name}"] [data-cy="nav-group-${id}"]`,
  // Navigation.jsx:672-681 — overflow trigger (only rendered while something overflows)
  moreButton: (name) => `[data-cy="draggable-widget-${name}"] button.more-pages-btn`,
  // Navigation.jsx:802-830 — hidden off-screen measurement copy of every visible top-level item ([data-id])
  measured: (name) => `[data-cy="draggable-widget-${name}"] .navigation-widget [data-id]`,
  // Navigation.jsx:684-697 / 189-197 — Radix dropdown content (portalled to body): "More" menu and group sub-menu
  popup: ".page-menu-popup",
  popupItem: (id) => `.page-menu-popup [data-cy="nav-item-${id}"]`,
  // Navigation.jsx:81-85 — inline caption (vertical / nested / overflowed items)
  inlineCaption: ".nav-item-caption",
  // ToolTip.jsx:25-31 — react-bootstrap tooltip (portalled to body)
  tooltip: ".tooltip.show",

  // Inspector — NavItemsList.jsx:63-67 menu-items list; TreeItemWrapper.jsx:55-72 one <li data-draggable> per row
  inspectorList: '[data-cy="inspector-navigation-menu-items-list"]',
  inspectorRows: '[data-cy="inspector-navigation-menu-items-list"] li[data-draggable="true"]',
  // MenuItem.jsx:42-47 / GroupMenuItem.jsx:40-47 — row body carrying the item id
  inspectorRow: (id) => `[data-cy="inspector-navigation-menu-items-list"] [data-list-item-id="${id}"]`,
  // NavItemPopover.jsx:167-180 — Caption CodeHinter of the item edit popover
  inspectorCaptionField: '[data-cy="inspector-nav-item-details-caption-field"]',
};
