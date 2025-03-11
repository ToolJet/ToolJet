export const verticalDividerConfig = {
  name: 'VerticalDivider',
  displayName: 'Vertical Divider',
  description: 'Vertical line separator',
  component: 'VerticalDivider',
  defaultSize: {
    width: 2,
    height: 100,
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
      dividerColor: { value: '#000000' },
    },
  },
};
