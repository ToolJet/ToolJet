// shadcn/ui pack (experiment): display widgets (Widgets/Shadcn/ShadDisplay.jsx): image, icon, link, tags, circular
// progress, spinner, key-value list, timeline, steps and pagination. Steps, Pagination and Link keep the native
// widgets' property, event, action and exposed-value names, so a ToolJet user's (and a model's) knowledge carries over.
import {
  ARRAY,
  NUMBER,
  NUMBER_OR_STRING,
  OBJECT,
  STRING,
  choice,
  code,
  colorStyle,
  select,
  shadConfig,
  sizeStyle,
  toggle,
} from './shadcnPackHelpers.js';

const ARRAY_OR_STRING = { type: 'union', schemas: [ARRAY, STRING] };
const ARRAY_OR_OBJECT = { type: 'union', schemas: [ARRAY, OBJECT] };
const param = (handle, displayName, defaultValue, extra = {}) => ({
  handle,
  displayName,
  ...(defaultValue !== undefined ? { defaultValue } : {}),
  ...extra,
});
const alignment = (displayName = 'Alignment') => ({
  type: 'alignButtons',
  displayName,
  validation: { schema: STRING, defaultValue: 'left' },
});
const TONES = ['default', 'muted', 'primary', 'success', 'warning', 'destructive'];

// ---- Image -----------------------------------------------------------------------------------------------------------

export const shadImageConfig = shadConfig({
  name: 'ShadImage',
  displayName: 'Image',
  description:
    "shadcn/ui image: source (URL), alternativeText, imageFit (cover, contain, fill), aspectRatio ('auto' fills the drawn height; '16/9', '4/3', '1/1' size it from the width), caption below, fallback when the URL is empty or fails ('placeholder', 'icon', or 'initials' of fallbackText), showBorder, zoomOnClick lightbox; a skeleton shows while it loads; onClick. Height: as drawn with aspect auto (a caption takes 28px of it)",
  defaultSize: { width: 10, height: 200 },
  withHeight: true,
  properties: {
    source: code('Image URL', STRING, ''),
    alternativeText: code('Alt text', STRING, ''),
    imageFit: select(
      'Fit',
      [
        ['cover', 'Cover (fill, crop)'],
        ['contain', 'Contain (whole image)'],
        ['fill', 'Fill (stretch)'],
      ],
      'cover'
    ),
    aspectRatio: select(
      'Aspect ratio',
      [
        ['auto', 'Auto (widget height)'],
        ['1/1', '1:1 square'],
        ['4/3', '4:3'],
        ['3/2', '3:2'],
        ['16/9', '16:9'],
        ['21/9', '21:9'],
        ['3/4', '3:4 portrait'],
        ['9/16', '9:16 portrait'],
      ],
      'auto'
    ),
    caption: code('Caption', STRING, ''),
    fallback: choice('Fallback', ['placeholder', 'icon', 'initials'], 'placeholder'),
    fallbackText: code('Fallback name (initials) or text', STRING, ''),
    showBorder: toggle('Border', false),
    zoomOnClick: toggle('Zoom on click (lightbox)', false),
  },
  defaults: {
    source: { value: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800' },
    alternativeText: { value: 'Mountain lake at sunrise' },
    imageFit: { value: 'cover' },
    aspectRatio: { value: 'auto' },
    caption: { value: '' },
    fallback: { value: 'placeholder' },
    fallbackText: { value: '' },
    showBorder: { value: '{{false}}' },
    zoomOnClick: { value: '{{false}}' },
  },
  styles: {
    borderRadius: sizeStyle('Image radius'),
    borderColor: colorStyle('Border color'),
    backgroundColor: colorStyle('Background (letterbox and fallback)'),
    fallbackTextColor: colorStyle('Fallback text and icon color'),
    captionColor: colorStyle('Caption color'),
  },
  events: { onClick: { displayName: 'On click' } },
  exposedVariables: { hasError: false },
});

// ---- Icon ------------------------------------------------------------------------------------------------------------

export const shadIconConfig = shadConfig({
  name: 'ShadIcon',
  displayName: 'Icon',
  description:
    "shadcn/ui icon: icon is any lucide name ('trending-up' or 'TrendingUp'; unknown names show a neutral dashed circle), size (px), strokeWidth, tone (default, muted, primary, success, warning, destructive) or the iconColor style, chip ('none', 'circle', 'square') for the tinted icon chip of KPI cards (chipColor style, else a tint of the icon colour; chipSize, else size x 2); onClick. Height: 40px with a chip at size 20, else the icon size",
  defaultSize: { width: 3, height: 40 },
  properties: {
    icon: code('Icon name (lucide)', STRING, 'trending-up', { placeholder: "'trending-up', 'users', 'shopping-cart'" }),
    size: code('Icon size (px)', NUMBER, 20),
    strokeWidth: code('Stroke width', NUMBER, 2),
    tone: select(
      'Tone (unless Icon color is set)',
      TONES.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)]),
      'primary'
    ),
    chip: choice('Background chip', ['none', 'circle', 'square'], 'square', { square: 'Rounded square' }),
    chipSize: code('Chip size (px, empty: icon x 2)', NUMBER_OR_STRING, ''),
  },
  defaults: {
    icon: { value: 'trending-up' },
    size: { value: '{{20}}' },
    strokeWidth: { value: '{{2}}' },
    tone: { value: 'primary' },
    chip: { value: 'square' },
    chipSize: { value: '' },
  },
  styles: {
    iconColor: colorStyle('Icon color'),
    chipColor: colorStyle('Chip background (default: icon color tint)'),
    chipRadius: sizeStyle('Chip radius (square chip)'),
    alignment: alignment('Alignment'),
  },
  styleDefaults: { alignment: { value: 'left' } },
  events: { onClick: { displayName: 'On click' } },
});

