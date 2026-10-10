// shadcn/ui pack (experiment): layout containers. Tabs keeps the native Tabs' data contract (tabItems, defaultTab,
// currentTab, setTab and the per-tab canvases `<id>-<tabId>`), so the editor, copy and paste, dynamic height and the
// MCP's tab slots treat it as Tabs; only its look and its wizard mode are its own. List view is row-scoped like the
// native Listview: one canvas repeated per item, read with {{listItem.<field>}}.
import {
  ARRAY,
  NUMBER,
  NUMBER_OR_STRING,
  STRING,
  choice,
  code,
  colorStyle,
  select,
  shadConfig,
  sizeStyle,
  toggle,
} from './shadcnPackHelpers.js';

const tabItem = (id, title) => ({
  id,
  title,
  icon: { value: 'IconHome2' },
  iconVisibility: { value: false },
  loading: { value: false },
  disable: { value: false },
  visible: { value: true },
  fieldBackgroundColor: { value: 'var(--cc-surface1-surface)' },
});

export const shadTabsConfig = shadConfig({
  name: 'ShadTabs',
  displayName: 'Tabs',
  description:
    'shadcn/ui tabs: a container with one canvas per tab (parent the tab content with slot_name tab-<id>). Variants: pills (shadcn default), underline, or steps (a wizard with Back/Next/Finish buttons)',
  defaultSize: { width: 30, height: 360 },
  withHeight: true,
  properties: {
    useDynamicOptions: toggle('Dynamic options'),
    tabs: code('Tabs', ARRAY, [], {
      placeholder: "[{ id: 'overview', title: 'Overview' }, { id: 'activity', title: 'Activity' }]",
    }),
    defaultTab: code('Default tab', NUMBER_OR_STRING, 't0'),
    variant: choice('Style', ['pills', 'underline', 'steps'], 'pills', {
      pills: 'Pills',
      underline: 'Underline',
      steps: 'Wizard',
    }),
    tabsAlign: choice('Tab alignment', ['start', 'center', 'stretch'], 'start', { stretch: 'Fill' }),
    hideTabs: toggle('Hide tabs'),
    renderOnlyActiveTab: toggle('Render only active tab'),
    scrollToTopOnTabSwitch: toggle('Scroll to top on tab switch'),
    // Wizard (Style: Wizard): a step header and Back / Next / Finish buttons under the panel.
    showStepNav: toggle('Wizard: Back and Next buttons', true),
    nextLabel: code('Wizard: Next label', STRING, 'Next'),
    backLabel: code('Wizard: Back label', STRING, 'Back'),
    finishLabel: code('Wizard: Finish label', STRING, 'Finish'),
    linearSteps: toggle('Wizard: steps in order only', true),
    tooltip: code('Tooltip', STRING, '', { section: 'additionalActions', placeholder: 'Tooltip text' }),
  },
  defaults: {
    useDynamicOptions: { value: '{{false}}' },
    tabs: {
      value: "{{[{ id: 't0', title: 'Overview' }, { id: 't1', title: 'Activity' }, { id: 't2', title: 'Settings' }]}}",
    },
    tabItems: { value: [tabItem('t0', 'Overview'), tabItem('t1', 'Activity'), tabItem('t2', 'Settings')] },
    defaultTab: { value: 't0' },
    variant: { value: 'pills' },
    tabsAlign: { value: 'start' },
    hideTabs: { value: '{{false}}' },
    renderOnlyActiveTab: { value: '{{false}}' },
    scrollToTopOnTabSwitch: { value: '{{false}}' },
    showStepNav: { value: '{{true}}' },
    nextLabel: { value: 'Next' },
    backLabel: { value: 'Back' },
    finishLabel: { value: 'Finish' },
    linearSteps: { value: '{{true}}' },
    tooltip: { value: '' },
  },
  styles: {
    accentColor: colorStyle('Accent (active step, focus ring)'),
    tabListBackground: colorStyle('Tab bar background'),
    tabTextColor: colorStyle('Tab text color'),
    activeTabTextColor: colorStyle('Active tab text color'),
    activeTabBackground: colorStyle('Active tab background (pills)'),
    indicatorColor: colorStyle('Active tab indicator (underline)'),
    panelBackground: colorStyle('Panel background'),
    borderColor: colorStyle('Border color'),
    borderRadius: sizeStyle('Radius'),
    tabFontSize: sizeStyle('Tab font size'),
    showBorder: {
      type: 'toggle',
      displayName: 'Border around tabs',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
  },
  styleDefaults: { showBorder: { value: true } },
  events: {
    onTabSwitch: { displayName: 'On tab switch' },
    onFinish: { displayName: 'On finish (wizard)' },
  },
  exposedVariables: {
    currentTab: 't0',
    currentTabTitle: 'Overview',
    currentStepIndex: 0,
    isFirstStep: true,
    isLastStep: false,
  },
  actions: [
    { handle: 'setTab', displayName: 'Set current tab', params: [{ handle: 'id', displayName: 'Id' }] },
    { handle: 'nextTab', displayName: 'Next tab or step', params: [] },
    { handle: 'previousTab', displayName: 'Previous tab or step', params: [] },
    {
      handle: 'setTabDisable',
      displayName: 'Set tab disable',
      params: [
        { handle: 'tabId', displayName: 'Tab' },
        { handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' },
      ],
    },
    {
      handle: 'setTabLoading',
      displayName: 'Set tab loading',
      params: [
        { handle: 'tabId', displayName: 'Tab' },
        { handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' },
      ],
    },
    {
      handle: 'setTabVisibility',
      displayName: 'Set tab visibility',
      params: [
        { handle: 'tabId', displayName: 'Tab' },
        { handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
  ],
});

export const shadListViewConfig = shadConfig({
  name: 'ShadListView',
  displayName: 'List view',
  description:
    'shadcn/ui list or grid: one canvas repeated per item of data; parent components to it and bind them to {{listItem.<field>}}. A click selects the item (selectedItem, onRowClicked); optional pagination (client or server side), dividers, hover and selected highlight. Items have a fixed height (rowHeight)',
  defaultSize: { width: 30, height: 400 },
  withHeight: true,
  properties: {
    data: code('List data', ARRAY, [], { placeholder: "[{ id: 1, name: 'Ada' }]" }),
    mode: choice('Layout', ['list', 'grid'], 'list'),
    columns: code('Grid columns', NUMBER, 3),
    rowHeight: code('Item height (px)', NUMBER, 72),
    gap: code('Gap between items (px)', NUMBER, 8),
    idField: code('Id field (for selection across data changes)', STRING, 'id'),
    showBorder: toggle('Dividers between items (list)'),
    highlightSelectedRow: toggle('Highlight selected item', true),
    enablePagination: toggle('Pagination'),
    rowsPerPage: code('Items per page', NUMBER, 10),
    serverSidePagination: toggle('Server-side pagination (data is one page)'),
    totalRecords: code('Total items (server-side)', NUMBER, 0),
    emptyText: code('Empty message', STRING, 'No items'),
    tooltip: code('Tooltip', STRING, '', { section: 'additionalActions', placeholder: 'Tooltip text' }),
  },
  defaults: {
    data: {
      value:
        "{{[{ id: 1, name: 'Ada Lovelace', role: 'Engineering' }, { id: 2, name: 'Alan Turing', role: 'Research' }, { id: 3, name: 'Grace Hopper', role: 'Platform' }]}}",
    },
    mode: { value: 'list' },
    columns: { value: '{{3}}' },
    rowHeight: { value: '{{72}}' },
    gap: { value: '{{8}}' },
    idField: { value: 'id' },
    showBorder: { value: '{{false}}' },
    highlightSelectedRow: { value: '{{true}}' },
    enablePagination: { value: '{{false}}' },
    rowsPerPage: { value: '{{10}}' },
    serverSidePagination: { value: '{{false}}' },
    totalRecords: { value: '{{0}}' },
    emptyText: { value: 'No items' },
    tooltip: { value: '' },
  },
  styles: {
    accentColor: colorStyle('Accent (selected outline, pagination)'),
    backgroundColor: colorStyle('List background'),
    itemBackgroundColor: colorStyle('Item background'),
    itemHoverBackgroundColor: colorStyle('Item hover background'),
    selectedItemBackgroundColor: colorStyle('Selected item background'),
    itemBorderColor: colorStyle('Item border color'),
    dividerColor: colorStyle('Divider color'),
    itemBorderRadius: sizeStyle('Item radius'),
    itemShadow: select(
      'Item shadow',
      [
        ['none', 'None'],
        ['sm', 'Small'],
        ['md', 'Medium'],
        ['lg', 'Large'],
      ],
      'none'
    ),
    padding: sizeStyle('Padding around the list (px)'),
    emptyTextColor: colorStyle('Empty message color'),
  },
  styleDefaults: { itemShadow: { value: 'none' } },
  events: {
    onRowClicked: { displayName: 'Row clicked' },
    onRecordClicked: { displayName: 'Record clicked' },
    onPageChanged: { displayName: 'Page changed' },
  },
  exposedVariables: {
    data: {},
    children: {},
    selectedItem: {},
    selectedItemId: null,
    selectedRecord: {},
    selectedRecordId: null,
    selectedRow: {},
    selectedRowId: null,
    pageIndex: 1,
  },
  actions: [
    {
      handle: 'selectItem',
      displayName: 'Select item',
      params: [{ handle: 'id', displayName: 'Item id (idField value)' }],
    },
    { handle: 'clearSelection', displayName: 'Clear selection', params: [] },
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [{ handle: 'page', displayName: 'Page (1-based)', defaultValue: '{{1}}' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
  ],
});
