export const phoneinputConfig = {
  name: 'PhoneInput',
  displayName: 'Phone Input',
  description: 'Phone input field',
  component: 'PhoneInput',
  defaultSize: {
    width: 10,
    height: 40,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: { schema: { type: 'string' }, defaultValue: 'Label' },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Enter your input',
      },
    },
    value: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Default value',
      },
    },
    isCountryChangeEnabled: {
      type: 'toggle',
      displayName: 'Enable country change',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  validation: {
    mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
    regex: { type: 'code', displayName: 'Regex', placeholder: '^[a-zA-Z0-9_ -]{3,16}$' },
    minLength: { type: 'code', displayName: 'Min length', placeholder: 'Enter min length' },
    maxLength: { type: 'code', displayName: 'Max length', placeholder: 'Enter max length' },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: `{{components.text2.text=='yes'&&'valid'}}`,
    },
  },
  events: {
    onChange: { displayName: 'On change' },
    onEnterPressed: { displayName: 'On enter pressed' },
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
  },
  styles: {
    color: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'label',
    },
    alignment: {
      type: 'switch',
      displayName: 'Alignment',
      validation: { schema: { type: 'string' }, defaultValue: 'side' },
      options: [
        { displayName: 'Side', value: 'side' },
        { displayName: 'Top', value: 'top' },
      ],
      accordian: 'label',
    },
    direction: {
      type: 'switch',
      displayName: '',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'label',
      isFxNotRequired: true,
    },
    width: {
      type: 'slider',
      displayName: 'Width',
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    auto: {
      type: 'checkbox',
      displayName: 'auto',
      showLabel: false,
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },

    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: '#fff' },
      accordian: 'field',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: '#CCD1D5' },
      accordian: 'field',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-brand)nd)nd)nd)' },
      accordian: 'field',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error text',
      validation: { schema: { type: 'string' }, defaultValue: '#D72D39' },
      accordian: 'field',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box Shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'field',
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
      accordian: 'container',
    },
  },
  exposedVariables: {
    value: '',
    isMandatory: false,
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set Value',
      params: [
        { handle: 'value', displayName: 'value', defaultValue: '' },
        { handle: 'country', displayName: 'country', defaultValue: '' },
      ],
    },
    {
      handle: 'setCountryCode',
      displayName: 'Set country code',
      params: [{ handle: 'countryCode', displayName: 'Country code', defaultValue: '' }],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setFocus',
      displayName: 'Set focus',
    },
    {
      handle: 'setBlur',
      displayName: 'Set blur',
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
    validation: {
      mandatory: { value: '{{false}}' },
      regex: { value: '' },
      minLength: { value: '' },
      maxLength: { value: '' },
      customRule: { value: '' },
    },

    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      value: { value: '' },
      label: { value: 'Label' },
      placeholder: { value: 'Enter your phone' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
      isCountryChangeEnabled: { value: '{{true}}' },
    },
    events: [],
    styles: {
      textColor: { value: '#1B1F24' },
      borderColor: { value: '#CCD1D5' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      errTextColor: { value: '#D72D39' },
      borderRadius: { value: '{{6}}' },
      backgroundColor: { value: '#fff' },
      direction: { value: 'left' },
      width: { value: '{{33}}' },
      alignment: { value: 'side' },
      color: { value: '#1B1F24' },
      auto: { value: '{{true}}' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