// ---- Link ------------------------------------------------------------------------------------------------------------

export const shadLinkConfig = shadConfig({
  name: 'ShadLink',
  displayName: 'Link',
  description:
    "shadcn/ui text link (native Link names): linkText, linkTarget (URL; empty makes it act as a button), targetType ('new' or 'same' tab), underline ('underline', 'on-hover', 'no-underline'), showIcon (external-link icon), fontSize (px), fontWeight (normal, medium, semibold, bold); textColor and hoverColor styles (default: the primary). onClick fires as well as navigating; onHover. Height: 24px at 14px",
  defaultSize: { width: 6, height: 24 },
  properties: {
    linkText: code('Link text', STRING, 'View details'),
    linkTarget: code('Link target (URL)', STRING, ''),
    targetType: choice('Open in', ['new', 'same'], 'new', { new: 'New tab', same: 'Same tab' }),
    underline: choice('Underline', ['underline', 'on-hover', 'no-underline'], 'on-hover', {
      underline: 'Always',
      'on-hover': 'On hover',
      'no-underline': 'Never',
    }),
    showIcon: toggle('External-link icon', false),
    fontSize: code('Font size (px)', NUMBER, 14),
    fontWeight: choice('Weight', ['normal', 'medium', 'semibold', 'bold'], 'medium'),
  },
  defaults: {
    linkText: { value: 'View details' },
    linkTarget: { value: 'https://tooljet.com' },
    targetType: { value: 'new' },
    underline: { value: 'on-hover' },
    showIcon: { value: '{{false}}' },
    fontSize: { value: '{{14}}' },
    fontWeight: { value: 'medium' },
  },
  styles: {
    textColor: colorStyle('Link color'),
    hoverColor: colorStyle('Link hover color'),
    alignment: alignment('Alignment'),
  },
  styleDefaults: { alignment: { value: 'left' } },
  events: { onClick: { displayName: 'On click' }, onHover: { displayName: 'On hover' } },
});

// ---- Tags ------------------------------------------------------------------------------------------------------------

