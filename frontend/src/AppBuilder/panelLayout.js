// One entry per left rail item, keyed by the panel it opens. `name` is that panel's title, the rail
// item's accessible name and tooltip, and the close button's "Close <name>"; `label` is the short text
// under the icon; `cy` is frozen to the data-cy hook Cypress specs click (`left-sidebar-<cy>-button`).
export const SIDEBAR_ITEMS = {
  tooljetai: { name: 'AI chat', label: 'AI', cy: 'ai-agent' },
  pages: { name: 'Pages', label: 'Pages', cy: 'pages' },
  components: { name: 'Components', label: 'Add', cy: 'components' },
  queries: { name: 'Queries', label: 'Queries', cy: 'queries' },
  libraries: { name: 'Libraries', label: 'Libraries', cy: 'libraries' },
  search: { name: 'Code search', label: 'Search', cy: 'code-search' },
  dependencies: { name: 'Dependencies', label: 'Deps', cy: 'dependencies' },
  apphistory: { name: 'App history', label: 'History', cy: 'app-history' },
  security: { name: 'Security', label: 'Security', cy: 'security' },
  access: { name: 'Access', label: 'Access', cy: 'access' },
  settings: { name: 'App settings', label: 'Settings', cy: 'settings' },
};

// Right panels, keyed by what they configure. `name` reads in the close button's "Close <name>".
export const RIGHT_PANEL_ITEMS = {
  query: { name: 'Query configuration' },
  component: { name: 'Component configuration' },
  page: { name: 'Page configuration' },
};

// "Close app settings", "Close AI chat": the name's first word drops its capital unless it is an acronym.
export const getPanelCloseLabel = (panel) =>
  `Close ${(SIDEBAR_ITEMS[panel] ?? RIGHT_PANEL_ITEMS[panel]).name.replace(/^[A-Z](?=[a-z])/, (letter) =>
    letter.toLowerCase()
  )}`;

export const RUNTIME_PANEL_COLLAPSED_HEIGHT = 38;
const RUNTIME_PANEL_MIN_RIGHT_EDGE = 280;

// The query editor's 48px panel header, and the 36px Setup / Transformation / Settings strip below it.
export const QUERY_HEADER_PX = 48;
export const QUERY_TABS_PX = 36;
const QUERY_CONTROL_PX = 32;

// Query preview docks at the bottom of the right-side query panel (containerClassName). It opens at
// defaultRatio of that panel, resizes from its top edge, collapses below minPx, and always leaves
// reservedAbovePx: the header, the tab strip and one 40px row of query fields above it. Closed, it
// matches the closed runtime panel bar.
export const PREVIEW_PANEL = {
  containerClassName: 'right-sidebar-query-configuration',
  collapsedPx: RUNTIME_PANEL_COLLAPSED_HEIGHT,
  defaultRatio: 0.4,
  minPx: 50,
  reservedAbovePx: QUERY_HEADER_PX + QUERY_TABS_PX + 40,
};

export const PANEL_MOTION = {
  durationMs: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  // Exits ease in (slow start, fast finish), so a closing panel stays readable for most of the 180ms.
  exitEasing: 'cubic-bezier(0.4, 0, 1, 1)',
  leftOffsetPx: 6,
  rightOffsetPx: 6,
  bottomOffsetPx: 4,
  enterFillMode: 'both',
  exitFillMode: 'forwards',
  contentAnimation: 'open-and-switch',
  shellEnterAnimation: false,
  rightContentAnimation: 'open-and-switch',
  rightShellEnterAnimation: false,
};

// Theme tokens, so the runtime bar matches the left panel and switches with dark mode by itself.
const RUNTIME_PANEL_THEME = {
  panel: 'var(--background-surface-layer-01)',
  text: 'var(--text-default)',
  muted: 'var(--text-placeholder)',
  border: 'var(--border-weak)',
  accent: 'var(--border-accent-strong)',
};

