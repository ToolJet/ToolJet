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

const commonProperties = (withHeight) => ({
  ...(withHeight ? { dynamicHeight: toggle('Dynamic height', true, { section: 'additionalActions' }) } : {}),
  loadingState: toggle('Loading state', false, { section: 'additionalActions' }),
  visibility: toggle('Visibility', true, { section: 'additionalActions' }),
  disabledState: toggle('Disable', false, { section: 'additionalActions' }),
});
const commonDefinition = (withHeight) => ({
  ...(withHeight ? { dynamicHeight: { value: '{{true}}' } } : {}),
  loadingState: { value: '{{false}}' },
  visibility: { value: '{{true}}' },
  disabledState: { value: '{{false}}' },
});

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
      validation: { schema: NUMBER_OR_STRING, defaultValue: '0px 0px 0px 0px #00000040' },
      accordian: 'Container',
    },
    ...styles,
  },
  exposedVariables: { isVisible: true, isLoading: false, isDisabled: false, ...exposedVariables },
  actions,
  definition: {
    others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
    properties: { ...defaults, ...commonDefinition(withHeight) },
    events: [],
    styles: { boxShadow: { value: '0px 0px 0px 0px #00000040' }, ...styleDefaults },
  },
});
