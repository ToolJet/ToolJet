// What proves each property of the shadcn/ui pack works (experiment). The generic check (shard*.spec) sees most
// properties change the widget at rest or in a common state; the rest are proved here: PROBES (behaviours.spec) with
// the state or interaction each needs, ELSEWHERE by a dedicated spec, BROWSER only in a real browser. A property the
// generic check finds dead and none of these covers fails the shard: a new property must show it works.
import { CONFIGS, NAMES } from './harness';

const fx = (v) => `{{${JSON.stringify(v)}}}`;
const TWO_SERIES = fx([
  { month: 'Jun', a: 10, b: 20 },
  { month: 'Jul', a: 30, b: 15 },
  { month: 'Aug', a: 25, b: 35 },
]);
const texts = (pattern) => (a, b) => !pattern.test(a.text) && pattern.test(b.text);

export const PROBES = [
  // Display and layout
  {
    widget: 'ShadAccordion',
    key: 'multiple',
    value: '{{true}}',
    steps: [
      ['click', 'button[aria-expanded]', 0],
      ['click', 'button[aria-expanded]', 1],
    ],
  },
  {
    widget: 'ShadCircularProgress',
    key: 'text',
    value: 'Nearly there',
    context: { properties: { centerText: 'custom' } },
    expect: texts(/Nearly there/),
  },
  { widget: 'ShadIcon', key: 'chipSize', value: '{{72}}' },
  { widget: 'ShadKeyValue', key: 'labelWidth', value: '120px', context: { properties: { layout: 'inline' } } },
  {
    widget: 'ShadKeyValue',
    key: 'emptyText',
    value: 'n/a',
    context: { properties: { data: fx([{ label: 'Owner', value: '' }]) } },
    expect: texts(/n\/a/),
  },
  {
    widget: 'ShadTimeline',
    key: 'dateFormat',
    value: 'DD MMM',
    context: { properties: { items: fx([{ title: 'Paid', time: '2026-03-04T10:00:00Z', status: 'done' }]) } },
  },
  { widget: 'ShadTimeline', key: 'statusColors', value: fx({ done: '#e11d48' }) },
  { widget: 'ShadPagination', key: 'totalRecords', value: '{{250}}' },
  { widget: 'ShadPagination', key: 'pageSize', value: '{{5}}', context: { properties: { totalRecords: '{{95}}' } } },
  { widget: 'ShadNavigation', key: 'align', value: 'center', context: { properties: { orientation: 'horizontal' } } },
  {
    widget: 'ShadImage',
    key: 'fallbackText',
    value: 'Ada Lovelace',
    context: { properties: { src: 'https://example.invalid/x.png', fallback: 'initials' } },
    steps: [['error']],
  },
  // Stat
  { widget: 'ShadStat', key: 'trend', value: 'down', context: { properties: { change: '+12%' } } },
  {
    widget: 'ShadStat',
    key: 'positiveColor',
    section: 'styles',
    value: '#16a34a',
    context: { properties: { change: '+12%', trend: 'up' } },
  },
  {
    widget: 'ShadStat',
    key: 'negativeColor',
    section: 'styles',
    value: '#dc2626',
    context: { properties: { change: '-3%', trend: 'down' } },
  },
  { widget: 'ShadStat', key: 'iconPosition', value: 'top', context: { properties: { icon: 'IconCurrencyDollar' } } },
  { widget: 'ShadStat', key: 'iconStyle', value: 'circle', context: { properties: { icon: 'IconCurrencyDollar' } } },
  { widget: 'ShadStat', key: 'trendData', value: fx([3, 5, 4, 8, 7, 9]) },
  {
    widget: 'ShadStat',
    key: 'sparklineType',
    value: 'line',
    context: { properties: { trendData: fx([3, 5, 4, 8, 7, 9]) } },
  },
  {
    widget: 'ShadStat',
    key: 'progressLabel',
    value: '68% of target',
    context: { properties: { progress: '{{68}}' } },
    expect: texts(/68% of target/),
  },
  // Inputs and pickers
  {
    widget: 'ShadColorPicker',
    key: 'placeholder',
    value: 'Choose a colour',
    context: { properties: { defaultValue: '' } },
    expect: texts(/Choose a colour/),
  },
  {
    widget: 'ShadCombobox',
    key: 'emptyText',
    value: 'Nothing here',
    steps: ['open', ['type', 'zzzz']],
    expect: texts(/Nothing here/),
  },
  {
    widget: 'ShadMultiselect',
    key: 'emptyText',
    value: 'Nothing here',
    steps: ['open', ['type', 'zzzz']],
    expect: texts(/Nothing here/),
  },
  { widget: 'ShadCombobox', key: 'serverSideSearch', value: '{{true}}', steps: ['open', ['type', 'zzzz']] },
  { widget: 'ShadMultiselect', key: 'serverSideSearch', value: '{{true}}', steps: ['open', ['type', 'zzzz']] },
  { widget: 'ShadCurrencyInput', key: 'currencyDisplay', value: 'code' },
  { widget: 'ShadCurrencyInput', key: 'currencyOptions', value: fx(['USD', 'EUR', 'GBP']) },
  {
    widget: 'ShadDateTimePicker',
    key: 'minuteStep',
    value: '{{30}}',
    context: { properties: { defaultValue: '2026-01-05 10:30' } },
    steps: ['open', ['click', '[aria-label="Minute"]', 0]],
  },
  { widget: 'ShadCalendar', key: 'disabledDays', value: fx([0, 6]) },
  { widget: 'ShadRating', key: 'allowHalf', value: '{{true}}', context: { properties: { defaultValue: '{{3.5}}' } } },
  { widget: 'ShadRating', key: 'allowClear', value: '{{false}}', steps: [['click', '[role=radio], button', 3]] },
  {
    widget: 'ShadRating',
    key: 'valueLabels',
    value: fx(['Poor', 'Fair', 'Good', 'Great', 'Superb']),
    steps: ['hover'],
  },
  {
    widget: 'ShadTagsInput',
    key: 'suggestions',
    value: fx(['zebra', 'zinc']),
    steps: ['focus', ['type', 'z']],
    expect: texts(/zinc/),
  },
  { widget: 'ShadSlider', key: 'step', value: '{{25}}', steps: [['keyDown', 'ArrowRight']] },
  {
    widget: 'ShadButtonGroup',
    key: 'allowDeselect',
    value: '{{true}}',
    steps: [
      ['click', 'button', 0],
      ['click', 'button', 0],
    ],
  },
  // Menus and overlays
  {
    widget: 'ShadDropdownMenu',
    key: 'items',
    value: fx([{ label: 'Escalate', value: 'escalate' }]),
    steps: ['open'],
    expect: texts(/Escalate/),
  },
  {
    widget: 'ShadDropdownMenu',
    key: 'menuLabel',
    value: 'Actions for row',
    steps: ['open'],
    expect: texts(/Actions for row/),
  },
  { widget: 'ShadDropdownMenu', key: 'align', value: 'end', steps: ['open'] },
  { widget: 'ShadDropdownMenu', key: 'side', value: 'top', steps: ['open'] },
  { widget: 'ShadDropdownMenu', key: 'optionsLoadingState', value: '{{true}}', steps: ['open'] },
  // Charts
  {
    widget: 'ShadAreaChart',
    key: 'seriesLabels',
    value: fx({ revenue: 'Income' }),
    context: { properties: { showLegend: '{{true}}' } },
    expect: texts(/Income/),
  },
  {
    widget: 'ShadBarChart',
    key: 'seriesLabels',
    value: fx({ revenue: 'Income' }),
    context: { properties: { showLegend: '{{true}}' } },
    expect: texts(/Income/),
  },
  { widget: 'ShadLineChart', key: 'seriesLabels', value: fx({ revenue: 'Income' }), expect: texts(/Income/) },
  { widget: 'ShadRadarChart', key: 'seriesLabels', value: fx({ alex: 'Alex R.' }), expect: texts(/Alex R\./) },
  {
    widget: 'ShadComboChart',
    key: 'seriesLabels',
    value: fx({ revenue: 'Income', margin: 'Margin %' }),
    expect: texts(/Income/),
  },
  {
    widget: 'ShadAreaChart',
    key: 'stack',
    value: '{{true}}',
    context: { properties: { data: TWO_SERIES, yFields: fx(['a', 'b']) } },
  },
  { widget: 'ShadBarChart', key: 'highlight', value: 'max' },
  { widget: 'ShadLineChart', key: 'dashedFields', value: fx(['expenses']) },
  { widget: 'ShadLineChart', key: 'referenceValue', value: '{{25000}}' },
  {
    widget: 'ShadLineChart',
    key: 'referenceLabel',
    value: 'Target',
    context: { properties: { referenceValue: '{{25000}}' } },
    expect: texts(/Target/),
  },
  {
    widget: 'ShadRadialChart',
    key: 'data',
    value: fx([{ channel: 'Ads', visitors: 50 }]),
    context: { properties: { mode: 'categories' } },
  },
  {
    widget: 'ShadRadialChart',
    key: 'categoryField',
    value: 'kind',
    context: { properties: { mode: 'categories', data: fx([{ kind: 'Ads', channel: 'Direct', visitors: 5 }]) } },
    expect: texts(/Ads/),
  },
  {
    widget: 'ShadRadialChart',
    key: 'valueField',
    value: 'other',
    context: {
      properties: {
        mode: 'categories',
        data: fx([
          { channel: 'Direct', visitors: 5, other: 50 },
          { channel: 'Search', visitors: 50, other: 5 },
        ]),
      },
    },
  },
  { widget: 'ShadRadialChart', key: 'thickness', value: '{{6}}' },
  {
    widget: 'ShadRadialChart',
    key: 'emptyText',
    value: 'Nothing yet',
    context: { properties: { mode: 'categories', data: '{{[]}}' } },
    expect: texts(/Nothing yet/),
  },
  { widget: 'ShadRadialChart', key: 'showLegend', value: '{{false}}', context: { properties: { mode: 'categories' } } },
  { widget: 'ShadScatterChart', key: 'referenceX', value: '{{20}}' },
  { widget: 'ShadScatterChart', key: 'referenceY', value: '{{60}}' },
  { widget: 'ShadScatterChart', key: 'fillOpacity', value: '{{0.2}}' },
  { widget: 'ShadScatterChart', key: 'currency', value: 'EUR', context: { properties: { yAxisFormat: 'currency' } } },
  { widget: 'ShadFunnelChart', key: 'currency', value: 'EUR', context: { properties: { yAxisFormat: 'currency' } } },
  { widget: 'ShadComboChart', key: 'currency', value: 'EUR', context: { properties: { yAxisFormat: 'currency' } } },
  { widget: 'ShadSparkline', key: 'bandMin', value: '{{10}}', context: { properties: { showBand: '{{true}}' } } },
  { widget: 'ShadSparkline', key: 'bandMax', value: '{{20}}', context: { properties: { showBand: '{{true}}' } } },
  // Data widgets
  {
    widget: 'ShadKanban',
    key: 'progressField',
    value: 'pct',
    context: { properties: { data: fx([{ id: 1, title: 'A', status: 'todo', pct: 40 }]) } },
  },
  {
    widget: 'ShadKanban',
    key: 'progressColor',
    section: 'styles',
    value: '#e11d48',
    context: { properties: { progressField: 'pct', data: fx([{ id: 1, title: 'A', status: 'todo', pct: 40 }]) } },
  },
  {
    widget: 'ShadKanban',
    key: 'emptyText',
    value: 'Nothing here',
    context: { properties: { data: '{{[]}}' } },
    expect: texts(/Nothing here/),
  },
  { widget: 'ShadKanban', key: 'badgeColors', value: fx({ High: '#e11d48' }) },
  {
    widget: 'ShadKanban',
    key: 'loadingIndicator',
    value: 'skeleton',
    context: { properties: { loadingState: '{{true}}', data: '{{[]}}' } },
  },
  {
    widget: 'ShadTable',
    key: 'badgeColors',
    value: fx({ Paid: '#16a34a' }),
    context: { properties: { columns: fx([{ key: 'status', name: 'Status', columnType: 'badge' }]) } },
  },
  { widget: 'ShadTable', key: 'rowsPerPage', value: '{{2}}' },
  {
    widget: 'ShadTable',
    key: 'enablePagination',
    value: '{{false}}',
    context: { properties: { rowsPerPage: '{{2}}' } },
  },
  {
    widget: 'ShadTable',
    key: 'totalRecords',
    value: '{{500}}',
    context: { properties: { serverSidePagination: '{{true}}' } },
  },
  {
    widget: 'ShadTable',
    key: 'enablePrevButton',
    value: '{{false}}',
    context: { properties: { serverSidePagination: '{{true}}', totalRecords: '{{500}}' } },
    steps: [['click', '[aria-label="Next page"]', 0]],
  },
  {
    widget: 'ShadTable',
    key: 'enableNextButton',
    value: '{{false}}',
    context: { properties: { serverSidePagination: '{{true}}', totalRecords: '{{500}}' } },
  },
  { widget: 'ShadTable', key: 'highlightSelectedRow', value: '{{false}}', steps: [['click', 'tbody tr', 0]] },
  {
    widget: 'ShadTable',
    key: 'disableRowDeselection',
    value: '{{false}}',
    steps: [
      ['click', 'tbody tr', 0],
      ['click', 'tbody tr', 0],
    ],
  },
  { widget: 'ShadTable', key: 'defaultSelectedRow', value: fx({ id: 2 }) },
  {
    widget: 'ShadTable',
    key: 'serverSideSearch',
    value: '{{true}}',
    context: { properties: { displaySearchBox: '{{true}}' } },
    steps: [['type', 'Ada'], 'wait'],
  },
  { widget: 'ShadListView', key: 'columns', value: '{{2}}', context: { properties: { mode: 'grid' } } },
  {
    widget: 'ShadListView',
    key: 'rowsPerPage',
    value: '{{1}}',
    context: { properties: { enablePagination: '{{true}}' } },
  },
  {
    widget: 'ShadListView',
    key: 'serverSidePagination',
    value: '{{true}}',
    context: { properties: { enablePagination: '{{true}}', rowsPerPage: '{{1}}' } },
  },
  {
    widget: 'ShadListView',
    key: 'totalRecords',
    value: '{{40}}',
    context: { properties: { enablePagination: '{{true}}', serverSidePagination: '{{true}}', rowsPerPage: '{{1}}' } },
  },
  {
    widget: 'ShadTable',
    key: 'showBulkUpdateActions',
    value: '{{false}}',
    context: { properties: { columns: fx([{ key: 'name', name: 'Name', isEditable: true }]) } },
    steps: [
      ['click', 'td', 0],
      ['type', 'Changed name', 'td input'],
      ['keyDown', 'Enter', 'td input'],
    ],
  },
  {
    widget: 'ShadTable',
    key: 'stickyHeader',
    value: '{{false}}',
    context: { properties: { dynamicHeight: '{{false}}' } },
  },
  { widget: 'ShadTable', key: 'serverSideSort', value: '{{true}}', steps: [['action', 'setSort', 'name', 'desc']] },
  {
    widget: 'ShadTable',
    key: 'serverSideFilter',
    value: '{{true}}',
    steps: [['action', 'setFilters', [{ column: 'name', condition: 'contains', value: 'Ada' }]]],
  },
  {
    widget: 'ShadTable',
    key: 'idField',
    value: 'name',
    steps: [
      ['click', 'tbody tr', 0],
      [
        'set',
        'data',
        fx([
          { id: 11, name: 'Ada Lovelace' },
          { id: 12, name: 'Alan Turing' },
        ]),
      ],
    ],
  },
  {
    widget: 'ShadListView',
    key: 'idField',
    value: 'name',
    steps: [
      ['click', '[role=listitem]', 0],
      [
        'set',
        'data',
        fx([
          { id: 11, name: 'Ada Lovelace' },
          { id: 12, name: 'Alan Turing' },
        ]),
      ],
    ],
  },
  { widget: 'ShadListView', key: 'highlightSelectedRow', value: '{{false}}', steps: [['click', '[role=listitem]', 0]] },
  {
    widget: 'ShadKanban',
    key: 'idField',
    value: 'title',
    steps: [['action', 'updateCard', 'Draft the brief', { owner: 'Grace Hopper' }]],
  },
  { widget: 'ShadKanban', key: 'cardHeight', value: '{{140}}', context: { properties: { cardLayout: 'custom' } } },
  {
    widget: 'ShadDialog',
    key: 'triggerButtonHoverBackgroundColor',
    section: 'styles',
    value: '#e11d48',
    context: { styles: { triggerButtonHoverBackgroundMode: 'manual' } },
  },
  // Timers, images, files and measured content
  // (The interval is at least a second; 1.5 s moves one slide, short of looping back.)
  {
    widget: 'ShadCarousel',
    key: 'autoplay',
    value: '{{true}}',
    context: { properties: { interval: '{{1000}}' } },
    steps: [['wait', 1500]],
  },
  {
    widget: 'ShadCarousel',
    key: 'interval',
    value: '{{1000}}',
    context: { properties: { autoplay: '{{true}}' } },
    steps: [['wait', 1500]],
  },
  {
    widget: 'ShadCarousel',
    key: 'pauseOnHover',
    value: '{{false}}',
    context: { properties: { autoplay: '{{true}}', interval: '{{1000}}' } },
    steps: [
      ['hover', '[aria-roledescription=carousel]'],
      ['wait', 1500],
    ],
  },
  {
    widget: 'ShadImage',
    key: 'zoomOnClick',
    value: '{{true}}',
    context: { properties: { source: 'https://example.invalid/a.png' } },
    steps: ['load', ['click', 'img', 0]],
  },
  {
    widget: 'ShadImage',
    key: 'fallback',
    value: 'icon',
    context: { properties: { source: 'https://example.invalid/a.png' } },
    steps: ['error'],
  },
  { widget: 'ShadKanban', key: 'collapsedHeight', value: '{{40}}', offsetHeight: 333 },
  // (Any file type: the default accepts images and PDFs, which turns a CSV away before its size or content counts.)
  ...[
    ['maxSize', '{{5}}'],
    ['minSize', '{{1000}}'],
    ['parseContent', '{{true}}'],
  ].map(([key, value]) => ({
    widget: 'ShadFileUpload',
    key,
    value,
    context: { properties: { accept: '' } },
    steps: [['upload', [['people.csv', 'text/csv', 'name,age\nAda,36\n']]]],
  })),
  {
    widget: 'ShadFileUpload',
    key: 'parseFileType',
    value: 'json',
    context: { properties: { accept: '', parseContent: '{{true}}' } },
    steps: [['upload', [['people.csv', 'text/csv', 'name,age\nAda,36\n']]]],
  },
  {
    widget: 'ShadFileUpload',
    key: 'delimiter',
    value: ';',
    context: { properties: { accept: '', parseContent: '{{true}}' } },
    steps: [['upload', [['people.csv', 'text/csv', 'name;age\nAda;36\n']]]],
  },
  {
    widget: 'ShadFileUpload',
    key: 'showPreview',
    value: '{{false}}',
    steps: [['upload', [['dot.png', 'image/png', 'png']]]],
  },
  {
    widget: 'ShadMultiselect',
    key: 'maxVisibleChips',
    value: '{{1}}',
    context: { properties: { defaultValue: fx(['design', 'engineering', 'marketing']) } },
    expect: texts(/\+2 more/),
  },
  // Tabs
  {
    widget: 'ShadTabs',
    key: 'tabs',
    value: fx([{ id: 'a', title: 'Alpha tab' }]),
    context: { properties: { useDynamicOptions: '{{true}}' } },
    expect: texts(/Alpha tab/),
  },
  { widget: 'ShadTabs', key: 'defaultTab', value: 't1' },
  { widget: 'ShadTabs', key: 'showStepNav', value: '{{false}}', context: { properties: { variant: 'steps' } } },
  {
    widget: 'ShadTabs',
    key: 'nextLabel',
    value: 'Continue',
    context: { properties: { variant: 'steps' } },
    expect: texts(/Continue/),
  },
  {
    widget: 'ShadTabs',
    key: 'backLabel',
    value: 'Previous',
    context: { properties: { variant: 'steps', defaultTab: 't1' } },
    expect: texts(/Previous/),
  },
  {
    widget: 'ShadTabs',
    key: 'finishLabel',
    value: 'Submit now',
    context: { properties: { variant: 'steps', defaultTab: 't2' } },
    expect: texts(/Submit now/),
  },
  { widget: 'ShadTabs', key: 'linearSteps', value: '{{false}}', context: { properties: { variant: 'steps' } } },
  // Dialog: its body, header and footer exist only while open.
  ...[
    ['showHeader', '{{false}}'],
    ['showFooter', '{{false}}'],
    ['size', 'sm'],
    ['modalHeight', '{{250}}'],
    ['hideCloseButton', '{{true}}'],
    ['variant', 'sheet'],
  ].map(([key, value]) => ({ widget: 'ShadDialog', key, value, steps: ['open'] })),
  { widget: 'ShadDialog', key: 'side', value: 'left', context: { properties: { variant: 'sheet' } }, steps: ['open'] },
  ...[
    'headerBackgroundColor',
    'headerDividerColor',
    'bodyBackgroundColor',
    'footerBackgroundColor',
    'footerDividerColor',
  ].map((key) => ({ widget: 'ShadDialog', key, section: 'styles', value: '#e11d48', steps: ['open'] })),
  { widget: 'ShadDialog', key: 'hideOnEsc', value: '{{false}}', steps: ['open', 'escape'] },
  { widget: 'ShadDialog', key: 'closeOnClickingOutside', value: '{{true}}', steps: ['open', 'clickOutside'] },
  {
    widget: 'ShadDialog',
    key: 'icon',
    section: 'styles',
    value: 'IconStar',
    context: { styles: { iconVisibility: '{{true}}' } },
  },
  {
    widget: 'ShadDialog',
    key: 'iconColor',
    section: 'styles',
    value: '#e11d48',
    context: { styles: { iconVisibility: '{{true}}' } },
  },
  // RenderWidget's tooltip, on hover, for every widget that has one: its text, and its format (HTML renders tags).
  // (The dialog shows it on its trigger button.)
  ...NAMES.filter((n) => CONFIGS[n].properties?.tooltip).flatMap((widget) => {
    const hover = widget === 'ShadDialog' ? ['hover', 'button'] : 'hover';
    return [
      { widget, key: 'tooltip', value: 'Helpful tip 42', steps: [hover], expect: texts(/Helpful tip 42/) },
      {
        widget,
        key: 'tooltipFormat',
        value: 'html',
        context: { properties: { tooltip: '<b>Bold tip</b>' } },
        steps: [hover],
      },
    ];
  }),
];

