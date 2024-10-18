export const dividerConfig = {
  name: 'horizontalDivider',
  displayName: 'Horizontal Divider',
  description: 'Separator between components',
  component: 'Divider',
  defaultSize: {
    width: 10,
    height: 10,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {},
  events: {},
  styles: {
    dividerColor: {
      type: 'color',
      displayName: 'Divider color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
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
  },
  exposedVariables: {
    value: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {},
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      dividerColor: { value: '#3e525b' },
    },
  },
};
