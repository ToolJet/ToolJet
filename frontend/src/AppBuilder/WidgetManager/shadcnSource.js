// shadcn/ui pack (experiment, exp/antd-pack): native ToolJet widgets that render shadcn/ui components (Radix +
// Tailwind, Widgets/Shadcn) in the app's own React tree. Same contract as the Ant Design pack (antDesignSource.js):
// inspector properties, events, exposed values and actions like the built-in widgets. The literal per-widget configs
// are generated from this file by scripts-shadcn-literals.mjs, with the config helpers shared by every shadcn source
// module (shadcnPackHelpers.js).

import {
  ANY,
  ARRAY,
  NUMBER,
  STRING,
  choice,
  choiceValidation,
  code,
  colorStyle,
  shadConfig,
  sizeStyle,
  textValidation,
  toggle,
} from './shadcnPackHelpers.js';

// Styles. Each falls back to the app theme when unset (Widgets/Shadcn/shadcnLook.js maps them to CSS variables);
// colorStyle and sizeStyle come from the shared helpers.
const alignStyle = {
  type: 'alignButtons',
  displayName: 'Text alignment (left, center, right)',
  validation: { schema: STRING, defaultValue: 'left' },
};
// Form controls with a box (input, textarea, select, date picker).
const fieldStyles = {
  labelColor: colorStyle('Label color'),
  helpTextColor: colorStyle('Help text color'),
  backgroundColor: colorStyle('Field background'),
  textColor: colorStyle('Field text color'),
  placeholderColor: colorStyle('Placeholder color'),
  borderColor: colorStyle('Field border color'),
  accentColor: colorStyle('Accent (focus ring, selection)'),
  errorColor: colorStyle('Error color (message and border)'),
  borderRadius: sizeStyle('Field radius'),
};
// Controls beside a label (checkbox, switch, radio group, slider).
const choiceStyles = (accent) => ({
  accentColor: colorStyle(accent),
  labelColor: colorStyle('Label color'),
  helpTextColor: colorStyle('Help text color'),
});
const chartStyles = {
  chartColor: colorStyle('Chart color (series palette from it)'),
  gridColor: colorStyle('Grid line color'),
  axisTextColor: colorStyle('Axis label color'),
  legendTextColor: colorStyle('Legend text color'),
};

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
  // Replace the variant's own colours where set.
  styles: {
    backgroundColor: colorStyle('Button background'),
    hoverBackgroundColor: colorStyle('Button hover background'),
    textColor: colorStyle('Button text color'),
    borderColor: colorStyle('Button border color'),
    borderRadius: sizeStyle('Button radius'),
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
  defaults: {
    title: { value: 'Heads up' },
    description: { value: '' },
    variant: { value: 'default' },
  },
  styles: {
    backgroundColor: colorStyle('Alert background'),
    borderColor: colorStyle('Alert border color'),
    titleColor: colorStyle('Alert title color'),
    textColor: colorStyle('Alert description color'),
    borderRadius: sizeStyle('Alert radius'),
  },
});

export const shadBreadcrumbConfig = shadConfig({
  name: 'ShadBreadcrumb',
  displayName: 'Breadcrumb',
  description: 'shadcn/ui breadcrumb',
  defaultSize: { width: 14, height: 24 },
  properties: {
    items: code('Items', ARRAY, [], {
      placeholder: "['Home', 'Fleet', 'Seraphine']",
    }),
  },
  defaults: { items: { value: "{{['Home', 'Section', 'Page']}}" } },
  styles: {
    textColor: colorStyle('Breadcrumb link color'),
    currentColor: colorStyle('Current page color'),
    separatorColor: colorStyle('Separator color'),
  },
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
  styles: { textColor: colorStyle('Heading color'), textAlign: alignStyle },
  styleDefaults: { textAlign: { value: 'left' } },
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
  styles: { textColor: colorStyle('Text color'), textAlign: alignStyle },
  styleDefaults: { textAlign: { value: 'left' } },
});

// ---- Data display --------------------------------------------------------------------------------------------------

// The Table lives in shadcnSource.table.js.

