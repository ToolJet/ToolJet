export const passinputConfig = {
  name: 'PasswordInput',
  displayName: 'Password Input',
  description: 'Secure text input',
  component: 'PasswordInput',
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
        defaultValue: 'Password',
      },
    },
    value: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default value',
      },
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
    regex: {
      type: 'code',
      displayName: 'Regex',
      placeholder: '^(?=.*[a-z])(?=.*[A-Z])(?=.*d)[a-zA-Zd]{8,}$',
    },
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
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
    onEnterPressed: { displayName: 'On enter pressed' },
  },
  styles: {
    color: {
      type: 'color',
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
      type: 'color',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: '#fff' },
      accordian: 'field',
    },
    accentColor: {
      type: 'color',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: '#4368E3' },
      accordian: 'field',
    },
    borderColor: {
      type: 'color',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: '#CCD1D5' },
      accordian: 'field',
    },
    textColor: {
      type: 'color',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: '#1B1F24' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'color',
      displayName: 'Error text',
      validation: { schema: { type: 'string' }, defaultValue: '#D72D39' },
      accordian: 'field',
    },
    icon: {
      type: 'icon',
      displayName: 'Icon',
      validation: { schema: { type: 'string' }, defaultValue: 'IconLock' },
      accordian: 'field',
      visibility: false,
    },
    iconColor: {
      type: 'color',
      displayName: 'Icon color',
      validation: { schema: { type: 'string' }, defaultValue: '#CFD3D859' },
      accordian: 'field',
      visibility: false,
      showLabel: false,
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'field',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
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
      options: [
        { displayName: 'Default', value: 'default' },
        { displayName: 'None', value: 'none' },
      ],
      isFxNotRequired: true,
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
      handle: 'setText',
      displayName: 'Set text',
      params: [{ handle: 'text', displayName: 'text', defaultValue: 'New Text' }],
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
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      placeholder: { value: 'Password' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      tooltip: { value: '' },
      label: { value: 'Label' },
      value: { value: '' },
    },
    validation: {
      mandatory: { value: false },
      regex: { value: '' },
      minLength: { value: '' },
      maxLength: { value: '' },
      customRule: { value: '' },
    },
    events: [],
    styles: {
      borderRadius: { value: '{{6}}' },
      backgroundColor: { value: '#fff' },
      borderColor: { value: '#CCD1D5' },
      accentColor: { value: '#4368E3' },
      errTextColor: { value: '#D72D39' },
      textColor: { value: '#1B1F24' },
      iconColor: { value: '#CFD3D859' },
      direction: { value: 'left' },
      width: { value: '{{33}}' },
      alignment: { value: 'side' },
      color: { value: '#1B1F24' },
      auto: { value: '{{true}}' },
      padding: { value: 'default' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      icon: { value: 'IconLock' },
      iconVisibility: { value: true },
    },
  },
};
