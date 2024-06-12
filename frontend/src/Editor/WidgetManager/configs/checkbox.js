export const checkboxConfig = {
  name: 'Checkbox',
  displayName: 'Checkbox',
  description: 'Single checkbox toggle',
  component: 'Checkbox',
  defaultSize: {
    width: 5,
    height: 30,
  },
  actions: [
    {
      handle: 'setChecked',
      displayName: 'Set checked',
      params: [{ handle: 'status', displayName: 'status' }],
    },
  ],
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
        defaultValue: 'Checkbox label',
      },
    },
    defaultValue: {
      type: 'toggle',
      displayName: 'Default status',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  events: {
    onCheck: { displayName: 'On check' },
    onUnCheck: { displayName: 'On uncheck' },
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
    checkboxColor: {
      type: 'color',
      displayName: 'Checkbox color',
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
      label: { value: 'Checkbox label' },
      defaultValue: { value: '{{false}}' },
    },
    events: [],
    styles: {
      textColor: { value: '' },
      checkboxColor: { value: '' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