// Kept as a function of darkMode for callers; the tokens already resolve per theme.
export const getRuntimePanelTheme = () => RUNTIME_PANEL_THEME;

// Content sits on top of the tab bar (never over it) so Inspector/Debugger stay switchable while open.
// panelTop is the content's top edge as a percent of the viewport.
export const getRuntimePanelContentStyle = (isExpanded, panelTop) =>
  isExpanded
    ? {
        bottom: RUNTIME_PANEL_COLLAPSED_HEIGHT,
        height: `calc(100% - ${panelTop}% - ${RUNTIME_PANEL_COLLAPSED_HEIGHT}px)`,
        borderTopWidth: 1,
      }
    : { bottom: RUNTIME_PANEL_COLLAPSED_HEIGHT, height: 0, borderTopWidth: 0 };

// The height is the drawer's committed height, so a drag keeps the last value until mouseup instead of
// letting the canvas jump to full height. Closed, the bar still sits over the canvas bottom, so it is
// reserved too (LP-20: it hid the page nav's expand toggle). On mobile the drawer overlays the canvas,
// but the canvas's own bottom toolbar must stay above the runtime bar.
export const getCanvasReservedBottom = (runtimeContentHeight, isMobile) =>
  isMobile ? RUNTIME_PANEL_COLLAPSED_HEIGHT : Math.max(runtimeContentHeight, RUNTIME_PANEL_COLLAPSED_HEIGHT);

// The drawer animates its height, so reading the DOM when a drag or an expand ends gets a mid-transition
// value (PL-35). Its content starts at topPercent of the viewport and sits on the tab bar, so the two span
// the rest of the viewport.
export const getRuntimePanelCommittedHeight = (isExpanded, topPercent, viewportPx) =>
  isExpanded ? (viewportPx * (100 - topPercent)) / 100 : 0;

// Page popups open from rows and buttons that end inside the Pages panel. Popper measures the offset from
// that reference, so the distance reaches 8px past the panel's right edge instead (LR-23). Where the
// popup can't fit past the panel (683px, 1024px at 150% zoom), it clamps 8px inside the viewport.
export const getPastPanelOffset =
  (panelRightPx, viewportPx = Infinity) =>
  ({ reference, popper }) => [
    0,
    Math.min(panelRightPx + 8, viewportPx - 8 - (popper?.width ?? 0)) - reference.x - reference.width,
  ];

export const getLeftPanelReservedBottom = (isExpanded, measuredHeight) =>
  isExpanded ? Math.max(measuredHeight, RUNTIME_PANEL_COLLAPSED_HEIGHT) : RUNTIME_PANEL_COLLAPSED_HEIGHT;

export const getLeftPanelHeight = (isExpanded, measuredHeight) =>
  `calc(100vh - ${48 + getLeftPanelReservedBottom(isExpanded, measuredHeight)}px)`;

// The editor canvas reserves only the persistent left navigation rail. The
// right configuration panel overlays/resizes independently when it is open.
export const EDITOR_CANVAS_WIDTH = 'calc(100% - 54px)';

// A drawer tab behaves like a left-rail icon: clicking the tab that's already showing closes the
// drawer; any other click opens it (or switches tabs while it stays open).
export const getRuntimeTabClickAction = (tab, activeTab, isExpanded) => {
  if (!isExpanded) return 'open';
  return tab === activeTab ? 'close' : 'switch';
};

// The bottom drawer's two tabs. Every entry point (tab, canvas handle, component menu, toggle, close)
// calls them by `label`, and each search box's placeholder is also its accessible name.
export const RUNTIME_PANEL_ITEMS = [
  { id: 'inspect', label: 'Inspector', search: 'Search inspector' },
  { id: 'debugger', label: 'Debugger', search: 'Search logs' },
];

const runtimeItem = (id) => RUNTIME_PANEL_ITEMS.find((item) => item.id === id) ?? RUNTIME_PANEL_ITEMS[0];

