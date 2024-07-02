export const toggleswitchConfig = {
  name: 'ToggleSwitchLegacy',
  displayName: 'Toggle Switch (Legacy)',
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
      },
    },
    defaultValue: {
      type: 'toggle',
      displayName: 'Default status',
      validation: {
        schema: { type: 'boolean' },
      },
    },
  },
  events: {
    onChange: { displayName: 'On change' },
  },
  styles: {
    textColor: {
      type: 'color',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
      },
    },
    toggleSwitchColor: {
      type: 'color',
      displayName: 'Toggle switch color',
      validation: {
        schema: { type: 'string' },
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
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
