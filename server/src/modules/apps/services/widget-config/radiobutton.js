export const radiobuttonConfig = {
  name: 'RadioButtonLegacy',
  displayName: 'Radio Button (Legacy)',
  description: 'Select one from multiple choices',
  component: 'RadioButton',
  defaultSize: {
    width: 6,
    height: 60,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select',
      },
    },
    value: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
        defaultValue: true,
      },
    },
    values: {
      type: 'code',
      displayName: 'Option values',
      validation: {
        schema: {
          type: 'array',
          element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
        },
        defaultValue: [true, false],
      },
    },
    display_values: {
      type: 'code',
      displayName: 'Option labels',
      validation: {
        schema: { type: 'array', element: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
        defaultValue: ['yes', 'no'],
      },
    },
  },
  events: {
    onSelectionChange: { displayName: 'On select' },
  },
  styles: {
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-text)',
      },
    },
    activeColor: {
      type: 'colorSwatches',
      displayName: 'Active color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select Option',
      params: [
        {
          handle: 'option',
          displayName: 'Option',
        },
      ],
    },
  ],
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Select' },
      value: { value: '{{true}}' },
      values: { value: '{{[true,false]}}' },
      display_values: { value: '{{["yes", "no"]}}' },
      visible: { value: '{{true}}' },
    },
    events: [],
    styles: {
      textColor: { value: 'var(--cc-primary-text)' },
      activeColor: { value: 'var(--cc-primary-brand)' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