export const getRuntimeSearchName = (id) => runtimeItem(id).search;

export const getRuntimeToggleLabel = (isExpanded, activeTab) =>
  `${isExpanded ? 'Close' : 'Open'} ${runtimeItem(activeTab).label.toLowerCase()}`;

export const getRightPanelForSelection = (selectionType) => {
  if (selectionType === 'component') return 'configuration';
  if (selectionType === 'query') return 'query';
  if (selectionType === 'page') return 'page-configuration';
  return null;
};

export const getPageSettingsSections = (surface) => [
  {
    id: 'properties',
    sections: surface === 'navigation' ? ['page-list', 'page-settings'] : ['page-settings'],
  },
  { id: 'styles', sections: ['page-styles'] },
];

// Pages and the AI chat scroll their own content; every other panel scrolls as a whole.
export const getLeftPanelOverflow = (panel) => (panel === 'pages' || panel === 'tooljetai' ? 'hidden' : 'auto');

// Every rail item, the AI chat included, shares the one left slot. The panel stays mounted while it
// animates closed and unmounts once the selection clears.
export const getLeftPanelState = (selectedSidebarItem, isSidebarOpen) => ({
  isLeftPanelOpen: Boolean(isSidebarOpen && selectedSidebarItem),
  shouldMountLeftPanel: Boolean(selectedSidebarItem),
});

export const shouldShowLibraries = (isModuleEditor, hasAppJsLibrariesAccess) =>
  !isModuleEditor && Boolean(hasAppJsLibrariesAccess);

export const getComponentPickerClassName = (surface) =>
  `components-container${surface === 'left' ? ' components-container--left' : ''}`;

export const getQueryListClassName = (surface) => `data-pane${surface === 'left' ? ' query-data-pane--left' : ''}`;

export const getQueryPanelHeaderClassName = (surface) => (surface === 'left' ? 'queries-panel-header' : 'd-none');

export const isQuerySearchPersistent = (surface) => surface === 'left';

export const getQueryHeaderPlacement = (surface) =>
  surface === 'left' ? { add: 'title', search: 'toolbar' } : { add: 'toolbar', search: 'conditional' };

export const getQueryAddButtonPresentation = (surface) =>
  surface === 'left'
    ? { size: 'default', style: { fontWeight: 500, padding: '7px 12px' }, variant: 'outline' }
    : { size: 'medium', variant: 'outline' };

export const QUERY_POPOVER_MOTION_TARGETS = ['new-query', 'filter', 'query-actions', 'dropdown', 'parameter'];

export const getQueryPopoverMotion = (kind) => ({
  className: QUERY_POPOVER_MOTION_TARGETS.includes(kind) ? 'query-panel-popover-motion' : '',
  transition: QUERY_POPOVER_MOTION_TARGETS.includes(kind),
});

export const getQueryToolbarClassName = (surface, _showSearchBox) =>
  `queries-header${surface === 'left' ? ' queries-toolbar' : ''}`;

export const getQuerySearchClassName = (surface, darkMode) =>
  `queries-search d-flex${darkMode ? ' theme-dark' : ''}${surface === 'left' ? ' query-search--left' : ''}`;

export const getQuerySearchFocusStyle = (surface) =>
  surface === 'left'
    ? {
        '--query-search-focus-background': 'var(--background-surface-layer-01)',
        '--query-search-focus-border': 'var(--border-accent-strong)',
      }
    : undefined;

// An open left panel stacks above the right panel, so a widened query panel slides under it.
export const getRightPanelClassName = (activeTab, isLeftPanelOpen = false) =>
  `editor-sidebar tj-panel right-panel-shell${activeTab === 'query' ? ' right-panel-shell--query' : ''}${
    isLeftPanelOpen ? ' right-panel-shell--below-left-panel' : ''
  }`;

