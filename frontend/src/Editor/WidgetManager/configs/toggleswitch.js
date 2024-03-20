export const toggleswitchConfig = {
  name: 'ToggleSwitch',
  displayName: 'Toggle Switch',
  description: 'User-controlled on-off switch',
  component: 'ToggleSwitch',
  defaultSize: {
    width: 6,
    height: 30,
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
        defaultValue: 'Toggle label',
      },
    },
    defaultValue: {
      type: 'toggle',
      displayName: 'Default Status',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    textColor: {
      type: 'color',
      displayName: 'Text Color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#000000',
      },
    },
    toggleSwitchColor: {
      type: 'color',
      displayName: 'Toggle Switch Color',
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
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  exposedVariables: {
    value: false,
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Toggle label' },
      defaultValue: { value: '{{false}}' },
    },
    events: [],
    styles: {
      textColor: { value: '' },
      toggleSwitchColor: { value: '' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