export const shadTagsConfig = shadConfig({
  name: 'ShadTags',
  displayName: 'Tags',
  description:
    "shadcn/ui read-only tag chips: tags is an array or a comma-separated string; tagColors maps a value to a colour ({ Paid: '#16a34a' }: tinted chip, light background and strong text of that hue); variant ('soft', 'outline', 'solid'), size ('sm', 'default', 'lg'), overflow ('wrap', or 'single' for one line with +N), pill. Clicking a tag sets lastClickedTag and fires onTagClick. Height: 24px per line",
  defaultSize: { width: 12, height: 24 },
  withHeight: true,
  properties: {
    tags: code('Tags (array or comma-separated)', ARRAY_OR_STRING, [], { placeholder: "['Design', 'Urgent']" }),
    tagColors: code('Colours by tag', OBJECT, {}, { placeholder: "{ Urgent: '#dc2626', Design: '#7c3aed' }" }),
    variant: choice('Variant', ['soft', 'outline', 'solid'], 'soft'),
    size: choice('Size', ['sm', 'default', 'lg'], 'default'),
    overflow: choice('Overflow', ['wrap', 'single'], 'wrap', { wrap: 'Wrap', single: 'One line, +N' }),
    pill: toggle('Pill shape', false),
  },
  defaults: {
    tags: { value: "{{['Design', 'Frontend', 'Urgent']}}" },
    tagColors: { value: "{{{ Urgent: '#dc2626' }}}" },
    variant: { value: 'soft' },
    size: { value: 'default' },
    overflow: { value: 'wrap' },
    pill: { value: '{{false}}' },
  },
  styles: {
    backgroundColor: colorStyle('Tag background (unmapped tags)'),
    textColor: colorStyle('Tag text color (unmapped tags)'),
    borderColor: colorStyle('Tag border color'),
    borderRadius: sizeStyle('Tag radius'),
  },
  events: { onTagClick: { displayName: 'On tag click' } },
  exposedVariables: { lastClickedTag: '', tags: [] },
});

// ---- Circular progress -----------------------------------------------------------------------------------------------

export const shadCircularProgressConfig = shadConfig({
  name: 'ShadCircularProgress',
  displayName: 'Circular progress',
  description:
    "shadcn/ui circular progress ring: value 0 to 100 (clamped), size and thickness (px), lineCap ('round', 'flat'), centerText ('value' shows 63%, 'custom' shows text, 'none') with an optional label under it; barColor (default: the primary), trackColor, textColor, labelColor styles. Height: the size (96px by default)",
  defaultSize: { width: 5, height: 104 },
  withHeight: true,
  properties: {
    value: code('Value (0 to 100)', NUMBER, 63),
    size: code('Size (px)', NUMBER, 96),
    thickness: code('Thickness (px)', NUMBER, 8),
    lineCap: choice('Ends', ['round', 'flat'], 'round'),
    centerText: choice('Centre text', ['value', 'custom', 'none'], 'value'),
    text: code('Custom centre text', STRING, ''),
    label: code('Sub-label', STRING, ''),
  },
  defaults: {
    value: { value: '{{63}}' },
    size: { value: '{{96}}' },
    thickness: { value: '{{8}}' },
    lineCap: { value: 'round' },
    centerText: { value: 'value' },
    text: { value: '' },
    label: { value: 'Complete' },
  },
  styles: {
    barColor: colorStyle('Bar color'),
    trackColor: colorStyle('Track color'),
    textColor: colorStyle('Centre text color'),
    labelColor: colorStyle('Sub-label color'),
    alignment: alignment('Alignment'),
  },
  styleDefaults: { alignment: { value: 'center' } },
});

// ---- Spinner ---------------------------------------------------------------------------------------------------------