export const shadStatConfig = shadConfig({
  name: 'ShadStat',
  displayName: 'Stat',
  description: 'shadcn/ui dashboard figure: label, value, change badge and footnote',
  defaultSize: { width: 10, height: 120 },
  withHeight: true,
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
  styles: {
    backgroundColor: colorStyle('Card background'),
    borderColor: colorStyle('Card border color'),
    borderRadius: sizeStyle('Card radius'),
    labelColor: colorStyle('Label color'),
    valueColor: colorStyle('Value color'),
    footnoteColor: colorStyle('Footnote color'),
    // The change badge's colour for an up or a down trend (text on a light tint); unset keeps a neutral outline.
    positiveColor: colorStyle('Change color when trend is up'),
    negativeColor: colorStyle('Change color when trend is down'),
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
  // Replace the variant's own colours where set.
  styles: {
    backgroundColor: colorStyle('Badge background'),
    textColor: colorStyle('Badge text color'),
    borderColor: colorStyle('Badge border color'),
    borderRadius: sizeStyle('Badge radius'),
  },
});

export const shadAvatarConfig = shadConfig({
  name: 'ShadAvatar',
  displayName: 'Avatar',
  description:
    'shadcn/ui avatar or avatar group: names is one name, a comma-separated list, or an array of names or { name, src } (a photo per person); the first maxVisible show, the rest as a +N chip',
  defaultSize: { width: 6, height: 36 },
  properties: {
    names: code(
      'Names (one or many; or [{ name, src }])',
      { type: 'union', schemas: [{ type: 'string' }, { type: 'array' }] },
      'Ada Lovelace'
    ),
    src: code('Image URL (single avatar)', STRING, ''),
    size: code('Size (px)', NUMBER, 32),
    maxVisible: code('Most avatars shown (rest as +N)', NUMBER, 5),
  },
  defaults: {
    names: { value: 'Ada Lovelace' },
    src: { value: '' },
    size: { value: '{{32}}' },
    maxVisible: { value: '{{5}}' },
  },
  styles: {
    backgroundColor: colorStyle('Initials background'),
    textColor: colorStyle('Initials color'),
    ringColor: colorStyle('Ring color (between stacked avatars)'),
  },
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
  defaults: {
    value: { value: '{{60}}' },
    label: { value: '' },
    showValue: { value: '{{false}}' },
  },
  styles: {
    barColor: colorStyle('Bar color'),
    trackColor: colorStyle('Track color'),
    labelColor: colorStyle('Label color'),
    valueColor: colorStyle('Percent text color'),
    barHeight: sizeStyle('Bar height'),
  },
});

export const shadSeparatorConfig = shadConfig({
  name: 'ShadSeparator',
  displayName: 'Separator',
  description: 'shadcn/ui separator',
  defaultSize: { width: 20, height: 24 },
  properties: {
    orientation: choice('Orientation', ['horizontal', 'vertical'], 'horizontal'),
  },
  defaults: { orientation: { value: 'horizontal' } },
  styles: { lineColor: colorStyle('Line color'), thickness: sizeStyle('Line thickness') },
});

export const shadSkeletonConfig = shadConfig({
  name: 'ShadSkeleton',
  displayName: 'Skeleton',
  description: 'shadcn/ui loading placeholder',
  defaultSize: { width: 16, height: 80 },
  properties: { lines: code('Lines', NUMBER, 3), avatar: toggle('Avatar') },
  defaults: { lines: { value: '{{3}}' }, avatar: { value: '{{false}}' } },
  styles: { placeholderColor: colorStyle('Placeholder color') },
});

export const shadAccordionConfig = shadConfig({
  name: 'ShadAccordion',
  displayName: 'Accordion',
  description: 'shadcn/ui accordion (FAQ, grouped detail)',
  defaultSize: { width: 20, height: 160 },
  withHeight: true,
  properties: {
    items: code('Items', ARRAY, [], {
      placeholder: "[{ title: 'Inclusions', content: 'Crew, fuel, linen' }]",
    }),
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
  styles: {
    titleColor: colorStyle('Item title color'),
    textColor: colorStyle('Item content color'),
    dividerColor: colorStyle('Divider color'),
    iconColor: colorStyle('Chevron color'),
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
  defaults: {
    title: { value: 'No results' },
    description: { value: '' },
    actionLabel: { value: '' },
  },
  styles: {
    backgroundColor: colorStyle('Background'),
    borderColor: colorStyle('Dashed border color'),
    borderRadius: sizeStyle('Radius'),
    iconBackgroundColor: colorStyle('Icon background'),
    iconColor: colorStyle('Icon color'),
    titleColor: colorStyle('Title color'),
    textColor: colorStyle('Description color'),
  },
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
  styles: fieldStyles,
  validation: textValidation,
  events: {
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
    onChange: { displayName: 'On change' },
    onEnterPressed: { displayName: 'On enter pressed' },
  },
  exposedVariables: { isValid: true, isMandatory: false, value: '' },
  actions: [
    {
      handle: 'setText',
      displayName: 'Set text',
      params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }],
    },
    { handle: 'clear', displayName: 'Clear' },
    { handle: 'setFocus', displayName: 'Set focus' },
    { handle: 'setBlur', displayName: 'Set blur' },
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
  defaults: {
    ...fieldDefaults,
    placeholder: { value: '' },
    defaultValue: { value: '' },
  },
  styles: fieldStyles,
  validation: textValidation,
  events: {
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
    onChange: { displayName: 'On change' },
  },
  exposedVariables: { isValid: true, isMandatory: false, value: '' },
  actions: [
    {
      handle: 'setText',
      displayName: 'Set text',
      params: [{ handle: 'text', displayName: 'Text', defaultValue: '' }],
    },
    { handle: 'clear', displayName: 'Clear' },
    { handle: 'setFocus', displayName: 'Set focus' },
    { handle: 'setBlur', displayName: 'Set blur' },
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
    options: {
      value: "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}",
    },
    placeholder: { value: 'Select' },
    defaultValue: { value: '' },
  },
  styles: fieldStyles,
  validation: choiceValidation,
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { isValid: true, isMandatory: false, value: '', selectedOption: {} },
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
  defaults: {
    label: { value: 'Checkbox' },
    description: { value: '' },
    defaultChecked: { value: '{{false}}' },
  },
  styles: {
    ...choiceStyles('Checked color'),
    borderColor: colorStyle('Unchecked box border color'),
    errorColor: colorStyle('Error color'),
  },
  validation: choiceValidation,
  events: {
    onChange: { displayName: 'On change' },
    onCheck: { displayName: 'On check' },
    onUnCheck: { displayName: 'On uncheck' },
  },
  exposedVariables: { isValid: true, isMandatory: false, value: false },
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
  defaults: {
    label: { value: 'Enabled' },
    description: { value: '' },
    defaultChecked: { value: '{{false}}' },
  },
  styles: { ...choiceStyles('Switch on color'), offColor: colorStyle('Switch off color') },
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
  styles: {
    ...choiceStyles('Selected color'),
    optionTextColor: colorStyle('Option text color'),
    errorColor: colorStyle('Error color'),
  },
  validation: choiceValidation,
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { isValid: true, isMandatory: false, value: '' },
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
  styles: { ...choiceStyles('Range and handle color'), trackColor: colorStyle('Track color') },
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
  styles: fieldStyles,
  validation: choiceValidation,
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { isValid: true, isMandatory: false, value: '', startDate: '', endDate: '' },
  actions: [{ handle: 'clear', displayName: 'Clear' }],
});

export const shadToggleGroupConfig = shadConfig({
  name: 'ShadToggleGroup',
  displayName: 'Toggle group',
  description: 'shadcn/ui segmented toggle (filters, views), like a tabs list',
  defaultSize: { width: 14, height: 36 },
  properties: {
    options: code('Options', ARRAY, [], {
      placeholder: "['All', 'Open', 'Closed'] or [{ label, value }]",
    }),
    defaultValue: code('Default value', ANY, ''),
    fullWidth: toggle('Full width'),
  },
  defaults: {
    options: { value: "{{['All', 'Open', 'Closed']}}" },
    defaultValue: { value: 'All' },
    fullWidth: { value: '{{false}}' },
  },
  styles: {
    backgroundColor: colorStyle('Group background'),
    textColor: colorStyle('Option text color'),
    selectedBackgroundColor: colorStyle('Selected option background'),
    selectedTextColor: colorStyle('Selected option text color'),
    borderRadius: sizeStyle('Group radius'),
  },
  events: { onChange: { displayName: 'On change' } },
  exposedVariables: { value: '' },
});

// ---- Kanban ------------------------------------------------------------------------------------------------------

export const shadKanbanConfig = shadConfig({
  name: 'ShadKanban',
  displayName: 'Kanban',
  description:
    'shadcn/ui Kanban board from data: columns are values of a status field; cards show the fields you map (title, description, badge, tags, progress, meta, avatar), or, with Card content Custom, child components laid out on the card and bound to {{cardData.<field>}}. Drag to move, optional add and delete buttons, and addCard/updateCard/deleteCard/moveCard actions; save changes with queries on the card events (components.<name>.movedCard, lastAddedCard, lastRemovedCard, lastUpdatedCard, cards)',
  defaultSize: { width: 43, height: 420 },
  withHeight: true,
  properties: {
    data: code('Cards', ARRAY, [], {
      placeholder: "[{ id: 1, title: 'Fix login', status: 'todo', priority: 'High' }]",
    }),
    columns: code('Columns (in order)', ARRAY, [], {
      placeholder: "['todo', 'doing', 'done'] or [{ id: 'todo', title: 'To do' }]",
    }),
    statusField: code('Status field', STRING, 'status'),
    idField: code('Id field', STRING, 'id'),
    // Card content: Fields shows the mapped fields below; Custom makes the card a canvas: components dropped on the
    // first card repeat on every card and read the card with {{cardData.<field>}}, as in a list view row.
    cardLayout: choice('Card content', ['fields', 'custom'], 'fields'),
    cardHeight: code('Card height (custom content)', NUMBER, 96),
    // Fields: each is optional; a card shows only the parts that have a field and a value.
    titleField: code('Title field', STRING, 'title'),
    descriptionField: code('Description field', STRING, ''),
    badgeField: code('Badge field (priority, severity)', STRING, ''),
    tagsField: code('Tags field (a list)', STRING, ''),
    progressField: code('Progress field (0 to 100)', STRING, ''),
    metaField: code('Meta field (a date, a count)', STRING, ''),
    avatarField: code('Avatar field (a name)', STRING, ''),
    density: choice('Card density', ['comfortable', 'compact'], 'comfortable'),
    // Optional: a card taller than this shows only its top part (px of content) with a Show more toggle.
    collapsedHeight: code('Collapsed card height (px, empty: show all)', {
      type: 'union',
      schemas: [{ type: 'number' }, { type: 'string' }],
    }),
    // Optional: a fixed width for every column (px); empty shares the board width, at least 240px each.
    columnWidth: code('Column width (px, empty: fill the board)', {
      type: 'union',
      schemas: [{ type: 'number' }, { type: 'string' }],
    }),
    showCount: toggle('Card count on columns', true),
    // Columns fold to a narrow strip from a button in their header; collapsedColumns lists those folded at start.
    collapsibleColumns: toggle('Collapsible columns', true),
    collapsedColumns: code('Columns collapsed at start (ids)', ARRAY, [], { placeholder: "['done']" }),
    allowDrag: toggle('Drag to move', true),
    allowAdd: toggle('Add card button on columns'),
    allowDelete: toggle('Delete button on cards'),
    emptyText: code('Empty column message', STRING, 'No cards'),
    // Value -> colour for the badge field, e.g. { High: '#dc2626' }; values it does not name keep the built-in colours.
    badgeColors: code(
      'Badge colours by value',
      { type: 'object' },
      {},
      { placeholder: "{ High: '#dc2626', Low: '#16a34a' }" }
    ),
  },
  defaults: {
    data: {
      value:
        "{{[{ id: 1, title: 'Draft the brief', status: 'todo', priority: 'High', owner: 'Ada Lovelace' }, { id: 2, title: 'Review designs', status: 'doing', priority: 'Medium', owner: 'Alan Turing' }, { id: 3, title: 'Ship v1', status: 'done', priority: 'Low', owner: 'Grace Hopper' }]}}",
    },
    columns: {
      value:
        "{{[{ id: 'todo', title: 'To do' }, { id: 'doing', title: 'In progress' }, { id: 'done', title: 'Done' }]}}",
    },
    statusField: { value: 'status' },
    idField: { value: 'id' },
    cardLayout: { value: 'fields' },
    cardHeight: { value: '{{96}}' },
    titleField: { value: 'title' },
    descriptionField: { value: '' },
    badgeField: { value: 'priority' },
    tagsField: { value: '' },
    progressField: { value: '' },
    metaField: { value: '' },
    avatarField: { value: 'owner' },
    density: { value: 'comfortable' },
    collapsedHeight: { value: '' },
    columnWidth: { value: '' },
    showCount: { value: '{{true}}' },
    collapsibleColumns: { value: '{{true}}' },
    collapsedColumns: { value: '{{[]}}' },
    allowDrag: { value: '{{true}}' },
    allowAdd: { value: '{{false}}' },
    allowDelete: { value: '{{false}}' },
    emptyText: { value: 'No cards' },
    badgeColors: { value: '{{{}}}' },
  },
  // Each falls back to the app theme when unset.
  styles: {
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (selection, progress, drop line)',
      validation: { schema: { type: 'string' } },
    },
    columnBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Column background',
      validation: { schema: { type: 'string' } },
    },
    columnBorderColor: {
      type: 'colorSwatches',
      displayName: 'Column border color',
      validation: { schema: { type: 'string' } },
    },
    columnTitleColor: {
      type: 'colorSwatches',
      displayName: 'Column title color',
      validation: { schema: { type: 'string' } },
    },
    columnCountBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Column count background',
      validation: { schema: { type: 'string' } },
    },
    columnCountTextColor: {
      type: 'colorSwatches',
      displayName: 'Column count text color',
      validation: { schema: { type: 'string' } },
    },
    columnGap: {
      type: 'numberInput',
      displayName: 'Gap between columns',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
    },
    columnBorderRadius: {
      type: 'numberInput',
      displayName: 'Column radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
      },
    },
    cardBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Card background',
      validation: { schema: { type: 'string' } },
    },
    cardBorderColor: {
      type: 'colorSwatches',
      displayName: 'Card border color',
      validation: { schema: { type: 'string' } },
    },
    cardTitleColor: {
      type: 'colorSwatches',
      displayName: 'Card title color',
      validation: { schema: { type: 'string' } },
    },
    cardTextColor: {
      type: 'colorSwatches',
      displayName: 'Card secondary text color',
      validation: { schema: { type: 'string' } },
    },
    progressColor: {
      type: 'colorSwatches',
      displayName: 'Progress color (else the accent)',
      validation: { schema: { type: 'string' } },
    },
    cardBorderRadius: {
      type: 'numberInput',
      displayName: 'Card radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
      },
    },
    cardShadow: {
      type: 'select',
      displayName: 'Card shadow',
      options: [
        { name: 'None', value: 'none' },
        { name: 'Small', value: 'sm' },
        { name: 'Medium', value: 'md' },
        { name: 'Large', value: 'lg' },
      ],
      validation: { schema: { type: 'string' }, defaultValue: 'sm' },
    },
  },
  styleDefaults: { cardShadow: { value: 'sm' } },
  events: {
    onCardClicked: { displayName: 'On card clicked' },
    onCardMoved: { displayName: 'On card moved' },
    onAddCardClick: { displayName: 'On add card click' },
    onCardAdded: { displayName: 'On card added' },
    onCardUpdated: { displayName: 'On card updated' },
    onCardRemoved: { displayName: 'On card removed' },
  },
  exposedVariables: {
    cards: [],
    selectedCard: {},
    movedCard: {},
    lastMove: {},
    addCardColumn: '',
    collapsedColumns: [],
    lastAddedCard: {},
    lastUpdatedCard: {},
    lastRemovedCard: {},
  },
  actions: [
    {
      handle: 'addCard',
      displayName: 'Add card',
      params: [
        {
          handle: 'card',
          displayName: 'Card',
          defaultValue: "{{{ title: 'New card' }}}",
        },
        {
          handle: 'columnId',
          displayName: 'Column id (optional)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'updateCard',
      displayName: 'Update card',
      params: [
        { handle: 'id', displayName: 'Card id', defaultValue: '' },
        {
          handle: 'values',
          displayName: 'Values',
          defaultValue: "{{{ title: 'Renamed' }}}",
        },
      ],
    },
    {
      handle: 'moveCard',
      displayName: 'Move card',
      params: [
        { handle: 'id', displayName: 'Card id', defaultValue: '' },
        { handle: 'columnId', displayName: 'Column id', defaultValue: '' },
      ],
    },
    {
      handle: 'deleteCard',
      displayName: 'Delete card',
      params: [{ handle: 'id', displayName: 'Card id', defaultValue: '' }],
    },
  ],
});

