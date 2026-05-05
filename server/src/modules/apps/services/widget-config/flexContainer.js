export const flexContainerConfig = {
  name: 'FlexContainer',
  displayName: 'Flex Container',
  description: 'Auto-layout flex container',
  defaultSize: {
    width: 15,
    height: 300,
  },
  component: 'FlexContainer',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    direction: {
      type: 'select',
      displayName: 'Direction',
      options: [
        { name: 'Column', value: 'column' },
        { name: 'Row', value: 'row' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'column',
      },
    },
    flexWrap: {
      type: 'toggle',
      displayName: 'Wrap',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    gap: {
      type: 'numberInput',
      displayName: 'Gap',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 8,
      },
    },
    padding: {
      type: 'numberInput',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 12,
      },
    },
    justify: {
      type: 'select',
      displayName: 'Justify content',
      options: [
        { name: 'flex-start', value: 'flex-start' },
        { name: 'center', value: 'center' },
        { name: 'flex-end', value: 'flex-end' },
        { name: 'space-between', value: 'space-between' },
        { name: 'space-around', value: 'space-around' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'flex-start',
      },
    },
    align: {
      type: 'select',
      displayName: 'Align items',
      options: [
        { name: 'flex-start', value: 'flex-start' },
        { name: 'center', value: 'center' },
        { name: 'flex-end', value: 'flex-end' },
        { name: 'stretch', value: 'stretch' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'stretch',
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      section: 'additionalActions',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {},
  styles: {
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-surface1-surface)',
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 6,
      },
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
    },
  },
  exposedVariables: {
    isVisible: true,
    isDisabled: false,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      direction: { value: 'column' },
      flexWrap: { value: '{{false}}' },
      gap: { value: '8' },
      padding: { value: '12' },
      justify: { value: 'flex-start' },
      align: { value: 'stretch' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderRadius: { value: '6' },
      borderColor: { value: 'var(--cc-weak-border)' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
