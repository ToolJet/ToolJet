export const verticalDividerConfig = {
  name: 'VerticalDivider',
  displayName: 'Vertical divider',
  description: 'Vertical line separator',
  component: 'VerticalDivider',
  defaultSize: {
    width: 1,
    height: 100,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {},
  styles: {
    dividerColor: {
      type: 'colorSwatches',
      displayName: 'Divider color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-default-border)',
      },
      accordian: 'Divider',
    },
    dividerStyle: {
      type: 'switch',
      displayName: 'Style',
      validation: {
        schema: { type: 'string' },
      },
      options: [
        { displayName: 'Solid', value: 'solid' },
        { displayName: 'Dashed', value: 'dashed' },
      ],
      accordian: 'Divider',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Divider',
    },
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {
    value: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      visibility: { value: '{{true}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      dividerColor: { value: 'var(--cc-default-border)' },
      dividerStyle: { value: 'solid' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
