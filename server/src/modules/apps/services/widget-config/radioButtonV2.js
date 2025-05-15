export const radiobuttonV2Config = {
  name: 'RadioButton',
  displayName: 'Radio Button',
  description: 'Select one from multiple choices',
  component: 'RadioButtonV2',
  defaultSize: {
    width: 12,
    height: 43,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  validation: {
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: `{{components.text2.text=='yes'&&'valid'}}`,
    },
    mandatory: { type: 'toggle', displayName: 'Make this field mandatory' },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Select',
      },
      accordian: 'Data',
    },
    advanced: {
      type: 'toggle',
      displayName: 'Dynamic options',
      validation: {
        schema: { type: 'boolean' },
      },
      accordian: 'Options',
    },
    schema: {
      type: 'code',
      displayName: 'Schema',
      conditionallyRender: {
        key: 'advanced',
        value: true,
      },
      accordian: 'Options',
    },
    optionsLoadingState: {
      type: 'toggle',
      displayName: 'Options loading state',
      validation: {
        schema: { type: 'boolean' },
      },
      accordian: 'Options',
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
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
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Enter tooltip text',
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  events: {
    onSelectionChange: { displayName: 'On select' },
  },
  styles: {
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Color',
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
      displayName: 'Direction',
      validation: { schema: { type: 'string' }, defaultValue: 'left' },
      showLabel: false,
      isIcon: true,
      options: [
        { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
        { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
      ],
      accordian: 'label',
    },
    labelWidth: {
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
      validation: { schema: { type: 'boolean' } },
      accordian: 'label',
      conditionallyRender: {
        key: 'alignment',
        value: 'side',
      },
      isFxNotRequired: true,
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    switchOnBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Checked background',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
      tip: 'Checked background',
      tooltipStyle: {},
      tooltipPlacement: 'bottom',
    },
    switchOffBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Unchecked background',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
      tip: 'Unchecked background',
      tooltipStyle: {},
      tooltipPlacement: 'bottom',
    },
    handleColor: {
      type: 'colorSwatches',
      displayName: 'Handle color',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
    },
    optionsTextColor: {
      type: 'colorSwatches',
      displayName: 'Text',
      validation: {
        schema: { type: 'string' },
      },
      accordian: 'switch',
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
  actions: [
    {
      handle: 'selectOption',
      displayName: 'Select option',
      params: [{ handle: 'option', displayName: 'Option' }],
    },
    {
      handle: 'deselectOption',
      displayName: 'Deselect option',
      params: [{ handle: 'option', displayName: 'Option' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
  exposedVariables: {
    label: 'Select',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      mandatory: { value: '{{false}}' },
    },
    properties: {
      label: { value: 'Select' },
      value: { value: '{{"2"}}' },
      advanced: { value: `{{false}}` },
      options: {
        value: [
          {
            label: 'option1',
            value: '1',
            disable: { value: false },
            visible: { value: true },
            default: { value: false },
          },
          {
            label: 'option2',
            value: '2',
            disable: { value: false },
            visible: { value: true },
            default: { value: true },
          },
          {
            label: 'option3',
            value: '3',
            disable: { value: false },
            visible: { value: true },
            default: { value: false },
          },
        ],
      },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      loadingState: { value: '{{false}}' },
      optionsLoadingState: { value: '{{false}}' },
      optionVisibility: { value: '{{[true, true, true]}}' },
      optionDisable: { value: '{{[false, false, false]}}' },
      schema: {
        value:
          "{{[\t{label: 'option1',value: '1',disable: false,visible: true,default: true},{label: 'option2',value: '2',disable: false,visible: true},{label: 'option3',value: '3',disable: false,visible: true}\t]}}",
      },
    },
    events: [],
    styles: {
      labelColor: { value: '#11181C' },
      direction: { value: 'left' },
      alignment: { value: 'side' },
      auto: { value: '{{false}}' },
      labelWidth: { value: '20' },
      borderColor: { value: '#FFFFFF' },
      switchOffBackgroundColor: { value: '#FFFFFF' },
      switchOnBackgroundColor: { value: 'var(--primary-brand)' },
      handleColor: { value: '#FFFFFF' },
      optionsTextColor: { value: '#11181C' },
      padding: { value: 'default' },
    },
  },
};