// Need a real browser, checked in the browser pane (2026-10-10).
export const BROWSER = {
  // Shown only in the chart's hover tooltip, which Recharts positions from layout.
  ShadRadarChart: ['valuePrefix', 'valueSuffix'],
  ShadSparkline: ['valuePrefix', 'valueSuffix'],
  ShadScatterChart: ['nameField'],
  // RenderWidget collapses the box of a hidden widget in the canvas layout, outside the widget.
  ShadDialog: ['collapseWhenHidden'],
};

// Proved by a dedicated spec: the loading look (fuzz/loading.spec), dynamic height (dynamicHeight.spec), chart
// animation (fuzz/chartAnimate.spec), a button's full width in a flex row (fuzz/sizedBox.spec), the avatar image
// (fuzz/avatarImage.spec).
const ANIMATED = [
  'ShadLineChart',
  'ShadComboChart',
  'ShadFunnelChart',
  'ShadRadarChart',
  'ShadRadialChart',
  'ShadScatterChart',
  'ShadSparkline',
];
export const ELSEWHERE = (name) => [
  'loadingIndicator',
  'dynamicHeight',
  ...(ANIMATED.includes(name) ? ['animate'] : []),
  ...(name === 'ShadButton' ? ['fullWidth'] : []),
  ...(name === 'ShadAvatar' ? ['src'] : []),
  // Tabs scrolling the new tab to its top: containers.spec, with real tab canvases.
  ...(name === 'ShadTabs' ? ['scrollToTopOnTabSwitch'] : []),
];

/** Every property of `name` some check other than the generic one proves. */
export const covered = (name) => [
  ...PROBES.filter((p) => p.widget === name).map((p) => p.key),
  ...(BROWSER[name] || []),
  ...ELSEWHERE(name),
];