export const shadSpinnerConfig = shadConfig({
  name: 'ShadSpinner',
  displayName: 'Spinner',
  description:
    "shadcn/ui loading spinner: variant ('ring', 'dots'), size ('sm' 16px, 'default' 24px, 'lg' 32px, or px), optional label with labelPosition ('right' beside, 'bottom' below); spinnerColor style (default: the primary). Height: 24px with the label beside (32px for lg), 52px with it below",
  defaultSize: { width: 6, height: 32 },
  properties: {
    variant: choice('Variant', ['ring', 'dots'], 'ring'),
    size: code('Size (sm, default, lg or px)', NUMBER_OR_STRING, 'default'),
    label: code('Label', STRING, ''),
    labelPosition: choice('Label position', ['right', 'bottom'], 'right', { right: 'Beside', bottom: 'Below' }),
  },
  defaults: {
    variant: { value: 'ring' },
    size: { value: 'default' },
    label: { value: 'Loading…' },
    labelPosition: { value: 'right' },
  },
  styles: {
    spinnerColor: colorStyle('Spinner color'),
    trackColor: colorStyle('Ring track color'),
    labelColor: colorStyle('Label color'),
    alignment: alignment('Alignment'),
  },
  styleDefaults: { alignment: { value: 'left' } },
});

// ---- Key-value list --------------------------------------------------------------------------------------------------

export const shadKeyValueConfig = shadConfig({
  name: 'ShadKeyValue',
  displayName: 'Key-value list',
  description:
    "shadcn/ui description list for a record's details: data is an object ({ Status: 'Active', Owner: 'Ada' }) or an array of { label, value, type?, format? } with type text, number, currency, date, badge, link or boolean (format: a date format or { currency, decimalPlaces, prefix, suffix }); columns 1 to 4; layout 'inline' (label beside the value, labelWidth) or 'stacked'; dividers; emptyText for blanks; currency, dateFormat and badgeColors defaults; allowCopy. Height: about 41px per row inline, 69px stacked (per column when columns > 1)",
  defaultSize: { width: 14, height: 248 },
  withHeight: true,
  properties: {
    data: code(
      'Data (object or array)',
      ARRAY_OR_OBJECT,
      {},
      {
        placeholder: "{ Status: 'Active' } or [{ label: 'Amount', value: 1250, type: 'currency' }]",
      }
    ),
    columns: choice('Columns', ['1', '2', '3', '4'], '1'),
    layout: choice('Layout', ['stacked', 'inline'], 'inline', { stacked: 'Label above', inline: 'Side by side' }),
    labelWidth: code('Label width (side by side; px or %)', NUMBER_OR_STRING, '40%'),
    dividers: toggle('Dividers', true),
    emptyText: code('Empty value text', STRING, '—'),
    currency: code('Currency (currency rows)', STRING, 'USD'),
    locale: code('Number locale', STRING, 'en-US'),
    dateFormat: code('Date format (date rows)', STRING, 'DD MMM YYYY'),
    badgeColors: code('Badge colours by value', OBJECT, {}, { placeholder: "{ Active: '#16a34a' }" }),
    allowCopy: toggle('Copy button on hover', false),
  },
  defaults: {
    data: {
      value:
        "{{[{ label: 'Customer', value: 'Ada Lovelace' }, { label: 'Email', value: 'ada@example.com', type: 'link' }, { label: 'Status', value: 'Active', type: 'badge' }, { label: 'Plan', value: 'Pro' }, { label: 'Amount', value: 1250, type: 'currency' }, { label: 'Renews', value: '2026-11-14', type: 'date' }]}}",
    },
    columns: { value: '1' },
    layout: { value: 'inline' },
    labelWidth: { value: '40%' },
    dividers: { value: '{{true}}' },
    emptyText: { value: '—' },
    currency: { value: 'USD' },
    locale: { value: 'en-US' },
    dateFormat: { value: 'DD MMM YYYY' },
    badgeColors: { value: "{{{ Active: '#16a34a' }}}" },
    allowCopy: { value: '{{false}}' },
  },
  styles: {
    labelColor: colorStyle('Label color'),
    valueColor: colorStyle('Value color'),
    dividerColor: colorStyle('Divider color'),
    linkColor: colorStyle('Link color'),
  },
});

// ---- Timeline --------------------------------------------------------------------------------------------------------

