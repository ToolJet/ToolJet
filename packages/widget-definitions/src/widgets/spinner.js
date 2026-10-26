export const spinnerConfig = {
  name: 'Spinner',
  displayName: 'Spinner',
  description: 'Indicate loading state',
  component: 'Spinner',
  defaultSize: {
    width: 4,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {},
  events: {},
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    colour: {
      type: 'colorSwatches',
      displayName: 'Colour',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-primary-brand)',
      },
    },
    size: {
      type: 'select',
      displayName: 'Size',
      options: [
        { name: 'small', value: 'sm' },
        { name: 'large', value: 'lg' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'sm',
      },
    },
    padding: {
      type: 'switch',
      displayName: 'Margin',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      accordian: 'container',
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {},
    events: [],
    styles: {
      padding: { value: 'default' },
      visibility: { value: '{{true}}' },
      size: { value: 'sm' },
      colour: { value: 'var(--cc-primary-brand)' },
    },
  },
};
