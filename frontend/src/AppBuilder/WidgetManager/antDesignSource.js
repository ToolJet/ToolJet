// Ant Design pack (experiment, exp/antd-pack): native ToolJet widgets that render antd v5 components in the app's own
// React tree. Each config maps antd props to inspector properties, antd callbacks to events and the current value to
// exposed variables, exactly like the built-in widgets, so drag and drop, the properties panel, bindings, permissions
// and releases all apply unchanged. The look follows the app theme through one ConfigProvider (see Widgets/AntDesign).

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

const antConfig = ({
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

export const antButtonConfig = antConfig({
  name: 'AntButton',
  displayName: 'Button',
  description: 'Ant Design button',
  defaultSize: { width: 6, height: 40 },
  properties: {
    text: code('Label', STRING, 'Button'),
    type: choice('Type', ['primary', 'default', 'dashed', 'text', 'link'], 'primary'),
    danger: toggle('Danger'),
    block: toggle('Full width'),
  },
  defaults: {
    text: { value: 'Button' },
    type: { value: 'primary' },
    danger: { value: '{{false}}' },
    block: { value: '{{false}}' },
  },
  events: { onClick: { displayName: 'On click' } },
});

export const antInputConfig = antConfig({
  name: 'AntInput',
  displayName: 'Input',
  description: 'Ant Design text input',
  defaultSize: { width: 10, height: 40 },
  properties: {
    placeholder: code('Placeholder', STRING, 'Type here'),
    defaultValue: code('Default value', STRING, ''),
    allowClear: toggle('Show clear button'),
  },
  defaults: { placeholder: { value: 'Type here' }, defaultValue: { value: '' }, allowClear: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' }, onEnterPressed: { displayName: 'On enter pressed' } },
  exposedVariables: { value: '' },
  actions: [
    { handle: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }] },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

export const antSelectConfig = antConfig({
  name: 'AntSelect',
  displayName: 'Select',
  description: 'Ant Design select',
  defaultSize: { width: 10, height: 40 },
  properties: {
    options: code('Options', ARRAY, [], { placeholder: "[{ label: 'One', value: 1 }]" }),
    placeholder: code('Placeholder', STRING, 'Select'),
    defaultValue: code('Default value', ANY, ''),
    allowClear: toggle('Show clear button'),
    showSearch: toggle('Searchable'),
  },
  defaults: {
    options: { value: "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}" },
    placeholder: { value: 'Select' },
    defaultValue: { value: '' },
    allowClear: { value: '{{false}}' },
    showSearch: { value: '{{false}}' },
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

export const antDatePickerConfig = antConfig({
  name: 'AntDatePicker',
  displayName: 'Date picker',
  description: 'Ant Design date picker',
  defaultSize: { width: 8, height: 40 },
  properties: {
    placeholder: code('Placeholder', STRING, 'Select date'),
    defaultValue: code('Default value (YYYY-MM-DD)', STRING, ''),
    format: code('Display format', STRING, 'DD MMM YYYY'),
  },
  defaults: { placeholder: { value: 'Select date' }, defaultValue: { value: '' }, format: { value: 'DD MMM YYYY' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const antTableConfig = antConfig({
  name: 'AntTable',
  displayName: 'Table',
  description: 'Ant Design table',
  defaultSize: { width: 28, height: 420 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, []),
    columns: code('Columns', ARRAY, [], {
      placeholder: "[{ title: 'Name', dataIndex: 'name', kind: 'text|tag|money|date' }]",
    }),
    pageSize: code('Rows per page', NUMBER, 8),
    size: choice('Density', ['small', 'middle', 'large'], 'middle'),
    bordered: toggle('Bordered'),
    emptyText: code('Empty message', STRING, 'No data'),
  },
  defaults: {
    emptyText: { value: 'No data' },
    data: { value: "{{[{ id: 1, name: 'Sample', status: 'active', amount: 1200 }]}}" },
    columns: {
      value:
        "{{[{ title: 'Name', dataIndex: 'name' }, { title: 'Status', dataIndex: 'status', kind: 'tag' }, { title: 'Amount', dataIndex: 'amount', kind: 'money' }]}}",
    },
    pageSize: { value: '{{8}}' },
    size: { value: 'middle' },
    bordered: { value: '{{false}}' },
  },
  events: { onRowClicked: { displayName: 'On row clicked' } },
  exposedVariables: { selectedRow: {}, selectedRowIndex: null },
});

export const antCardConfig = antConfig({
  name: 'AntCard',
  displayName: 'Card',
  description: 'Ant Design card',
  defaultSize: { width: 12, height: 160 },
  withHeight: true,
  properties: {
    title: code('Title', STRING, 'Card title'),
    extra: code('Extra (top right)', STRING, ''),
    content: code('Content', STRING, 'Card content'),
    hoverable: toggle('Hoverable'),
  },
  defaults: {
    title: { value: 'Card title' },
    extra: { value: '' },
    content: { value: 'Card content' },
    hoverable: { value: '{{false}}' },
  },
  events: { onClick: { displayName: 'On click' } },
});

export const antTagConfig = antConfig({
  name: 'AntTag',
  displayName: 'Tag',
  description: 'Ant Design tag',
  defaultSize: { width: 4, height: 30 },
  properties: {
    text: code('Text', STRING, 'Tag'),
    color: code('Color', STRING, 'default', { placeholder: 'success, warning, error, processing or #hex' }),
  },
  defaults: { text: { value: 'Tag' }, color: { value: 'default' } },
});

export const antStatisticConfig = antConfig({
  name: 'AntStatistic',
  displayName: 'Statistic',
  description: 'Ant Design statistic',
  defaultSize: { width: 10, height: 110 },
  properties: {
    title: code('Title', STRING, 'Statistic'),
    value: code('Value', { type: 'union', schemas: [{ type: 'number' }, { type: 'string' }] }, 0),
    prefix: code('Prefix', STRING, ''),
    suffix: code('Suffix', STRING, ''),
    precision: code('Decimals', NUMBER, 0),
    card: toggle('Show as card'),
  },
  defaults: {
    title: { value: 'Statistic' },
    value: { value: '{{0}}' },
    prefix: { value: '' },
    suffix: { value: '' },
    precision: { value: '{{0}}' },
    card: { value: '{{false}}' },
  },
});

// ---- Typography -------------------------------------------------------------------------------------------------

export const antTitleConfig = antConfig({
  name: 'AntTitle',
  displayName: 'Title',
  description: 'Ant Design heading',
  defaultSize: { width: 16, height: 40 },
  withHeight: true,
  properties: {
    text: code('Text', STRING, 'Heading'),
    level: choice('Level', ['1', '2', '3', '4', '5'], '3'),
  },
  defaults: { text: { value: 'Heading' }, level: { value: '3' } },
});

export const antTextConfig = antConfig({
  name: 'AntText',
  displayName: 'Text',
  description: 'Ant Design text or paragraph',
  defaultSize: { width: 16, height: 30 },
  withHeight: true,
  properties: {
    text: code('Text', STRING, 'Text'),
    tone: choice('Tone', ['default', 'secondary', 'success', 'warning', 'danger'], 'default'),
    strong: toggle('Bold'),
    paragraph: toggle('Paragraph (wraps)', false),
    copyable: toggle('Copyable'),
  },
  defaults: {
    text: { value: 'Text' },
    tone: { value: 'default' },
    strong: { value: '{{false}}' },
    paragraph: { value: '{{false}}' },
    copyable: { value: '{{false}}' },
  },
});

// ---- Data display ----------------------------------------------------------------------------------------------

export const antDescriptionsConfig = antConfig({
  name: 'AntDescriptions',
  displayName: 'Descriptions',
  description: 'Ant Design label and value pairs',
  defaultSize: { width: 20, height: 160 },
  withHeight: true,
  properties: {
    title: code('Title', STRING, ''),
    items: code('Items', ARRAY, [], { placeholder: "[{ label: 'Status', value: 'Active' }]" }),
    column: code('Columns', NUMBER, 2),
    bordered: toggle('Bordered'),
    layout: choice('Layout', ['horizontal', 'vertical'], 'horizontal'),
  },
  defaults: {
    title: { value: '' },
    items: { value: "{{[{ label: 'Owner', value: 'Ada Lovelace' }, { label: 'Status', value: 'Active' }]}}" },
    column: { value: '{{2}}' },
    bordered: { value: '{{false}}' },
    layout: { value: 'horizontal' },
  },
});

export const antListConfig = antConfig({
  name: 'AntList',
  displayName: 'List',
  description: 'Ant Design list of records with avatar, title, description and an action',
  defaultSize: { width: 20, height: 300 },
  withHeight: true,
  properties: {
    data: code('Data', ARRAY, []),
    titleKey: code('Title field', STRING, 'title'),
    descriptionKey: code('Description field', STRING, 'description'),
    avatarKey: code('Avatar field (name or image URL)', STRING, ''),
    extraKey: code('Right-side field', STRING, ''),
    actionLabel: code('Action label', STRING, ''),
    bordered: toggle('Bordered'),
    pageSize: code('Items per page (0 = all)', NUMBER, 0),
    emptyText: code('Empty message', STRING, 'No data'),
  },
  defaults: {
    emptyText: { value: 'No data' },
    data: { value: "{{[{ id: 1, title: 'First item', description: 'Details' }]}}" },
    titleKey: { value: 'title' },
    descriptionKey: { value: 'description' },
    avatarKey: { value: '' },
    extraKey: { value: '' },
    actionLabel: { value: '' },
    bordered: { value: '{{false}}' },
    pageSize: { value: '{{0}}' },
  },
  events: { onItemClicked: { displayName: 'On item clicked' }, onActionClicked: { displayName: 'On action clicked' } },
  exposedVariables: { selectedItem: {}, selectedItemIndex: null },
});

export const antBadgeConfig = antConfig({
  name: 'AntBadge',
  displayName: 'Badge',
  description: 'Ant Design status dot with text',
  defaultSize: { width: 6, height: 30 },
  properties: {
    text: code('Text', STRING, 'Active'),
    status: choice('Status', ['success', 'processing', 'warning', 'error', 'default'], 'success'),
  },
  defaults: { text: { value: 'Active' }, status: { value: 'success' } },
});

export const antAvatarConfig = antConfig({
  name: 'AntAvatar',
  displayName: 'Avatar',
  description: 'Ant Design avatar or avatar group',
  defaultSize: { width: 6, height: 40 },
  properties: {
    names: code(
      'Names (one or many)',
      { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }] },
      'Ada Lovelace'
    ),
    src: code('Image URL (single avatar)', STRING, ''),
    size: choice('Size', ['small', 'default', 'large'], 'default'),
    maxCount: code('Max shown', NUMBER, 4),
  },
  defaults: {
    names: { value: 'Ada Lovelace' },
    src: { value: '' },
    size: { value: 'default' },
    maxCount: { value: '{{4}}' },
  },
});

export const antProgressConfig = antConfig({
  name: 'AntProgress',
  displayName: 'Progress',
  description: 'Ant Design progress bar or circle',
  defaultSize: { width: 12, height: 40 },
  properties: {
    percent: code('Percent', NUMBER, 60),
    type: choice('Type', ['line', 'circle', 'dashboard'], 'line'),
    status: choice('Status', ['normal', 'active', 'success', 'exception'], 'normal'),
  },
  defaults: { percent: { value: '{{60}}' }, type: { value: 'line' }, status: { value: 'normal' } },
});

export const antTimelineConfig = antConfig({
  name: 'AntTimeline',
  displayName: 'Timeline',
  description: 'Ant Design timeline',
  defaultSize: { width: 14, height: 240 },
  withHeight: true,
  properties: {
    items: code('Items', ARRAY, [], { placeholder: "[{ label: '09 Oct', children: 'Booked', color: 'green' }]" }),
    mode: choice('Mode', ['left', 'alternate', 'right'], 'left'),
  },
  defaults: {
    items: { value: "{{[{ children: 'Created', color: 'blue' }, { children: 'Approved', color: 'green' }]}}" },
    mode: { value: 'left' },
  },
});

export const antEmptyConfig = antConfig({
  name: 'AntEmpty',
  displayName: 'Empty',
  description: 'Ant Design empty state',
  defaultSize: { width: 12, height: 160 },
  properties: { description: code('Description', STRING, 'No data') },
  defaults: { description: { value: 'No data' } },
});

// ---- Inputs ------------------------------------------------------------------------------------------------------

export const antTextAreaConfig = antConfig({
  name: 'AntTextArea',
  displayName: 'Text area',
  description: 'Ant Design multi-line input',
  defaultSize: { width: 14, height: 100 },
  properties: {
    placeholder: code('Placeholder', STRING, 'Type here'),
    defaultValue: code('Default value', STRING, ''),
    rows: code('Rows', NUMBER, 3),
  },
  defaults: { placeholder: { value: 'Type here' }, defaultValue: { value: '' }, rows: { value: '{{3}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
  actions: [
    { handle: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }] },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

export const antInputNumberConfig = antConfig({
  name: 'AntInputNumber',
  displayName: 'Number input',
  description: 'Ant Design number input',
  defaultSize: { width: 8, height: 40 },
  properties: {
    defaultValue: code('Default value', NUMBER, 0),
    min: code('Minimum', NUMBER, 0),
    max: code('Maximum', NUMBER, 1000000),
    step: code('Step', NUMBER, 1),
    prefix: code('Prefix', STRING, ''),
  },
  defaults: {
    defaultValue: { value: '{{0}}' },
    min: { value: '{{0}}' },
    max: { value: '{{1000000}}' },
    step: { value: '{{1}}' },
    prefix: { value: '' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: 0 },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{0}}' }],
    },
  ],
});

export const antRangePickerConfig = antConfig({
  name: 'AntRangePicker',
  displayName: 'Date range picker',
  description: 'Ant Design date range picker',
  defaultSize: { width: 12, height: 40 },
  properties: {
    defaultStart: code('Default start (YYYY-MM-DD)', STRING, ''),
    defaultEnd: code('Default end (YYYY-MM-DD)', STRING, ''),
    format: code('Display format', STRING, 'DD MMM YYYY'),
  },
  defaults: { defaultStart: { value: '' }, defaultEnd: { value: '' }, format: { value: 'DD MMM YYYY' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { startDate: '', endDate: '', nights: 0 },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const antCheckboxConfig = antConfig({
  name: 'AntCheckbox',
  displayName: 'Checkbox',
  description: 'Ant Design checkbox',
  defaultSize: { width: 8, height: 30 },
  properties: { label: code('Label', STRING, 'Checkbox'), defaultChecked: toggle('Checked by default') },
  defaults: { label: { value: 'Checkbox' }, defaultChecked: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: false },
});

export const antSwitchConfig = antConfig({
  name: 'AntSwitch',
  displayName: 'Switch',
  description: 'Ant Design switch with label',
  defaultSize: { width: 8, height: 30 },
  properties: { label: code('Label', STRING, 'Enabled'), defaultChecked: toggle('On by default') },
  defaults: { label: { value: 'Enabled' }, defaultChecked: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: false },
});

export const antSegmentedConfig = antConfig({
  name: 'AntSegmented',
  displayName: 'Segmented',
  description: 'Ant Design segmented control (filters, views)',
  defaultSize: { width: 14, height: 40 },
  properties: {
    options: code('Options', ARRAY, [], { placeholder: "['All', 'Open', 'Closed'] or [{ label, value }]" }),
    defaultValue: code('Default value', ANY, ''),
    block: toggle('Full width'),
  },
  defaults: {
    options: { value: "{{['All', 'Open', 'Closed']}}" },
    defaultValue: { value: 'All' },
    block: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
});

// ---- Feedback and navigation ---------------------------------------------------------------------------------------

export const antAlertConfig = antConfig({
  name: 'AntAlert',
  displayName: 'Alert',
  description: 'Ant Design alert banner',
  defaultSize: { width: 20, height: 60 },
  withHeight: true,
  properties: {
    message: code('Message', STRING, 'Heads up'),
    description: code('Description', STRING, ''),
    type: choice('Type', ['info', 'success', 'warning', 'error'], 'info'),
    showIcon: toggle('Show icon'),
  },
  defaults: {
    message: { value: 'Heads up' },
    description: { value: '' },
    type: { value: 'info' },
    showIcon: { value: '{{false}}' },
  },
});

export const antStepsConfig = antConfig({
  name: 'AntSteps',
  displayName: 'Steps',
  description: 'Ant Design steps',
  defaultSize: { width: 24, height: 60 },
  properties: {
    items: code('Steps', ARRAY, [], { placeholder: "[{ title: 'Requested' }, { title: 'Confirmed' }]" }),
    current: code('Current step (0-based)', NUMBER, 0),
    size: choice('Size', ['default', 'small'], 'small'),
  },
  defaults: {
    items: { value: "{{[{ title: 'Requested' }, { title: 'Confirmed' }, { title: 'At sea' }]}}" },
    current: { value: '{{0}}' },
    size: { value: 'small' },
  },
});

export const antBreadcrumbConfig = antConfig({
  name: 'AntBreadcrumb',
  displayName: 'Breadcrumb',
  description: 'Ant Design breadcrumb',
  defaultSize: { width: 14, height: 30 },
  properties: { items: code('Items', ARRAY, [], { placeholder: "['Home', 'Fleet', 'Seraphine']" }) },
  defaults: { items: { value: "{{['Home', 'Section', 'Page']}}" } },
});

export const antDividerConfig = antConfig({
  name: 'AntDivider',
  displayName: 'Divider',
  description: 'Ant Design divider with optional text',
  defaultSize: { width: 20, height: 30 },
  properties: {
    text: code('Text', STRING, ''),
    orientation: choice('Text position', ['left', 'center', 'right'], 'left'),
  },
  defaults: { text: { value: '' }, orientation: { value: 'left' } },
});

// ---- More inputs ---------------------------------------------------------------------------------------------------

const OPTIONS_HINT = "['Standard', 'Premium'] or [{ label, value }]";
const TREE_HINT = "[{ title: 'Fleet', value: 'fleet', children: [{ title: 'Seraphine', value: 'seraphine' }] }]";
const TREE_DEFAULT =
  "{{[{ title: 'Marina North', value: 'north', children: [{ title: 'Berth A1', value: 'a1' }, { title: 'Berth A2', value: 'a2' }] }, { title: 'Marina South', value: 'south', children: [{ title: 'Berth B1', value: 'b1' }] }]}}";

export const antRadioConfig = antConfig({
  name: 'AntRadio',
  displayName: 'Radio group',
  description: 'Ant Design radio group (one of a few visible options)',
  defaultSize: { width: 14, height: 40 },
  properties: {
    options: code('Options', ARRAY, [], { placeholder: OPTIONS_HINT }),
    defaultValue: code('Default value', ANY, ''),
    optionType: choice('Style', ['default', 'button'], 'default'),
    vertical: toggle('Stack vertically'),
  },
  defaults: {
    options: { value: "{{['Standard', 'Premium', 'Charter']}}" },
    defaultValue: { value: 'Standard' },
    optionType: { value: 'default' },
    vertical: { value: '{{false}}' },
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

export const antSliderConfig = antConfig({
  name: 'AntSlider',
  displayName: 'Slider',
  description: 'Ant Design slider, single value or range',
  defaultSize: { width: 14, height: 40 },
  properties: {
    min: code('Minimum', NUMBER, 0),
    max: code('Maximum', NUMBER, 100),
    step: code('Step', NUMBER, 1),
    defaultValue: code(
      'Default value (number, or [start, end] for a range)',
      { type: 'union', schemas: [{ type: 'number' }, { type: 'array' }] },
      30
    ),
    range: toggle('Range'),
  },
  defaults: {
    min: { value: '{{0}}' },
    max: { value: '{{100}}' },
    step: { value: '{{1}}' },
    defaultValue: { value: '{{30}}' },
    range: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change (on release)' } },
  exposedVariables: { value: 30 },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{0}}' }],
    },
  ],
});

export const antRateConfig = antConfig({
  name: 'AntRate',
  displayName: 'Rating',
  description: 'Ant Design star rating',
  defaultSize: { width: 8, height: 30 },
  properties: {
    defaultValue: code('Default value', NUMBER, 0),
    count: code('Stars', NUMBER, 5),
    allowHalf: toggle('Allow half stars'),
  },
  defaults: { defaultValue: { value: '{{0}}' }, count: { value: '{{5}}' }, allowHalf: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: 0 },
});

export const antTimePickerConfig = antConfig({
  name: 'AntTimePicker',
  displayName: 'Time picker',
  description: 'Ant Design time picker',
  defaultSize: { width: 8, height: 40 },
  properties: {
    placeholder: code('Placeholder', STRING, 'Select time'),
    defaultValue: code('Default value (HH:mm)', STRING, ''),
    format: code('Display format', STRING, 'HH:mm'),
    minuteStep: code('Minute step', NUMBER, 1),
  },
  defaults: {
    placeholder: { value: 'Select time' },
    defaultValue: { value: '' },
    format: { value: 'HH:mm' },
    minuteStep: { value: '{{1}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const antAutoCompleteConfig = antConfig({
  name: 'AntAutoComplete',
  displayName: 'Autocomplete',
  description: 'Ant Design text input with suggestions (free text allowed)',
  defaultSize: { width: 10, height: 40 },
  properties: {
    options: code('Suggestions', ARRAY, [], { placeholder: OPTIONS_HINT }),
    placeholder: code('Placeholder', STRING, 'Type to search'),
    defaultValue: code('Default value', STRING, ''),
    allowClear: toggle('Show clear button'),
  },
  defaults: {
    options: { value: "{{['Antibes', 'Mykonos', 'Portofino']}}" },
    placeholder: { value: 'Type to search' },
    defaultValue: { value: '' },
    allowClear: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change' }, onSelect: { displayName: 'On suggestion selected' } },
  exposedVariables: { value: '' },
  actions: [
    { handle: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }] },
    { handle: 'clear', displayName: 'Clear' },
  ],
});

export const antCascaderConfig = antConfig({
  name: 'AntCascader',
  displayName: 'Cascader',
  description: 'Ant Design cascading select (pick a path through nested options)',
  defaultSize: { width: 12, height: 40 },
  properties: {
    options: code('Options', ARRAY, [], {
      placeholder: "[{ label: 'Greece', value: 'gr', children: [{ label: 'Mykonos', value: 'myk' }] }]",
    }),
    placeholder: code('Placeholder', STRING, 'Select'),
    defaultValue: code('Default path', ARRAY, []),
    showSearch: toggle('Searchable'),
  },
  defaults: {
    options: {
      value:
        "{{[{ label: 'France', value: 'fr', children: [{ label: 'Antibes', value: 'antibes' }, { label: 'Cannes', value: 'cannes' }] }, { label: 'Greece', value: 'gr', children: [{ label: 'Mykonos', value: 'mykonos' }] }]}}",
    },
    placeholder: { value: 'Select' },
    defaultValue: { value: '{{[]}}' },
    showSearch: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: [], selectedLabels: [], lastValue: '' },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const antTreeSelectConfig = antConfig({
  name: 'AntTreeSelect',
  displayName: 'Tree select',
  description: 'Ant Design select over a tree of options',
  defaultSize: { width: 12, height: 40 },
  properties: {
    treeData: code('Tree', ARRAY, [], { placeholder: TREE_HINT }),
    placeholder: code('Placeholder', STRING, 'Select'),
    defaultValue: code('Default value', ANY, ''),
    multiple: toggle('Multiple'),
    treeCheckable: toggle('Checkboxes'),
    showSearch: toggle('Searchable'),
  },
  defaults: {
    treeData: { value: TREE_DEFAULT },
    placeholder: { value: 'Select' },
    defaultValue: { value: '' },
    multiple: { value: '{{false}}' },
    treeCheckable: { value: '{{false}}' },
    showSearch: { value: '{{false}}' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const antColorPickerConfig = antConfig({
  name: 'AntColorPicker',
  displayName: 'Color picker',
  description: 'Ant Design color picker',
  defaultSize: { width: 8, height: 40 },
  properties: {
    defaultValue: code('Default color', STRING, '#1677ff'),
    showText: toggle('Show value'),
  },
  defaults: { defaultValue: { value: '#1677ff' }, showText: { value: '{{false}}' } },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '#1677ff' },
});

export const antUploadConfig = antConfig({
  name: 'AntUpload',
  displayName: 'Upload',
  description:
    'Ant Design file picker (button or drag area); exposes the picked files with base64 content for a query to send',
  defaultSize: { width: 14, height: 40 },
  properties: {
    variant: choice('Style', ['button', 'dragger'], 'button'),
    buttonLabel: code('Label', STRING, 'Click to upload'),
    hint: code('Hint (drag area)', STRING, ''),
    accept: code('Accepted types', STRING, '', { placeholder: '.pdf,image/*' }),
    multiple: toggle('Multiple files'),
    maxCount: code('Max files (0 = no limit)', NUMBER, 0),
  },
  defaults: {
    variant: { value: 'button' },
    buttonLabel: { value: 'Click to upload' },
    hint: { value: '' },
    accept: { value: '' },
    multiple: { value: '{{false}}' },
    maxCount: { value: '{{0}}' },
  },
  events: { onChange: { displayName: 'On files changed' } },
  exposedVariables: { files: [] },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

// ---- More data display -----------------------------------------------------------------------------------------------

export const antTreeConfig = antConfig({
  name: 'AntTree',
  displayName: 'Tree',
  description: 'Ant Design tree (hierarchies, folders, org charts)',
  defaultSize: { width: 12, height: 240 },
  withHeight: true,
  properties: {
    treeData: code('Tree', ARRAY, [], { placeholder: TREE_HINT }),
    checkable: toggle('Checkboxes'),
    showLine: toggle('Show lines'),
    defaultExpandAll: toggle('Expand all by default'),
  },
  defaults: {
    treeData: { value: TREE_DEFAULT },
    checkable: { value: '{{false}}' },
    showLine: { value: '{{false}}' },
    defaultExpandAll: { value: '{{false}}' },
  },
  events: { onSelect: { displayName: 'On select' }, onCheck: { displayName: 'On check' } },
  exposedVariables: { selectedValue: '', selectedNode: {}, checkedValues: [] },
});

export const antCollapseConfig = antConfig({
  name: 'AntCollapse',
  displayName: 'Collapse',
  description: 'Ant Design collapsible panels (accordion, FAQ, grouped detail)',
  defaultSize: { width: 20, height: 200 },
  withHeight: true,
  properties: {
    items: code('Panels', ARRAY, [], { placeholder: "[{ title: 'Inclusions', content: 'Crew, fuel, linen' }]" }),
    accordion: toggle('One open at a time'),
    defaultOpen: code('Open by default (indexes)', ARRAY, []),
    ghost: toggle('Borderless'),
    size: choice('Size', ['small', 'middle', 'large'], 'middle'),
  },
  defaults: {
    items: {
      value:
        "{{[{ title: 'Inclusions', content: 'Crew, fuel and linen' }, { title: 'Cancellation', content: 'Free until 30 days before departure' }]}}",
    },
    accordion: { value: '{{false}}' },
    defaultOpen: { value: '{{[0]}}' },
    ghost: { value: '{{false}}' },
    size: { value: 'middle' },
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { openIndexes: [] },
});

export const antImageConfig = antConfig({
  name: 'AntImage',
  displayName: 'Image',
  description: 'Ant Design image with click-to-preview',
  defaultSize: { width: 12, height: 200 },
  properties: {
    src: code('Image URL', STRING, ''),
    alt: code('Alt text', STRING, ''),
    fit: choice('Fit', ['cover', 'contain', 'fill'], 'cover'),
    preview: toggle('Click to preview', true),
    radius: code('Corner radius (px)', NUMBER, 0),
  },
  defaults: {
    src: { value: 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg' },
    alt: { value: '' },
    fit: { value: 'cover' },
    preview: { value: '{{true}}' },
    radius: { value: '{{0}}' },
  },
  events: { onClick: { displayName: 'On click' } },
});

export const antCalendarConfig = antConfig({
  name: 'AntCalendar',
  displayName: 'Calendar',
  description: 'Ant Design month calendar with dated entries in each cell',
  defaultSize: { width: 28, height: 760 },
  properties: {
    events: code('Entries', ARRAY, [], {
      placeholder: "[{ date: '2026-10-12', title: 'Seraphine: Okafor', color: 'blue' }]",
    }),
    defaultValue: code('Initial date (YYYY-MM-DD)', STRING, ''),
    fullscreen: toggle('Full size', true),
  },
  defaults: { events: { value: '{{[]}}' }, defaultValue: { value: '' }, fullscreen: { value: '{{true}}' } },
  events: { onSelect: { displayName: 'On date selected' }, onEntryClicked: { displayName: 'On entry clicked' } },
  exposedVariables: { selectedDate: '', selectedEntry: {}, visibleMonth: '' },
});

export const antQRCodeConfig = antConfig({
  name: 'AntQRCode',
  displayName: 'QR code',
  description: 'Ant Design QR code',
  defaultSize: { width: 6, height: 170 },
  properties: {
    value: code('Value', STRING, 'https://tooljet.com'),
    bordered: toggle('Bordered', true),
    errorLevel: choice('Error correction', ['L', 'M', 'Q', 'H'], 'M'),
  },
  defaults: { value: { value: 'https://tooljet.com' }, bordered: { value: '{{true}}' }, errorLevel: { value: 'M' } },
});

export const antSkeletonConfig = antConfig({
  name: 'AntSkeleton',
  displayName: 'Skeleton',
  description: 'Ant Design loading placeholder',
  defaultSize: { width: 16, height: 120 },
  properties: {
    rows: code('Lines', NUMBER, 3),
    avatar: toggle('Avatar'),
    active: toggle('Animated'),
  },
  defaults: { rows: { value: '{{3}}' }, avatar: { value: '{{false}}' }, active: { value: '{{false}}' } },
});

export const antResultConfig = antConfig({
  name: 'AntResult',
  displayName: 'Result',
  description: 'Ant Design result page (success, error, 404, no access)',
  defaultSize: { width: 20, height: 280 },
  properties: {
    status: choice('Status', ['success', 'info', 'warning', 'error', '403', '404', '500'], 'info'),
    title: code('Title', STRING, 'Booking confirmed'),
    subTitle: code('Subtitle', STRING, ''),
    buttonLabel: code('Button label', STRING, ''),
  },
  defaults: {
    status: { value: 'info' },
    title: { value: 'Booking confirmed' },
    subTitle: { value: '' },
    buttonLabel: { value: '' },
  },
  events: { onButtonClick: { displayName: 'On button click' } },
});

export const antPaginationConfig = antConfig({
  name: 'AntPagination',
  displayName: 'Pagination',
  description: 'Ant Design pagination (drive a server-side query with currentPage and pageSize)',
  defaultSize: { width: 16, height: 40 },
  properties: {
    total: code('Total items', NUMBER, 50),
    pageSize: code('Page size', NUMBER, 10),
    defaultCurrent: code('Initial page', NUMBER, 1),
    simple: toggle('Simple'),
    showSizeChanger: toggle('Page size picker'),
    showTotal: toggle('Show total'),
  },
  defaults: {
    total: { value: '{{50}}' },
    pageSize: { value: '{{10}}' },
    defaultCurrent: { value: '{{1}}' },
    simple: { value: '{{false}}' },
    showSizeChanger: { value: '{{false}}' },
    showTotal: { value: '{{false}}' },
  },
  events: { onPageChanged: { displayName: 'On page changed' } },
  exposedVariables: { currentPage: 1, pageSize: 10 },
  actions: [
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [{ handle: 'page', displayName: 'Page', defaultValue: '{{1}}' }],
    },
  ],
});

// ---- Charts (@ant-design/plots, AntV G2) ----------------------------------------------------------------------------

const CHART_DATA =
  "{{[{ month: 'Jun', revenue: 182000 }, { month: 'Jul', revenue: 246000 }, { month: 'Aug', revenue: 268000 }, { month: 'Sep', revenue: 197000 }, { month: 'Oct', revenue: 121000 }]}}";
const chartConfig = ({
  name,
  displayName,
  description,
  properties,
  defaults,
  defaultSize = { width: 20, height: 320 },
}) =>
  antConfig({
    name,
    displayName,
    description,
    defaultSize,
    properties: {
      ...properties,
      showLegend: toggle('Legend', true),
      showLabels: toggle('Value labels'),
      emptyText: code('Empty message', STRING, 'No data'),
    },
    defaults: {
      ...defaults,
      showLegend: { value: '{{true}}' },
      showLabels: { value: '{{false}}' },
      emptyText: { value: 'No data' },
    },
    events: { onClick: { displayName: 'On click' } },
    exposedVariables: { clickedDatum: {} },
  });
const seriesProps = {
  data: code('Data', ARRAY, [], { placeholder: "[{ month: 'Jun', revenue: 182000, yacht: 'Seraphine' }]" }),
  xField: code('X field', STRING, 'month'),
  yField: code('Y field', STRING, 'revenue'),
  seriesField: code('Series field (optional, one line or bar per value)', STRING, ''),
  valuePrefix: code('Value prefix', STRING, ''),
  valueSuffix: code('Value suffix', STRING, ''),
};
const seriesDefaults = {
  data: { value: CHART_DATA },
  xField: { value: 'month' },
  yField: { value: 'revenue' },
  seriesField: { value: '' },
  valuePrefix: { value: '' },
  valueSuffix: { value: '' },
};

export const antLineChartConfig = chartConfig({
  name: 'AntLineChart',
  displayName: 'Line chart',
  description: 'Ant Design line or area chart (trends over time)',
  properties: {
    ...seriesProps,
    area: toggle('Area fill'),
    smooth: toggle('Smooth'),
    stack: toggle('Stack series (area)'),
  },
  defaults: {
    ...seriesDefaults,
    area: { value: '{{false}}' },
    smooth: { value: '{{false}}' },
    stack: { value: '{{false}}' },
  },
});

export const antColumnChartConfig = chartConfig({
  name: 'AntColumnChart',
  displayName: 'Bar chart',
  description: 'Ant Design column or horizontal bar chart (compare categories)',
  properties: {
    ...seriesProps,
    horizontal: toggle('Horizontal bars'),
    stack: toggle('Stack series (otherwise grouped)'),
  },
  defaults: { ...seriesDefaults, horizontal: { value: '{{false}}' }, stack: { value: '{{false}}' } },
});

export const antPieChartConfig = chartConfig({
  name: 'AntPieChart',
  displayName: 'Pie chart',
  description: 'Ant Design pie or donut chart (share of a whole)',
  defaultSize: { width: 14, height: 320 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ type: 'Charter', value: 62 }]" }),
    categoryField: code('Category field', STRING, 'type'),
    valueField: code('Value field', STRING, 'value'),
    donut: toggle('Donut'),
    centerLabel: code('Donut center label', STRING, ''),
  },
  defaults: {
    data: {
      value: "{{[{ type: 'Charter', value: 62 }, { type: 'Day trip', value: 24 }, { type: 'Event', value: 14 }]}}",
    },
    categoryField: { value: 'type' },
    valueField: { value: 'value' },
    donut: { value: '{{false}}' },
    centerLabel: { value: '' },
  },
});

export const antGaugeChartConfig = antConfig({
  name: 'AntGaugeChart',
  displayName: 'Gauge',
  description: 'Ant Design gauge (one value against a target, for example utilisation)',
  defaultSize: { width: 10, height: 240 },
  properties: {
    value: code('Value', NUMBER, 72),
    max: code('Maximum', NUMBER, 100),
    label: code('Label', STRING, 'Utilisation'),
    valueSuffix: code('Value suffix', STRING, '%'),
  },
  defaults: {
    value: { value: '{{72}}' },
    max: { value: '{{100}}' },
    label: { value: 'Utilisation' },
    valueSuffix: { value: '%' },
  },
});

export const antFunnelChartConfig = chartConfig({
  name: 'AntFunnelChart',
  displayName: 'Funnel chart',
  description: 'Ant Design funnel (conversion through stages)',
  defaultSize: { width: 14, height: 320 },
  properties: {
    data: code('Data', ARRAY, [], { placeholder: "[{ stage: 'Enquiries', count: 120 }]" }),
    xField: code('Stage field', STRING, 'stage'),
    yField: code('Value field', STRING, 'count'),
  },
  defaults: {
    data: {
      value:
        "{{[{ stage: 'Enquiries', count: 120 }, { stage: 'Quoted', count: 74 }, { stage: 'Deposit paid', count: 41 }, { stage: 'Sailed', count: 33 }]}}",
    },
    xField: { value: 'stage' },
    yField: { value: 'count' },
  },
});

export const antDesignConfigs = [
  antButtonConfig,
  antInputConfig,
  antSelectConfig,
  antDatePickerConfig,
  antTableConfig,
  antCardConfig,
  antTagConfig,
  antStatisticConfig,
  antTitleConfig,
  antTextConfig,
  antDescriptionsConfig,
  antListConfig,
  antBadgeConfig,
  antAvatarConfig,
  antProgressConfig,
  antTimelineConfig,
  antEmptyConfig,
  antTextAreaConfig,
  antInputNumberConfig,
  antRangePickerConfig,
  antCheckboxConfig,
  antSwitchConfig,
  antSegmentedConfig,
  antAlertConfig,
  antStepsConfig,
  antBreadcrumbConfig,
  antDividerConfig,
  antRadioConfig,
  antSliderConfig,
  antRateConfig,
  antTimePickerConfig,
  antAutoCompleteConfig,
  antCascaderConfig,
  antTreeSelectConfig,
  antColorPickerConfig,
  antUploadConfig,
  antTreeConfig,
  antCollapseConfig,
  antImageConfig,
  antCalendarConfig,
  antQRCodeConfig,
  antSkeletonConfig,
  antResultConfig,
  antPaginationConfig,
  antLineChartConfig,
  antColumnChartConfig,
  antPieChartConfig,
  antGaugeChartConfig,
  antFunnelChartConfig,
];
export const ANT_DESIGN_COMPONENTS = antDesignConfigs.map((c) => c.name);
