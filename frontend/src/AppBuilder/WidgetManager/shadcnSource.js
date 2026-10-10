// shadcn/ui pack (experiment, exp/antd-pack): native ToolJet widgets that render shadcn/ui components (Radix +
// Tailwind, Widgets/Shadcn) in the app's own React tree. Same contract as the Ant Design pack (antDesignSource.js):
// inspector properties, events, exposed values and actions like the built-in widgets. The literal per-widget configs
// are generated from this file by scripts-shadcn-literals.mjs. The helpers are repeated from antDesignSource.js
// because the generator imports this file on its own.

const code = (displayName, schema, defaultValue, extra = {}) => ({
  type: 'code',
  displayName,
  validation: { schema, ...(defaultValue !== undefined ? { defaultValue } : {}) },
  ...extra,
});
const toggle = (displayName, defaultValue = false, extra = {}) => ({
  type: 'toggle',
  displayName,
  validation: { schema: { type: 'boolean' }, defaultValue },
  ...extra,
});
const choice = (displayName, values, defaultValue) => ({
  type: 'switch',
  displayName,
  options: values.map((v) => ({ displayName: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
  validation: { schema: { type: 'string' }, defaultValue },
  isFxNotRequired: true,
  fullWidth: true,
});

const STRING = { type: 'string' };
const NUMBER = { type: 'number' };
const ARRAY = { type: 'array' };
const ANY = {
  type: 'union',
  schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'array' }, { type: 'object' }],
};

const commonProperties = (withHeight) => ({
  ...(withHeight ? { dynamicHeight: toggle('Dynamic height', false, { section: 'additionalActions' }) } : {}),
  loadingState: toggle('Loading state', false, { section: 'additionalActions' }),
  visibility: toggle('Visibility', true, { section: 'additionalActions' }),
  disabledState: toggle('Disable', false, { section: 'additionalActions' }),
});
const commonDefinition = (withHeight) => ({
  ...(withHeight ? { dynamicHeight: { value: '{{false}}' } } : {}),
  loadingState: { value: '{{false}}' },
  visibility: { value: '{{true}}' },
  disabledState: { value: '{{false}}' },
});

const shadConfig = ({
  name,
  displayName,
  description,
  defaultSize,
  properties,
  defaults,
  events = {},
  exposedVariables = {},
  actions = [],
  withHeight = false,
}) => ({
  name,
  displayName,
  description,
  component: name,
  defaultSize,
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: { ...properties, ...commonProperties(withHeight) },
  events,
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
  },
  exposedVariables: { isVisible: true, isLoading: false, isDisabled: false, ...exposedVariables },
  actions,
  definition: {
    others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
    properties: { ...defaults, ...commonDefinition(withHeight) },
    events: [],
    styles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
  },
});

// Inputs carry shadcn's form layout: an optional label above and an optional description below the control.
const fieldProperties = {
  label: code('Label', STRING, ''),
  description: code('Help text', STRING, ''),
};
const fieldDefaults = { label: { value: '' }, description: { value: '' } };
const OPTIONS_HINT = "['Standard', 'Premium'] or [{ label, value }]";

// ---- Actions and feedback ------------------------------------------------------------------------------------------

export const shadButtonConfig = shadConfig({
  name: 'ShadButton',
  displayName: 'Button',
  description: 'shadcn/ui button',
  defaultSize: { width: 6, height: 36 },
  properties: {
    text: code('Label', STRING, 'Button'),
    variant: choice('Variant', ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'], 'default'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default'),
    fullWidth: toggle('Full width'),
  },
  defaults: {
    text: { value: 'Button' },
    variant: { value: 'default' },
    size: { value: 'default' },
    fullWidth: { value: '{{false}}' },
  },
  events: { onClick: { displayName: 'On click' } },
});

export const shadAlertConfig = shadConfig({
  name: 'ShadAlert',
  displayName: 'Alert',
  description: 'shadcn/ui alert',
  defaultSize: { width: 20, height: 72 },
  withHeight: true,
  properties: {
    title: code('Title', STRING, 'Heads up'),
    description: code('Description', STRING, ''),
    variant: choice('Variant', ['default', 'destructive'], 'default'),
  },
  defaults: { title: { value: 'Heads up' }, description: { value: '' }, variant: { value: 'default' } },
});

export const shadBreadcrumbConfig = shadConfig({
  name: 'ShadBreadcrumb',
  displayName: 'Breadcrumb',
  description: 'shadcn/ui breadcrumb',
  defaultSize: { width: 14, height: 24 },
  properties: { items: code('Items', ARRAY, [], { placeholder: "['Home', 'Fleet', 'Seraphine']" }) },
  defaults: { items: { value: "{{['Home', 'Section', 'Page']}}" } },
});