export const shadTimelineConfig = shadConfig({
  name: 'ShadTimeline',
  displayName: 'Timeline',
  description:
    "shadcn/ui vertical timeline / activity feed: items [{ title, description, time, status or color, icon? }] (status words such as done, active, pending, failed take theme colours; statusColors maps your own); marker ('dot' or 'icon' with lucide names); density ('comfortable', 'compact'); newestFirst; timePosition ('right', 'top'); dateFormat for ISO times. Clicking an item sets lastClickedItem and fires onItemClick. Height: about 66px per item with a description (44px without), 50px compact",
  defaultSize: { width: 14, height: 224 },
  withHeight: true,
  properties: {
    items: code('Items', ARRAY, [], {
      placeholder: "[{ title: 'Order placed', description: 'By Ada', time: '09:12', status: 'done' }]",
    }),
    marker: choice('Marker', ['dot', 'icon'], 'dot'),
    density: choice('Density', ['comfortable', 'compact'], 'comfortable'),
    newestFirst: toggle('Newest first (reverse)', false),
    timePosition: choice('Time', ['right', 'top'], 'right', { right: 'Beside title', top: 'Above title' }),
    dateFormat: code('Date format for ISO times (empty: as given)', STRING, ''),
    statusColors: code('Colours by status', OBJECT, {}, { placeholder: "{ shipped: '#2563eb' }" }),
  },
  defaults: {
    items: {
      value:
        "{{[{ title: 'Order placed', description: 'Ada Lovelace placed order #1024', time: '09:12', status: 'done', icon: 'shopping-cart' }, { title: 'Payment confirmed', description: '$1,250.00 by card', time: '09:14', status: 'done', icon: 'credit-card' }, { title: 'Packed', description: 'Warehouse A, bay 4', time: '11:30', status: 'active', icon: 'package' }, { title: 'Out for delivery', time: 'Pending', status: 'pending', icon: 'truck' }]}}",
    },
    marker: { value: 'dot' },
    density: { value: 'comfortable' },
    newestFirst: { value: '{{false}}' },
    timePosition: { value: 'right' },
    dateFormat: { value: '' },
    statusColors: { value: '{{{}}}' },
  },
  styles: {
    markerColor: colorStyle('Marker color (items without status)'),
    lineColor: colorStyle('Connecting line color'),
    titleColor: colorStyle('Title color'),
    descriptionColor: colorStyle('Description color'),
    timeColor: colorStyle('Time color'),
  },
  events: { onItemClick: { displayName: 'On item click' } },
  exposedVariables: { lastClickedItem: {} },
});

// ---- Steps -----------------------------------------------------------------------------------------------------------

