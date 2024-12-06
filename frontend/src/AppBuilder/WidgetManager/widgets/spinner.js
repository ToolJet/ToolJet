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
      type: 'color',
      displayName: 'Colour',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#0565ff',
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
      visibility: { value: '{{true}}' },
      size: { value: 'sm' },
      colour: { value: '#0565ff' },
    },
  },
};
