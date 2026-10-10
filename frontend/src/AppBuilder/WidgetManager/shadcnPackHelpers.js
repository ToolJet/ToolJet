// shadcn/ui pack (experiment): helpers shared by the pack's widget config sources (shadcnSource*.js). The generator
// (scripts-shadcn-literals.mjs) imports every source on its own, so this file and the sources stay plain ES modules
// with no other imports.

export const code = (displayName, schema, defaultValue, extra = {}) => ({
  type: 'code',
  displayName,
  validation: {
    schema,
    ...(defaultValue !== undefined ? { defaultValue } : {}),
  },
  ...extra,
});
export const toggle = (displayName, defaultValue = false, extra = {}) => ({
  type: 'toggle',
  displayName,
  validation: { schema: { type: 'boolean' }, defaultValue },
  ...extra,
});
/** A segmented switch; `labels` overrides the capitalised value as the option's label. */
export const choice = (displayName, values, defaultValue, labels = {}) => ({
  type: 'switch',
  displayName,
  options: values.map((v) => ({
    displayName: labels[v] ?? v.charAt(0).toUpperCase() + v.slice(1),
    value: v,
  })),
  validation: { schema: { type: 'string' }, defaultValue },
  isFxNotRequired: true,
  fullWidth: true,
});
export const select = (displayName, options, defaultValue) => ({
  type: 'select',
  displayName,
  options: options.map(([value, name]) => ({ name, value })),
  validation: { schema: { type: 'string' }, defaultValue },
});

export const STRING = { type: 'string' };
export const NUMBER = { type: 'number' };
export const BOOLEAN = { type: 'boolean' };
export const ARRAY = { type: 'array' };
export const OBJECT = { type: 'object' };
export const NUMBER_OR_STRING = { type: 'union', schemas: [STRING, NUMBER] };
export const ANY = {
  type: 'union',
  schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'array' }, { type: 'object' }],
};

// Styles fall back to the app theme when unset. Pack widgets are not "revamped" in the inspector, so styles list flat:
// names say which part they colour.
export const colorStyle = (displayName) => ({ type: 'colorSwatches', displayName, validation: { schema: STRING } });
export const sizeStyle = (displayName) => ({
  type: 'numberInput',
  displayName,
  validation: { schema: NUMBER_OR_STRING },
});

// Widgets whose loading look is a picture of their content: they let the author pick a spinner (the default, easy to
// get right) or a skeleton. Controls (inputs, pickers, buttons) always show a spinner in place. Shadcn/loadingLook.jsx
// reads the choice; __tests__/fuzz/loading.spec checks this list against what the widgets draw.
export const SKELETON_CAPABLE = new Set([
  'ShadAccordion',
  'ShadAlert',
  'ShadAreaChart',
  'ShadAvatar',
  'ShadBadge',
  'ShadBarChart',
  'ShadBreadcrumb',
  'ShadCalendar',
  'ShadCarousel',
  'ShadCircularProgress',
  'ShadEmpty',
  'ShadHeading',
  'ShadIcon',
  'ShadImage',
  'ShadKanban',
  'ShadKeyValue',
  'ShadLineChart',
  'ShadLink',
  'ShadListView',
  'ShadNavigation',
  'ShadPieChart',
  'ShadProgress',
  'ShadRadarChart',
  'ShadRadialChart',
  'ShadSparkline',
  'ShadStat',
  'ShadSteps',
  'ShadTable',
  'ShadTabs',
  'ShadTags',
  'ShadText',
  'ShadTimeline',
]);
const loadingIndicator = {
  type: 'switch',
  displayName: 'Loading look',
  options: [
    { displayName: 'Spinner', value: 'spinner' },
    { displayName: 'Skeleton', value: 'skeleton' },
  ],
  validation: { schema: STRING, defaultValue: 'spinner' },
  isFxNotRequired: true,
  fullWidth: true,
  section: 'additionalActions',
};

