// GENERATED from WidgetManager/shadcnSource.inputs.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadNumberInputConfig = {
  name: 'ShadNumberInput',
  displayName: 'Number input',
  description:
    "shadcn/ui number input: value is a number (null when empty), rounded to decimalPlaces; step buttons (stepper: split -/+ at both ends, stacked arrows at the right, or none) and ArrowUp/ArrowDown move by step and stop at the Min/Max value validation; optional prefix/suffix text inside the box (e.g. '$', 'kg') and thousands separators. Height: 64px with a label (label above the control), 36px without; add 24px for help text or a validation message",
  component: 'ShadNumberInput',
  defaultSize: {
    width: 10,
    height: 64,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Quantity',
      },
    },
    description: {
      type: 'code',
      displayName: 'Help text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '0',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
        defaultValue: 1,
      },
    },
    decimalPlaces: {
      type: 'code',
      displayName: 'Decimal places',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 2,
      },
    },
    step: {
      type: 'code',
      displayName: 'Step',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    stepper: {
      type: 'switch',
      displayName: 'Step buttons',
      options: [
        {
          displayName: 'Split -/+',
          value: 'split',
        },
        {
          displayName: 'Stacked',
          value: 'stacked',
        },
        {
          displayName: 'None',
          value: 'none',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'split',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    prefix: {
      type: 'code',
      displayName: 'Prefix (inside the box)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    suffix: {
      type: 'code',
      displayName: 'Suffix (inside the box)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    thousandSeparator: {
      type: 'toggle',
      displayName: 'Thousands separators',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  validation: {
    mandatory: {
      type: 'toggle',
      displayName: 'Make this field mandatory',
    },
    minValue: {
      type: 'code',
      displayName: 'Min value',
      placeholder: 'Enter min value',
    },
    maxValue: {
      type: 'code',
      displayName: 'Max value',
      placeholder: 'Enter max value',
    },
    customRule: {
      type: 'code',
      displayName: 'Custom validation',
      placeholder: "{{components.text1.text === 'yes' || 'Enter yes'}}",
    },
  },
  events: {
    onChange: {
      displayName: 'On change',
    },
    onEnterPressed: {
      displayName: 'On enter pressed',
    },
    onFocus: {
      displayName: 'On focus',
    },
    onBlur: {
      displayName: 'On blur',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    helpTextColor: {
      type: 'colorSwatches',
      displayName: 'Help text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Field background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Field text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    placeholderColor: {
      type: 'colorSwatches',
      displayName: 'Placeholder color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Field border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (focus ring, selection)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    errorColor: {
      type: 'colorSwatches',
      displayName: 'Error color (message and border)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Field radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
      },
    },
    stepperBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Step button background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    stepperIconColor: {
      type: 'colorSwatches',
      displayName: 'Step button icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    stepperHoverColor: {
      type: 'colorSwatches',
      displayName: 'Step button hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    affixColor: {
      type: 'colorSwatches',
      displayName: 'Prefix and suffix color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    isValid: true,
    isMandatory: false,
    value: 1,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '',
        },
      ],
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
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      label: {
        value: 'Quantity',
      },
      description: {
        value: '',
      },
      placeholder: {
        value: '0',
      },
      defaultValue: {
        value: '{{1}}',
      },
      decimalPlaces: {
        value: '{{2}}',
      },
      step: {
        value: '{{1}}',
      },
      stepper: {
        value: 'split',
      },
      prefix: {
        value: '',
      },
      suffix: {
        value: '',
      },
      thousandSeparator: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    validation: {
      mandatory: {
        value: '{{false}}',
      },
      minValue: {
        value: '',
      },
      maxValue: {
        value: '',
      },
      customRule: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