// ---- Typography ----------------------------------------------------------------------------------------------------

export const shadHeadingConfig = shadConfig({
  name: 'ShadHeading',
  displayName: 'Heading',
  description: 'shadcn/ui heading (h1 to h4)',
  defaultSize: { width: 16, height: 36 },
  withHeight: true,
  properties: {
    text: code('Text', STRING, 'Heading'),
    level: choice('Level', ['h1', 'h2', 'h3', 'h4'], 'h2'),
  },
  defaults: { text: { value: 'Heading' }, level: { value: 'h2' } },
});

export const shadTextConfig = shadConfig({
  name: 'ShadText',
  displayName: 'Text',
  description: 'shadcn/ui paragraph, lead, muted or small text',
  defaultSize: { width: 16, height: 24 },
  withHeight: true,
  properties: {
    text: code('Text', STRING, 'Text'),
    tone: choice('Style', ['paragraph', 'lead', 'muted', 'small', 'large'], 'paragraph'),
  },
  defaults: { text: { value: 'Text' }, tone: { value: 'paragraph' } },
});

// ---- Data display --------------------------------------------------------------------------------------------------

export const shadTableConfig = shadConfig({
  name: 'ShadTable',
  displayName: 'Table',
  description: 'shadcn/ui data table (TanStack): sortable columns, row selection, pagination',
  defaultSize: { width: 28, height: 420 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, []),
    columns: code('Columns', ARRAY, [], {
      placeholder: "[{ title: 'Name', dataIndex: 'name', kind: 'text|badge|money|date|number', align: 'right' }]",
    }),
    pageSize: code('Rows per page (0 = all)', NUMBER, 10),
    currency: code('Currency (money columns)', STRING, 'USD'),
    emptyText: code('Empty message', STRING, 'No results.'),
  },
  defaults: {
    data: { value: "{{[{ id: 1, name: 'Sample', status: 'active', amount: 1200 }]}}" },
    columns: {
      value:
        "{{[{ title: 'Name', dataIndex: 'name' }, { title: 'Status', dataIndex: 'status', kind: 'badge' }, { title: 'Amount', dataIndex: 'amount', kind: 'money' }]}}",
    },
    pageSize: { value: '{{10}}' },
    currency: { value: 'USD' },
    emptyText: { value: 'No results.' },
  },
  events: { onRowClicked: { displayName: 'On row clicked' } },
  exposedVariables: { selectedRow: {}, selectedRowIndex: null },
});

export const shadStatConfig = shadConfig({
  name: 'ShadStat',
  displayName: 'Stat',
  description: 'shadcn/ui dashboard figure: label, value, change badge and footnote',
  defaultSize: { width: 10, height: 120 },
  properties: {
    label: code('Label', STRING, 'Total revenue'),
    value: code('Value', { type: 'union', schemas: [{ type: 'number' }, { type: 'string' }] }, '$1,250.00'),
    change: code('Change (e.g. +12.5%)', STRING, ''),
    trend: choice('Trend', ['up', 'down', 'neutral'], 'up'),
    footnote: code('Footnote', STRING, ''),
    card: toggle('Show as card', true),
  },
  defaults: {
    label: { value: 'Total revenue' },
    value: { value: '$1,250.00' },
    change: { value: '' },
    trend: { value: 'up' },
    footnote: { value: '' },
    card: { value: '{{true}}' },
  },
});

export const shadBadgeConfig = shadConfig({
  name: 'ShadBadge',
  displayName: 'Badge',
  description: 'shadcn/ui badge',
  defaultSize: { width: 4, height: 24 },
  properties: {
    text: code('Text', STRING, 'Badge'),
    variant: choice('Variant', ['default', 'secondary', 'outline', 'success', 'warning', 'destructive'], 'default'),
  },
  defaults: { text: { value: 'Badge' }, variant: { value: 'default' } },
});

export const shadAvatarConfig = shadConfig({
  name: 'ShadAvatar',
  displayName: 'Avatar',
  description: 'shadcn/ui avatar or avatar stack',
  defaultSize: { width: 6, height: 36 },
  properties: {
    names: code(
      'Names (one or many)',
      { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }] },
      'Ada Lovelace'
    ),
    src: code('Image URL (single avatar)', STRING, ''),
    size: code('Size (px)', NUMBER, 32),
  },
  defaults: { names: { value: 'Ada Lovelace' }, src: { value: '' }, size: { value: '{{32}}' } },
});

