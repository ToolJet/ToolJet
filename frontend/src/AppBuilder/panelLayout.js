export const LEFT_PANEL_SECTIONS = [
  {
    id: 'build',
    items: [
      { id: 'pages', label: 'Pages', icon: 'files' },
      { id: 'components', label: 'Components', icon: 'blocks' },
      { id: 'queries', label: 'Queries', icon: 'database-zap' },
      { id: 'libraries', label: 'Libraries', icon: 'box' },
    ],
  },
  {
    id: 'manage',
    items: [
      { id: 'dependencies', label: 'Dependencies', icon: 'network' },
      { id: 'apphistory', label: 'App history', icon: 'history' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export const LEFT_PANEL_ITEMS = LEFT_PANEL_SECTIONS.flatMap(({ items }) => items);

export const RUNTIME_PANEL_COLLAPSED_HEIGHT = 38;

// Query preview docks at the bottom of the right-side query panel (containerClassName). It opens at
// defaultRatio of that panel, resizes from its top edge, collapses below minPx, and always leaves
// reservedAbovePx for the query fields above it. Closed, it matches the closed runtime panel bar.
export const PREVIEW_PANEL = {
  containerClassName: 'right-sidebar-query-configuration',
  collapsedPx: RUNTIME_PANEL_COLLAPSED_HEIGHT,
  defaultRatio: 0.4,
  minPx: 50,
  reservedAbovePx: 120,
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

const RUNTIME_PANEL_THEMES = {
  light: {
    panel: '#ffffff',
    text: '#222631',
    muted: '#747d8f',
    border: '#e1e5ed',
    accent: '#4368e8',
  },
  dark: {
    panel: '#1e232d',
    text: '#f3f5f9',
    muted: '#a8b0bf',
    border: '#353c49',
    accent: '#7895ff',
  },
};

export const getRuntimePanelTheme = (darkMode) => RUNTIME_PANEL_THEMES[darkMode ? 'dark' : 'light'];

// Content sits on top of the tab bar (never over it) so Inspector/Debugger stay switchable while open.
// panelTop is the content's top edge as a percent of the viewport.
export const getRuntimePanelContentStyle = (isExpanded, panelTop) =>
  isExpanded
    ? {
        bottom: RUNTIME_PANEL_COLLAPSED_HEIGHT,
        height: `calc(100% - ${panelTop}% - ${RUNTIME_PANEL_COLLAPSED_HEIGHT}px)`,
        borderTopWidth: 2,
      }
    : { bottom: RUNTIME_PANEL_COLLAPSED_HEIGHT, height: 0, borderTopWidth: 0 };

export const getCanvasReservedBottom = (runtimeContentHeight, isDragging) => (isDragging ? 0 : runtimeContentHeight);

export const getRuntimePanelMeasuredHeight = (isExpanded, measuredHeight) =>
  isExpanded ? measuredHeight + RUNTIME_PANEL_COLLAPSED_HEIGHT : 0;

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

export const RUNTIME_PANEL_ITEMS = [
  { id: 'inspect', label: 'Inspector' },
  { id: 'debugger', label: 'Debugger' },
];

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
    ? { size: 'default', style: { fontWeight: 400, padding: '7px 12px' }, variant: 'outline' }
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
        '--query-search-focus-border': 'var(--slate8)',
        '--query-search-focus-shadow': 'none',
      }
    : undefined;

export const getRightPanelClassName = (activeTab) =>
  `editor-sidebar right-panel-shell${activeTab === 'query' ? ' right-panel-shell--query' : ''}`;

export const getAppBuilderTypographyStyle = () => ({
  '--app-builder-font-family': "'Inter', sans-serif",
  '--app-builder-code-font-family': "'Source Code Pro', monospace",
  '--app-builder-canvas-font-family': "'IBM Plex Sans', sans-serif",
});

const QUERY_RIGHT_PANEL_WIDTH = 'min(496px, calc(100vw - 54px))';

export const getRightPanelStyle = (activeTab) =>
  activeTab === 'query'
    ? {
        maxWidth: 'calc(100vw - 54px)',
        overflow: 'hidden',
        width: QUERY_RIGHT_PANEL_WIDTH,
      }
    : { overflow: 'auto' };

// The bottom runtime panel stops where the right sidebar starts, so it must track the wider query surface.
// The width the open right panel covers. The canvas reserves it and the bottom runtime panel stops
// short of it; the query editor is wider than the other tabs.
export const getRightPanelReservedWidth = (isRightSidebarOpen, activeTab) => {
  if (!isRightSidebarOpen) return 0;
  return activeTab === 'query' ? QUERY_RIGHT_PANEL_WIDTH : '300px';
};

export const getRuntimePanelRightOffset = getRightPanelReservedWidth;

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
        '--query-panel-background': '#ffffff',
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
        '--query-control-background': '#ffffff',
        '--query-control-border': 'var(--slate7)',
        '--query-control-border-width': '1px',
        '--query-dropdown-button-border-width': '0px',
        '--query-dropdown-height': '36px',
        '--query-dropdown-hover-background': '#ffffff',
        '--query-dropdown-focus-border': 'var(--slate7)',
        '--query-dropdown-focus-shadow': 'none',
        '--query-dropdown-selected-background': '#ffffff',
      }
    : undefined;

export const getQueryDetailsOverflowStyle = (surface, hasSelectedQuery, previewHeight) => ({
  height: `calc(100% - ${hasSelectedQuery ? previewHeight + 40 : 0}px)`,
  ...(surface === 'right' && hasSelectedQuery ? { paddingBottom: `${previewHeight + 16}px` } : {}),
});

export const TOOLJET_DB_MODE_OPTIONS = [
  { label: 'GUI mode', value: 'GUI mode' },
  { label: 'SQL mode', value: 'SQL mode' },
];

export const getTooljetDbModeControlPresentation = () => ({
  animateMenu: true,
  height: 36,
  type: 'dropdown',
  useMenuPortal: false,
});

export const getQueryHeaderClassName = (surface) =>
  `row header${surface === 'right' ? ' query-manager-header--right query-manager-header--polished' : ''}`;

export const getQueryHeaderControlPresentation = (control, surface = 'bottom') => ({
  className: `query-header-control${control === 'close' ? ' query-header-control--close' : ''}`,
  ...(control === 'close' && { iconSizePx: 16 }),
  ...(control === 'preview' && surface === 'right' && { style: { fontWeight: 400 } }),
  size: 'medium',
});

export const getQueryTabClassName = (surface, isActive) =>
  `query-manager-tab${surface === 'right' ? ' query-manager-tab--right' : ''}${isActive ? ' is-active' : ''}`;

export const getQueryTabsStyle = (surface) =>
  surface === 'right'
    ? {
        gap: '3px',
        '--query-tab-font-size': '13px',
        '--query-tab-font-weight': 400,
        '--query-tab-line-height': '20px',
      }
    : { gap: '3px', marginBottom: '-15px' };
