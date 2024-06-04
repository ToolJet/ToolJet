export const toggleSwitchV2Config = {
  name: 'ToggleSwitch',
  displayName: 'Toggle Switch',
  description: 'User-controlled on-off switch',
  component: 'ToggleSwitchV2',
  defaultSize: {
    width: 6,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },

  validation: {
    mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: `{{components.text2.text=='yes'&&'valid'}}`,
    },
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
      type: 'switch',
      displayName: 'Default state',
      validation: { schema: { type: 'boolean' } },
      options: [
        { displayName: 'On', value: '{{true}}' },
        { displayName: 'Off', value: '{{false}}' },
      ],
      accordian: 'label',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
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
      },
      accordian: 'label',
    },
    borderColor: {
      type: 'color',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    toggleSwitchColor: {
      type: 'color',
      displayName: 'Checked color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    uncheckedColor: {
      type: 'color',
      displayName: 'Unchecked color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    handleColor: {
      type: 'color',
      displayName: 'Handle color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' } },
      options: [
        { displayName: 'Left', value: 'left' },
        { displayName: 'Right', value: 'right' },
      ],
      accordian: 'label',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'switch',
    },
  },
  exposedVariables: {
    value: false,
    label: 'Label',
    isMandatory: false,
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'toggle',
      displayName: 'toggle',
    },
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [{ handle: 'value', displayName: 'value' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      mandatory: { value: '{{false}}' },
      customRule: { value: null },
    },
    properties: {
      label: { value: 'Label' },
      defaultValue: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      textColor: { value: '#1B1F24' },
      toggleSwitchColor: { value: '#4368E3' }, //keeping same key for backward comopatibility
      uncheckedColor: { value: '#E4E7EB' },
      borderColor: { value: '#E4E7EB' },
      handleColor: { value: '#FFFFFF' },
      alignment: { value: 'right' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
    },
  },
};