export const shadProgressConfig = shadConfig({
  name: 'ShadProgress',
  displayName: 'Progress',
  description: 'shadcn/ui progress bar with optional label',
  defaultSize: { width: 12, height: 36 },
  properties: {
    value: code('Percent', NUMBER, 60),
    label: code('Label', STRING, ''),
    showValue: toggle('Show percent'),
  },
  defaults: { value: { value: '{{60}}' }, label: { value: '' }, showValue: { value: '{{false}}' } },
});

export const shadSeparatorConfig = shadConfig({
  name: 'ShadSeparator',
  displayName: 'Separator',
  description: 'shadcn/ui separator',
  defaultSize: { width: 20, height: 24 },
  properties: { orientation: choice('Orientation', ['horizontal', 'vertical'], 'horizontal') },
  defaults: { orientation: { value: 'horizontal' } },
});

export const shadSkeletonConfig = shadConfig({
  name: 'ShadSkeleton',
  displayName: 'Skeleton',
  description: 'shadcn/ui loading placeholder',
  defaultSize: { width: 16, height: 80 },
  properties: { lines: code('Lines', NUMBER, 3), avatar: toggle('Avatar') },
  defaults: { lines: { value: '{{3}}' }, avatar: { value: '{{false}}' } },
});

export const shadAccordionConfig = shadConfig({
  name: 'ShadAccordion',
  displayName: 'Accordion',
  description: 'shadcn/ui accordion (FAQ, grouped detail)',
  defaultSize: { width: 20, height: 160 },
  withHeight: true,
  properties: {
    items: code('Items', ARRAY, [], { placeholder: "[{ title: 'Inclusions', content: 'Crew, fuel, linen' }]" }),
    multiple: toggle('Several open at once'),
    defaultOpen: code('Open by default (indexes)', ARRAY, []),
  },
  defaults: {
    items: {
      value:
        "{{[{ title: 'Inclusions', content: 'Crew, fuel and linen' }, { title: 'Cancellation', content: 'Free until 30 days before departure' }]}}",
    },
    multiple: { value: '{{false}}' },
    defaultOpen: { value: '{{[]}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { openIndexes: [] },
});

export const shadEmptyConfig = shadConfig({
  name: 'ShadEmpty',
  displayName: 'Empty',
  description: 'shadcn/ui empty state with title, description and an optional action',
  defaultSize: { width: 14, height: 200 },
  properties: {
    title: code('Title', STRING, 'No results'),
    description: code('Description', STRING, ''),
    actionLabel: code('Action label', STRING, ''),
  },
  defaults: { title: { value: 'No results' }, description: { value: '' }, actionLabel: { value: '' } },
  events: { onAction: { displayName: 'On action' } },
});

// ---- Inputs --------------------------------------------------------------------------------------------------------

export const shadInputConfig = shadConfig({
  name: 'ShadInput',
  displayName: 'Input',
  description:
    'shadcn/ui text input with label. Height: 64px with a label (label above the control), 36px without; add 24px for help text',
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties,
    placeholder: code('Placeholder', STRING, ''),
    defaultValue: code('Default value', STRING, ''),
    inputType: choice('Type', ['text', 'email', 'number', 'password', 'search'], 'text'),
  },
  defaults: {
    ...fieldDefaults,
    placeholder: { value: '' },
    defaultValue: { value: '' },
    inputType: { value: 'text' },
  },
  events: { onChange: { displayName: 'On change' }, onEnterPressed: { displayName: 'On enter pressed' } },
  exposedVariables: { value: '' },
  actions: [
    { handle: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }] },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

export const shadTextareaConfig = shadConfig({
  name: 'ShadTextarea',
  displayName: 'Textarea',
  description: 'shadcn/ui multi-line input with label. A label adds 22px above and help text 24px below',
  defaultSize: { width: 14, height: 120 },
  properties: {
    ...fieldProperties,
    placeholder: code('Placeholder', STRING, ''),
    defaultValue: code('Default value', STRING, ''),
  },
  defaults: { ...fieldDefaults, placeholder: { value: '' }, defaultValue: { value: '' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
  actions: [
    { handle: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }] },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

export const shadSelectConfig = shadConfig({
  name: 'ShadSelect',
  displayName: 'Select',
  description:
    'shadcn/ui select. Height: 64px with a label (label above the control), 36px without; add 24px for help text',
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties,
    options: code('Options', ARRAY, [], { placeholder: OPTIONS_HINT }),
    placeholder: code('Placeholder', STRING, 'Select'),
    defaultValue: code('Default value', ANY, ''),
  },
  defaults: {
    ...fieldDefaults,
    options: { value: "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}" },
    placeholder: { value: 'Select' },
    defaultValue: { value: '' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '', selectedOption: {} },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select option',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '' }],
    },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

export const shadCheckboxConfig = shadConfig({
  name: 'ShadCheckbox',
  displayName: 'Checkbox',
  description: 'shadcn/ui checkbox with label',
  defaultSize: { width: 8, height: 24 },
  properties: {
    label: code('Label', STRING, 'Checkbox'),
    description: code('Help text', STRING, ''),
    defaultChecked: toggle('Checked by default'),
  },
  defaults: { label: { value: 'Checkbox' }, description: { value: '' }, defaultChecked: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: false },
});

export const shadSwitchConfig = shadConfig({
  name: 'ShadSwitch',
  displayName: 'Switch',
  description: 'shadcn/ui switch with label',
  defaultSize: { width: 8, height: 24 },
  properties: {
    label: code('Label', STRING, 'Enabled'),
    description: code('Help text', STRING, ''),
    defaultChecked: toggle('On by default'),
  },
  defaults: { label: { value: 'Enabled' }, description: { value: '' }, defaultChecked: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: false },
});

export const shadRadioGroupConfig = shadConfig({
  name: 'ShadRadioGroup',
  displayName: 'Radio group',
  description: 'shadcn/ui radio group. A label adds 22px above and help text 24px below',
  defaultSize: { width: 10, height: 112 },
  properties: {
    ...fieldProperties,
    options: code('Options', ARRAY, [], { placeholder: OPTIONS_HINT }),
    defaultValue: code('Default value', ANY, ''),
    horizontal: toggle('Side by side'),
  },
  defaults: {
    ...fieldDefaults,
    options: { value: "{{['Standard', 'Premium', 'Charter']}}" },
    defaultValue: { value: 'Standard' },
    horizontal: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select option',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '' }],
    },
  ],
});

export const shadSliderConfig = shadConfig({
  name: 'ShadSlider',
  displayName: 'Slider',
  description:
    'shadcn/ui slider, single value or range. Height: 64px with a label (label above the control), 36px without; add 24px for help text',
  defaultSize: { width: 14, height: 64 },
  properties: {
    ...fieldProperties,
    min: code('Minimum', NUMBER, 0),
    max: code('Maximum', NUMBER, 100),
    step: code('Step', NUMBER, 1),
    defaultValue: code(
      'Default value (number, or [start, end] for a range)',
      { type: 'union', schemas: [{ type: 'number' }, { type: 'array' }] },
      50
    ),
  },
  defaults: {
    ...fieldDefaults,
    min: { value: '{{0}}' },
    max: { value: '{{100}}' },
    step: { value: '{{1}}' },
    defaultValue: { value: '{{50}}' },
  },
  events: { onChange: { displayName: 'On change (on release)' } },
  exposedVariables: { value: 50 },
});

export const shadDatePickerConfig = shadConfig({
  name: 'ShadDatePicker',
  displayName: 'Date picker',
  description:
    'shadcn/ui date picker (popover calendar), single date or range. Height: 64px with a label (label above the control), 36px without; add 24px for help text',
  defaultSize: { width: 10, height: 64 },
  properties: {
    ...fieldProperties,
    mode: choice('Mode', ['single', 'range'], 'single'),
    placeholder: code('Placeholder', STRING, 'Pick a date'),
    defaultValue: code('Default (YYYY-MM-DD, or [start, end] for a range)', ANY, ''),
    format: code('Display format', STRING, 'DD MMM YYYY'),
  },
  defaults: {
    ...fieldDefaults,
    mode: { value: 'single' },
    placeholder: { value: 'Pick a date' },
    defaultValue: { value: '' },
    format: { value: 'DD MMM YYYY' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '', startDate: '', endDate: '' },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const shadToggleGroupConfig = shadConfig({
  name: 'ShadToggleGroup',
  displayName: 'Toggle group',
  description: 'shadcn/ui segmented toggle (filters, views), like a tabs list',
  defaultSize: { width: 14, height: 36 },
  properties: {
    options: code('Options', ARRAY, [], { placeholder: "['All', 'Open', 'Closed'] or [{ label, value }]" }),
    defaultValue: code('Default value', ANY, ''),
    fullWidth: toggle('Full width'),
  },
  defaults: {
    options: { value: "{{['All', 'Open', 'Closed']}}" },
    defaultValue: { value: 'All' },
    fullWidth: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
});

// ---- Charts (Recharts, styled like shadcn/ui charts) ------------------------------------------------------------------

const CHART_DATA =
  "{{[{ month: 'Jun', revenue: 182000 }, { month: 'Jul', revenue: 246000 }, { month: 'Aug', revenue: 268000 }, { month: 'Sep', revenue: 197000 }, { month: 'Oct', revenue: 121000 }]}}";
const seriesProps = {
  data: code('Data', ARRAY, [], { placeholder: "[{ month: 'Jun', revenue: 182000, bookings: 12 }]" }),
  xField: code('X field', STRING, 'month'),
  yFields: code(
    'Series fields (one or many)',
    { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }] },
    'revenue'
  ),
  valuePrefix: code('Value prefix', STRING, ''),
  valueSuffix: code('Value suffix', STRING, ''),
  showLegend: toggle('Legend'),
  emptyText: code('Empty message', STRING, 'No data'),
};
const seriesDefaults = {
  data: { value: CHART_DATA },
  xField: { value: 'month' },
  yFields: { value: 'revenue' },
  valuePrefix: { value: '' },
  valueSuffix: { value: '' },
  showLegend: { value: '{{false}}' },
  emptyText: { value: 'No data' },
};

export const shadAreaChartConfig = shadConfig({
  name: 'ShadAreaChart',
  displayName: 'Area chart',
  description: 'shadcn/ui area or line chart (trends over time)',
  defaultSize: { width: 20, height: 280 },
  properties: {
    ...seriesProps,
    lineOnly: toggle('Line only (no fill)'),
    stack: toggle('Stack series'),
    curve: choice('Curve', ['natural', 'linear', 'step'], 'natural'),
  },
  defaults: {
    ...seriesDefaults,
    lineOnly: { value: '{{false}}' },
    stack: { value: '{{false}}' },
    curve: { value: 'natural' },
  },
  events: { onClick: { displayName: 'On click' } },
  exposedVariables: { clickedDatum: {} },
});

export const shadBarChartConfig = shadConfig({
  name: 'ShadBarChart',
  displayName: 'Bar chart',
  description: 'shadcn/ui bar chart, vertical or horizontal, grouped or stacked',
  defaultSize: { width: 20, height: 280 },
  properties: { ...seriesProps, horizontal: toggle('Horizontal bars'), stack: toggle('Stack series') },
  defaults: { ...seriesDefaults, horizontal: { value: '{{false}}' }, stack: { value: '{{false}}' } },
  events: { onClick: { displayName: 'On click' } },
  exposedVariables: { clickedDatum: {} },
});

export const shadPieChartConfig = shadConfig({
  name: 'ShadPieChart',
  displayName: 'Pie chart',
  description: 'shadcn/ui pie or donut chart with an optional center figure',
  defaultSize: { width: 12, height: 280 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ type: 'Charter', value: 62 }]" }),
    categoryField: code('Category field', STRING, 'type'),
    valueField: code('Value field', STRING, 'value'),
    donut: toggle('Donut', true),
    centerValue: code('Center figure', STRING, ''),
    centerLabel: code('Center caption', STRING, ''),
    showLegend: toggle('Legend', true),
    emptyText: code('Empty message', STRING, 'No data'),
  },
  defaults: {
    data: {
      value: "{{[{ type: 'Charter', value: 62 }, { type: 'Day trip', value: 24 }, { type: 'Event', value: 14 }]}}",
    },
    categoryField: { value: 'type' },
    valueField: { value: 'value' },
    donut: { value: '{{true}}' },
    centerValue: { value: '' },
    centerLabel: { value: '' },
    showLegend: { value: '{{true}}' },
    emptyText: { value: 'No data' },
  },
  events: { onClick: { displayName: 'On click' } },
  exposedVariables: { clickedDatum: {} },
});

export const shadcnConfigs = [
  shadButtonConfig,
  shadAlertConfig,
  shadBreadcrumbConfig,
  shadHeadingConfig,
  shadTextConfig,
  shadTableConfig,
  shadStatConfig,
  shadBadgeConfig,
  shadAvatarConfig,
  shadProgressConfig,
  shadSeparatorConfig,
  shadSkeletonConfig,
  shadAccordionConfig,
  shadEmptyConfig,
  shadInputConfig,
  shadTextareaConfig,
  shadSelectConfig,
  shadCheckboxConfig,
  shadSwitchConfig,
  shadRadioGroupConfig,
  shadSliderConfig,
  shadDatePickerConfig,
  shadToggleGroupConfig,
  shadAreaChartConfig,
  shadBarChartConfig,
  shadPieChartConfig,
];
export const SHADCN_COMPONENTS = shadcnConfigs.map((c) => c.name);
