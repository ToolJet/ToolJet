export const colorPickerConfig = {
  name: 'ColorPicker',
  displayName: 'Color Picker',
  description: 'Choose colors from a palette',
  component: 'ColorPicker',
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Label',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select a color',
      },
    },
    defaultColor: { 
      type: 'code', 
      displayName: 'Default value', 
      validation: {
        schema: { type: 'string' },
        defaultValue: '#4368E3',
      }, 
    },
    format: {
      type: 'select',
      displayName: 'Color format',
      options: [
        { name: 'HEX', value: 'hex' },
        { name: 'RGB', value: 'rgb' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'hex',
      },
    },
    showAlpha: {
      type: 'toggle',
      displayName: 'Show alpha',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    showClearBtn: {
      type: 'toggle',
      displayName: 'Show clear button',
      validation: { 
        schema: { type: 'boolean' }, 
        defaultValue: false 
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
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  defaultSize: {
    width: 9,
    height: 40,
  },
  actions: [
    {
      displayName: 'Set Color',
      handle: 'setColor',
      params: [{ handle: 'color', displayName: 'Color', defaultValue: '#ffffff', type: 'color' }],
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
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
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
  events: {
    onChange: { displayName: 'On change' },
    onFocus: { displayName: 'On focus' },
    onBlur: { displayName: 'On blur' },
  },
  styles: {
    color: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
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
    auto: {
      type: 'checkbox',
      displayName: 'Width',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    width: {
      type: 'slider',
      showLabel: false,
      accordian: 'label',
      conditionallyRender: [
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'auto',
          value: false,
        },
      ],
      isFxNotRequired: true,
    },
    widthType: {
      type: 'select',
      showLabel: false,
      options: [
        { name: 'Of the Component', value: 'ofComponent' },
        { name: 'Of the Field', value: 'ofField' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'ofComponent',
      },
      accordian: 'label',
      isFxNotRequired: true,
      conditionallyRender: [
        {
          key: 'alignment',
          value: 'side',
        },
        {
          key: 'auto',
          value: false,
        },
      ],
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
      accordian: 'field',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-default-border)' },
      accordian: 'field',
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-brand)' },
      accordian: 'field',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
      accordian: 'field',
    },
    errTextColor: {
      type: 'colorSwatches',
      displayName: 'Error text',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-error-systemStatus)' },
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
    selectedColorHex: '#000000',
    selectedColorRGB: 'rgb(0,0,0)',
    selectedColorRGBA: 'rgba(0, 0, 0, 1)',
    isVisible: true,
    isDisabled: false,
    isLoading: false,
    colorFormat: 'hex',
    allowOpacity: false,
    isValid: true,
  },
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
      placeholder: { value: 'Select a color' },
      defaultColor: { value: '#4368E3' },
      format: { value: 'hex' },
      showAlpha: { value: '{{false}}' },
      showClearBtn: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      color: { value: 'var(--cc-primary-text)' },
      alignment: { value: 'side' },
      direction: { value: 'left' },
      auto: { value: '{{true}}' },
      width: { value: '{{33}}' },
      widthType: { value: 'ofComponent' },
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-default-border)' },
      accentColor: { value: 'var(--cc-primary-brand)' },
      textColor: { value: 'var(--cc-primary-text)' },
      errTextColor: { value: 'var(--cc-error-systemStatus)' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
      padding: { value: 'default' },
    },
  },
};
