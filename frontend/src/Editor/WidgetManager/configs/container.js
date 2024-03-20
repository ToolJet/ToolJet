export const containerConfig = {
  name: 'Container',
  displayName: 'Container',
  description: 'Group components',
  defaultSize: {
    width: 5,
    height: 200,
  },
  component: 'Container',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {},
  styles: {
    backgroundColor: {
      type: 'color',
      displayName: 'Background color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
      },
    },
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'string' }, { type: 'number' }],
        },
        defaultValue: 4,
      },
    },
    borderColor: {
      type: 'color',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#fff',
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
      },
      defaultValue: false,
    },
  },
  exposedVariables: {},
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      visible: { value: '{{true}}' },
      loadingState: { value: `{{false}}` },
    },
    events: [],
    styles: {
      backgroundColor: { value: '#fff' },
      borderRadius: { value: '4' },
      borderColor: { value: '#fff' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