export const shadStepsConfig = shadConfig({
  name: 'ShadSteps',
  displayName: 'Steps',
  description:
    "shadcn/ui stepper (native Steps names): steps [{ id, name, description?, visible?, disabled?, tooltip? }]; currentStep is the current step's id; numbered circles (variant 'dots' for small dots), check marks on completed steps, connecting lines; orientation 'horizontal' or 'vertical'. stepsSelectable lets users click a step (onSelect; exposed currentStepId, currentStepIndex). Actions setStep(id), nextStep, previousStep, resetSteps, setStepVisible(id, visible), setStepDisable(id, disabled). Height: 60px horizontal (78px with descriptions); vertical about 66px per step",
  defaultSize: { width: 24, height: 80 },
  withHeight: true,
  properties: {
    steps: code('Steps', ARRAY, [], { placeholder: "[{ id: 1, name: 'Details' }, { id: 2, name: 'Review' }]" }),
    currentStep: code('Current step (id)', NUMBER_OR_STRING, 1),
    stepsSelectable: toggle('Steps selectable', true),
    orientation: choice('Orientation', ['horizontal', 'vertical'], 'horizontal'),
    variant: choice('Marker', ['numbers', 'dots'], 'numbers', { numbers: 'Numbers', dots: 'Dots' }),
  },
  defaults: {
    steps: {
      value:
        "{{[{ id: 1, name: 'Account', description: 'Your details' }, { id: 2, name: 'Company', description: 'Team and size' }, { id: 3, name: 'Billing', description: 'Plan and payment' }, { id: 4, name: 'Done', description: 'Review and finish' }]}}",
    },
    currentStep: { value: '{{2}}' },
    stepsSelectable: { value: '{{true}}' },
    orientation: { value: 'horizontal' },
    variant: { value: 'numbers' },
  },
  styles: {
    completedAccent: colorStyle('Completed and current accent'),
    incompletedAccent: colorStyle('Upcoming step accent (circle border, line)'),
    completedLabel: colorStyle('Completed step label'),
    currentStepLabel: colorStyle('Current step label'),
    incompletedLabel: colorStyle('Upcoming step label'),
    descriptionColor: colorStyle('Description color'),
  },
  events: { onSelect: { displayName: 'On select' } },
  exposedVariables: { currentStepId: 1, currentStepIndex: 0, steps: [] },
  actions: [
    { handle: 'setStep', displayName: 'Set step', params: [param('option', 'Step id', '{{1}}')] },
    { handle: 'nextStep', displayName: 'Next step', params: [] },
    { handle: 'previousStep', displayName: 'Previous step', params: [] },
    { handle: 'resetSteps', displayName: 'Reset steps', params: [] },
    {
      handle: 'setStepVisible',
      displayName: 'Set step visible',
      params: [param('id', 'Step id'), param('visibility', 'Visible', '{{false}}', { type: 'toggle' })],
    },
    {
      handle: 'setStepDisable',
      displayName: 'Set step disable',
      params: [param('id', 'Step id'), param('disabled', 'Disabled', '{{true}}', { type: 'toggle' })],
    },
  ],
});

// ---- Pagination ------------------------------------------------------------------------------------------------------

export const shadPaginationConfig = shadConfig({
  name: 'ShadPagination',
  displayName: 'Pagination',
  description:
    "shadcn/ui pagination (native Pagination names): numberOfPages, or totalRecords with pageSize; defaultPageIndex (1-based); Previous / page numbers with ellipsis / Next (showLabels), optional first and last buttons (showFirstLast), siblingCount, size 'sm' or 'default'. onPageChange; action setPage(page); exposed currentPageIndex (1-based) and totalPages. Bind a query offset to (currentPageIndex - 1) * pageSize. Height: 36px (32px small)",
  defaultSize: { width: 16, height: 36 },
  properties: {
    numberOfPages: code('Number of pages', NUMBER, 10),
    totalRecords: code('Total records (instead of pages)', NUMBER_OR_STRING, ''),
    pageSize: code('Page size (with total records)', NUMBER, 10),
    defaultPageIndex: code('Default page index', NUMBER, 1),
    siblingCount: code('Pages beside the current one', NUMBER, 1),
    showFirstLast: toggle('First and last buttons', false),
    showLabels: toggle('Previous / Next labels', true),
    size: choice('Size', ['sm', 'default'], 'default'),
  },
  defaults: {
    numberOfPages: { value: '{{10}}' },
    totalRecords: { value: '' },
    pageSize: { value: '{{10}}' },
    defaultPageIndex: { value: '{{1}}' },
    siblingCount: { value: '{{1}}' },
    showFirstLast: { value: '{{false}}' },
    showLabels: { value: '{{true}}' },
    size: { value: 'default' },
  },
  styles: {
    textColor: colorStyle('Page text color'),
    hoverBackgroundColor: colorStyle('Hover background'),
    activeBackgroundColor: colorStyle('Current page background'),
    activeTextColor: colorStyle('Current page text color'),
    activeBorderColor: colorStyle('Current page border color'),
    borderRadius: sizeStyle('Button radius'),
    alignment: alignment('Alignment'),
  },
  styleDefaults: { alignment: { value: 'left' } },
  events: { onPageChange: { displayName: 'On page change' } },
  exposedVariables: { totalPages: 10, currentPageIndex: 1 },
  actions: [{ handle: 'setPage', displayName: 'Set page', params: [param('page', 'Page', '{{1}}')] }],
});