const commonProperties = (withHeight, name) => ({
  ...(withHeight ? { dynamicHeight: toggle('Dynamic height', true, { section: 'additionalActions' }) } : {}),
  loadingState: toggle('Loading state', false, { section: 'additionalActions' }),
  ...(SKELETON_CAPABLE.has(name) ? { loadingIndicator } : {}),
  visibility: toggle('Visibility', true, { section: 'additionalActions' }),
  disabledState: toggle('Disable', false, { section: 'additionalActions' }),
  // The native tooltip pair (RenderWidget shows it on hover for pack widgets).
  tooltipFormat: {
    type: 'switch',
    displayName: 'Tooltip',
    options: [
      { displayName: 'Plain text', value: 'plainText' },
      { displayName: 'Markdown', value: 'markdown' },
      { displayName: 'HTML', value: 'html' },
    ],
    isFxNotRequired: true,
    defaultValue: { value: 'plainText' },
    fullWidth: true,
    newLine: true,
    section: 'additionalActions',
  },
  tooltip: {
    type: 'code',
    displayName: 'Tooltip',
    validation: { schema: STRING },
    section: 'additionalActions',
    placeholder: 'Enter tooltip text',
    showLabel: false,
  },
});
const commonDefinition = (withHeight, name) => ({
  ...(withHeight ? { dynamicHeight: { value: '{{true}}' } } : {}),
  loadingState: { value: '{{false}}' },
  ...(SKELETON_CAPABLE.has(name) ? { loadingIndicator: { value: 'spinner' } } : {}),
  visibility: { value: '{{true}}' },
  disabledState: { value: '{{false}}' },
  tooltipFormat: { value: 'plainText' },
  tooltip: { value: '' },
});

// Validation sections, with the native widgets' keys: RenderWidget's validate(value) runs them (validateWidget), and
// the inspector shows them under Validation.
const MANDATORY = { type: 'toggle', displayName: 'Make this field mandatory' };
const CUSTOM_RULE = {
  type: 'code',
  displayName: 'Custom validation',
  placeholder: "{{components.text1.text === 'yes' || 'Enter yes'}}",
};
export const textValidation = {
  mandatory: MANDATORY,
  regex: { type: 'code', displayName: 'Regex', placeholder: '^[a-zA-Z0-9_ -]{3,16}$' },
  minLength: { type: 'code', displayName: 'Min length', placeholder: 'Enter min length' },
  maxLength: { type: 'code', displayName: 'Max length', placeholder: 'Enter max length' },
  customRule: CUSTOM_RULE,
};
export const numberValidation = {
  mandatory: MANDATORY,
  minValue: { type: 'code', displayName: 'Min value', placeholder: 'Enter min value' },
  maxValue: { type: 'code', displayName: 'Max value', placeholder: 'Enter max value' },
  customRule: CUSTOM_RULE,
};
export const choiceValidation = { mandatory: MANDATORY, customRule: CUSTOM_RULE };
/** The definition values for a validation section: mandatory off, every rule empty. */
export const validationDefaults = (section) =>
  Object.fromEntries(Object.keys(section).map((key) => [key, { value: key === 'mandatory' ? '{{false}}' : '' }]));

// The control actions every ToolJet widget has (Control component → Set visibility, Set disable, Set loading),
// added to each pack widget unless its own actions already define them.
const valueParam = { handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' };
const STANDARD_ACTIONS = [
  { handle: 'setVisibility', displayName: 'Set visibility', params: [valueParam] },
  { handle: 'setDisable', displayName: 'Set disable', params: [valueParam] },
  { handle: 'setLoading', displayName: 'Set loading', params: [valueParam] },
];
const withStandardActions = (actions) => [
  ...actions,
  ...STANDARD_ACTIONS.filter((standard) => !actions.some((action) => action.handle === standard.handle)),
];

export const shadConfig = ({
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
  styles = {},
  styleDefaults = {},
  validation,
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
  properties: { ...properties, ...commonProperties(withHeight, name) },
  ...(validation ? { validation } : {}),
  events,
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: NUMBER_OR_STRING, defaultValue: '0px 0px 0px 0px #00000040' },
      accordian: 'Container',
    },
    ...styles,
  },
  exposedVariables: { isVisible: true, isLoading: false, isDisabled: false, ...exposedVariables },
  actions: withStandardActions(actions),
  definition: {
    others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
    properties: { ...defaults, ...commonDefinition(withHeight, name) },
    ...(validation ? { validation: validationDefaults(validation) } : {}),
    events: [],
    styles: { boxShadow: { value: '0px 0px 0px 0px #00000040' }, ...styleDefaults },
  },
});