export const getAppBuilderTypographyVariables = () => ({
  '--app-builder-font-family': "'IBM Plex Sans', sans-serif",
  '--app-builder-code-font-family': "'Source Code Pro', monospace",
  // The canvas shows a customer's app, so it takes the Viewer's own font: the <body> declaration in
  // theme.scss, without the chrome's fallback stack (canvas = Viewer).
  '--app-builder-canvas-font-family': "'IBM Plex Sans'",
  '--app-builder-small-font-size': '12px',
});

// The query panel opens at defaultPx and widens from a handle on its left edge, as far as the left
// navigation rail (railPx), or as far as the left panel while one is open. The dragged width is stored in px and capped at the rail when rendered,
// so a width chosen in a wide window still fits after the window shrinks.
export const QUERY_PANEL_RESIZE = {
  defaultPx: 496,
  railPx: 54,
  keyboardStepPx: 16,
  storageKey: 'queryPanelWidth',
};

const QUERY_RIGHT_PANEL_MAX_WIDTH = `calc(100vw - ${QUERY_PANEL_RESIZE.railPx}px)`;

// When the window is too narrow for both, the default width wins and the left panel covers the edge.
export const clampQueryPanelWidth = (widthPx, viewportWidth, leftPanelWidthPx = 0) => {
  const spaceRightOfRailPx = viewportWidth - QUERY_PANEL_RESIZE.railPx;
  const minPx = Math.min(QUERY_PANEL_RESIZE.defaultPx, spaceRightOfRailPx);
  const maxPx = Math.max(minPx, spaceRightOfRailPx - leftPanelWidthPx);
  return Math.round(Math.min(Math.max(widthPx, minPx), maxPx));
};

export const getQueryPanelWidth = (widthPx) =>
  `min(${widthPx || QUERY_PANEL_RESIZE.defaultPx}px, ${QUERY_RIGHT_PANEL_MAX_WIDTH})`;

export const parseStoredQueryPanelWidth = (rawValue) => {
  const widthPx = Number(rawValue);
  return rawValue !== null && Number.isFinite(widthPx) && widthPx > 0 ? widthPx : null;
};

export const getRightPanelStyle = (activeTab, queryPanelWidth) => {
  if (activeTab !== 'query') return { overflow: 'auto' };
  const width = getQueryPanelWidth(queryPanelWidth);
  return {
    '--query-right-panel-width': width,
    maxWidth: QUERY_RIGHT_PANEL_MAX_WIDTH,
    overflow: 'hidden',
    width,
  };
};

// The width the open right panel covers. The canvas reserves it and the bottom runtime panel stops
// short of it; the query editor is wider than the other tabs, and follows its dragged width.
export const getRightPanelReservedWidth = (isRightSidebarOpen, activeTab, queryPanelWidth) => {
  if (!isRightSidebarOpen) return 0;
  return activeTab === 'query' ? getQueryPanelWidth(queryPanelWidth) : '300px';
};

export const getRuntimePanelRightOffset = (isRightSidebarOpen, activeTab, queryPanelWidth, codePanelLeft) => {
  const sidebarWidth = getRightPanelReservedWidth(isRightSidebarOpen, activeTab, queryPanelWidth);
  if (codePanelLeft == null) return sidebarWidth;
  // The Code panel's measured edge already includes the space occupied by the right sidebar.
  // In a narrow workspace, leave room for the runtime controls over the bottom of Code.
  const rightEdge = Math.max(codePanelLeft, RUNTIME_PANEL_MIN_RIGHT_EDGE);
  return `max(${sidebarWidth || '0px'}, calc(100vw - ${rightEdge}px))`;
};

// The canvas reserves side-panel widths as borders, so it grows by them to keep its content width.
export const getCanvasMinWidth = (leftWidthPx, rightReservedWidth) => {
  const offsets = [leftWidthPx ? `${leftWidthPx}px` : null, rightReservedWidth || null].filter(Boolean);
  return offsets.length ? `calc(100% + ${offsets.join(' + ')})` : '';
};

