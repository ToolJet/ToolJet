export const iconConfig = {
  name: 'Icon',
  displayName: 'Icon',
  description: 'Icon',
  defaultSize: {
    width: 5,
    height: 48,
  },
  component: 'Icon',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    icon: {
      type: 'iconPicker',
      displayName: 'Icon',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'IconHome2',
      },
    },
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    iconColor: {
      type: 'color',
      displayName: 'Icon color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000',
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
  exposedVariables: {},
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
    {
      displayName: 'Set Visibility',
      handle: 'setVisibility',
      params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      icon: { value: 'IconHome2' },
    },
    events: [],
    styles: {
      iconColor: { value: '#000' },
      visibility: { value: '{{true}}' },
    },
  },
};