// ---- Charts (Recharts, styled like shadcn/ui charts) ------------------------------------------------------------------

const CHART_DATA =
  "{{[{ month: 'Jun', revenue: 182000 }, { month: 'Jul', revenue: 246000 }, { month: 'Aug', revenue: 268000 }, { month: 'Sep', revenue: 197000 }, { month: 'Oct', revenue: 121000 }]}}";
// Explicit series (or slice) colours in order; unset ones take the palette from the Chart color style or the theme.
const SERIES_COLORS = code('Series colors (in order)', ARRAY, [], { placeholder: "['#0f766e', '#f59e0b']" });
const seriesProps = {
  data: code('Data', ARRAY, [], {
    placeholder: "[{ month: 'Jun', revenue: 182000, bookings: 12 }]",
  }),
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
  colors: SERIES_COLORS,
};
const seriesDefaults = {
  data: { value: CHART_DATA },
  xField: { value: 'month' },
  yFields: { value: 'revenue' },
  valuePrefix: { value: '' },
  valueSuffix: { value: '' },
  showLegend: { value: '{{false}}' },
  emptyText: { value: 'No data' },
  colors: { value: '{{[]}}' },
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
  styles: chartStyles,
  events: { onClick: { displayName: 'On click' } },
  exposedVariables: { clickedDatum: {} },
});

