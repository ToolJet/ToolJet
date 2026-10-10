// GENERATED from WidgetManager/shadcnSource.pickers.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadRatingConfig = {
  name: 'ShadRating',
  displayName: 'Rating',
  description:
    'shadcn/ui rating: a row of 1 to 10 icons (star, heart or circle) with optional half steps and read-only mode; keyboard accessible. Exposes value (number, 0 for none). Height: 24px for the default size (32px for lg), plus 22px with a label',
  component: 'ShadRating',
  defaultSize: {
    width: 6,
    height: 24,
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
        defaultValue: '',
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
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
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
        defaultValue: 4,
      },
    },
    max: {
      type: 'code',
      displayName: 'Number of icons (1 to 10)',
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
        defaultValue: 5,
      },
    },
    icon: {
      type: 'switch',
      displayName: 'Icon',
      options: [
        {
          displayName: 'Star',
          value: 'star',
        },
        {
          displayName: 'Heart',
          value: 'heart',
        },
        {
          displayName: 'Circle',
          value: 'circle',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'star',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Small',
          value: 'sm',
        },
        {
          displayName: 'Medium',
          value: 'default',
        },
        {
          displayName: 'Large',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    allowHalf: {
      type: 'toggle',
      displayName: 'Allow half values',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    allowClear: {
      type: 'toggle',
      displayName: 'Click the current value to clear',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    readOnly: {
      type: 'toggle',
      displayName: 'Read only',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showValue: {
      type: 'toggle',
      displayName: 'Show value text',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    valueLabels: {
      type: 'code',
      displayName: 'Value labels (one per icon)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "['Poor', 'Fair', 'Good', 'Great', 'Excellent']",
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
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
    filledColor: {
      type: 'colorSwatches',
      displayName: 'Filled icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    emptyColor: {
      type: 'colorSwatches',
      displayName: 'Empty icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    valueTextColor: {
      type: 'colorSwatches',
      displayName: 'Value text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
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
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Focus ring color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    errorColor: {
      type: 'colorSwatches',
      displayName: 'Error color',
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
    value: 0,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{3}}',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
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
        value: '',
      },
      description: {
        value: '',
      },
      defaultValue: {
        value: '{{4}}',
      },
      max: {
        value: '{{5}}',
      },
      icon: {
        value: 'star',
      },
      size: {
        value: 'default',
      },
      allowHalf: {
        value: '{{false}}',
      },
      allowClear: {
        value: '{{true}}',
      },
      readOnly: {
        value: '{{false}}',
      },
      showValue: {
        value: '{{false}}',
      },
      valueLabels: {
        value: '{{[]}}',
      },
      dynamicHeight: {
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
