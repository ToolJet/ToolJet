export const checkboxConfig = {
  name: 'Checkbox',
  displayName: 'Checkbox',
  description: 'Single checkbox toggle',
  component: 'Checkbox',
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
  validation: {
    mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: `{{components.text2.text=='yes'&&'valid'}}`,
    },
  },
  events: {
    onChange: { displayName: 'On change' },
    onCheck: { displayName: 'On check (Deprecated)' },
    onUnCheck: { displayName: 'On uncheck (Deprecated)' },
  },
  styles: {
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'label',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    checkboxColor: {
      type: 'colorSwatches',
      displayName: 'Checked color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    uncheckedColor: {
      type: 'colorSwatches',
      displayName: 'Unchecked color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    handleColor: {
      type: 'colorSwatches',
      displayName: 'Handle color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
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
    padding: {
      type: 'switch',
      displayName: 'Padding',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
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
    {
      handle: 'setChecked',
      displayName: 'Set checked (Deprecated)',
      params: [{ handle: 'status', displayName: 'status' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
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
      disabledState: { value: '{{false}}' },
      textColor: { value: 'var(--cc-primary-text)' },
      checkboxColor: { value: 'var(--cc-primary-brand)' },
      uncheckedColor: { value: 'var(--cc-surface2-surface)' },
      borderColor: { value: 'var(--cc-default-border)' },
      handleColor: { value: 'var(--cc-surface1-surface)' },
      alignment: { value: 'right' },
      boxShadow: { value: '0px 0px 0px 0px #00000090' },
      padding: { value: 'default' },
    },
    validation: {
      mandatory: { value: '{{false}}' },
      customRule: { value: null },
    },
  },
};