export const shadBarChartConfig = shadConfig({
  name: 'ShadBarChart',
  displayName: 'Bar chart',
  description: 'shadcn/ui bar chart, vertical or horizontal, grouped or stacked',
  defaultSize: { width: 20, height: 280 },
  properties: {
    ...seriesProps,
    horizontal: toggle('Horizontal bars'),
    stack: toggle('Stack series'),
  },
  defaults: {
    ...seriesDefaults,
    horizontal: { value: '{{false}}' },
    stack: { value: '{{false}}' },
  },
  styles: chartStyles,
  events: { onClick: { displayName: 'On click' } },
  exposedVariables: { clickedDatum: {} },
});

export const shadPieChartConfig = shadConfig({
  name: 'ShadPieChart',
  displayName: 'Pie chart',
  description: 'shadcn/ui pie or donut chart with an optional center figure',
  defaultSize: { width: 12, height: 280 },
  properties: {
    data: code('Data', ARRAY, [], {
      placeholder: "[{ type: 'Charter', value: 62 }]",
    }),
    categoryField: code('Category field', STRING, 'type'),
    valueField: code('Value field', STRING, 'value'),
    donut: toggle('Donut', true),
    centerValue: code('Center figure', STRING, ''),
    centerLabel: code('Center caption', STRING, ''),
    showLegend: toggle('Legend', true),
    emptyText: code('Empty message', STRING, 'No data'),
    colors: SERIES_COLORS,
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
    colors: { value: '{{[]}}' },
  },
  styles: {
    chartColor: chartStyles.chartColor,
    legendTextColor: chartStyles.legendTextColor,
    sliceBorderColor: colorStyle('Slice border color'),
    centerValueColor: colorStyle('Center figure color'),
    centerLabelColor: colorStyle('Center caption color'),
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
  shadKanbanConfig,
];
export const SHADCN_COMPONENTS = shadcnConfigs.map((c) => c.name);