export const getQueryManagerClassName = (surface, darkMode) =>
  `query-manager${darkMode ? ' theme-dark' : ''}${surface === 'right' ? ' query-manager--right' : ''}`;

const QUERY_DETAILS_CATEGORY_BY_TAB = { 1: 'setup', 2: 'transformation', 3: 'settings' };

const CODE_QUERY_KINDS = new Set(['runjs', 'runpy']);

// The RunJS and RunPython setup tab is one code box that fills the panel and scrolls inside itself;
// the panel around it never scrolls.
export const isCodeQueryLayout = (surface, activeTab, kind) =>
  surface === 'right' && activeTab === 1 && CODE_QUERY_KINDS.has(kind);

export const getQueryDetailsClassName = (surface, activeTab, kind) =>
  `query-details${
    surface === 'right'
      ? ` query-details--right query-fields-stacked${
          QUERY_DETAILS_CATEGORY_BY_TAB[activeTab]
            ? ` query-details-category--${QUERY_DETAILS_CATEGORY_BY_TAB[activeTab]}`
            : ''
        }${isCodeQueryLayout(surface, activeTab, kind) ? ' query-details--code' : ''}`
      : ''
  }`;

export const QUERY_FIELD_LABEL_CLASS_NAME = 'query-field-label';
export const QUERY_FIELD_HELPER_CLASS_NAME = 'query-field-helper';
export const getQueryTypographyClassName = (kind) =>
  kind === 'helper' ? QUERY_FIELD_HELPER_CLASS_NAME : QUERY_FIELD_LABEL_CLASS_NAME;

export const getQueryDetailsStyle = (surface) =>
  surface === 'right'
    ? {
        '--query-panel-background': 'var(--background-surface-layer-01)',
        '--query-field-label-color': 'var(--slate11)',
        '--query-field-label-font-size': '13px',
        '--query-field-label-font-weight': 400,
        '--query-field-label-line-height': '20px',
        '--query-field-helper-color': 'var(--slate10)',
        '--query-field-helper-font-size': '11px',
        '--query-field-helper-font-weight': 400,
        '--query-field-helper-line-height': '16px',
        '--query-field-value-color': 'var(--text-default)',
        '--query-field-value-font-size': '13px',
        '--query-field-value-font-weight': 400,
        '--query-field-value-line-height': '20px',
        '--query-control-background': 'var(--background-surface-layer-01)',
        '--query-control-border': 'var(--slate7)',
        '--query-control-border-width': '1px',
        '--query-dropdown-button-border-width': '0px',
        '--query-dropdown-height': `${QUERY_CONTROL_PX}px`,
        '--query-dropdown-hover-background': 'var(--background-surface-layer-01)',
        '--query-dropdown-focus-border': 'var(--border-accent-strong)',
        '--query-dropdown-focus-shadow': 'inset 0 0 0 1px var(--border-accent-strong)',
        '--query-dropdown-selected-background': 'var(--background-surface-layer-01)',
      }
    : undefined;

// In the right panel the details area is a flex child that fills the panel below its header, and the
// preview is docked over the panel's bottom edge. A bottom margin of the preview's height makes the scroll
// area end where the preview starts, whatever the header's height.
export const getQueryDetailsOverflowStyle = (surface, hasSelectedQuery, previewHeight) =>
  surface === 'right' && hasSelectedQuery
    ? { marginBottom: `${previewHeight}px` }
    : { height: `calc(100% - ${hasSelectedQuery ? previewHeight + 40 : 0}px)` };

export const TOOLJET_DB_MODE_OPTIONS = [
  { label: 'GUI mode', value: 'GUI mode' },
  { label: 'SQL mode', value: 'SQL mode' },
];

export const getTooljetDbModeControlPresentation = (surface) => ({
  animateMenu: true,
  height: surface === 'right' ? QUERY_CONTROL_PX : 36,
  type: 'dropdown',
  useMenuPortal: false,
});
