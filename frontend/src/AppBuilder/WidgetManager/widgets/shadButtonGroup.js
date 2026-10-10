// GENERATED from WidgetManager/shadcnSource.actions.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadButtonGroupConfig = {
  name: 'ShadButtonGroup',
  displayName: 'Button group',
  description:
    "shadcn/ui button group (attached buttons) from buttons [{ label, value, icon?: 'IconBolt', disabled?, variant? }] (label '' with an icon = icon-only). mode: 'actions' (each click fires onClick, exposed lastClicked), 'single' or 'multiple' (a segmented selection: exposed value, values, selected; onChange). Height 36px (sm 32px, lg 40px); add 22px for a label",
  component: 'ShadButtonGroup',
  defaultSize: {
    width: 10,
    height: 36,
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
    buttons: {
      type: 'code',
      displayName: 'Buttons',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week', icon: 'IconCalendar' }]",
    },
    mode: {
      type: 'switch',
      displayName: 'Mode',
      options: [
        {
          displayName: 'Actions',
          value: 'actions',
        },
        {
          displayName: 'Single',
          value: 'single',
        },
        {
          displayName: 'Multiple',
          value: 'multiple',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'single',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default selected (value, or a list when multiple)',
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
            {
              type: 'boolean',
            },
            {
              type: 'array',
            },
            {
              type: 'object',
            },
          ],
        },
        defaultValue: '',
      },
    },
    allowDeselect: {
      type: 'toggle',
      displayName: 'Allow deselecting (single)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    variant: {
      type: 'switch',
      displayName: 'Variant',
      options: [
        {
          displayName: 'Outline',
          value: 'outline',
        },
        {
          displayName: 'Secondary',
          value: 'secondary',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Ghost',
          value: 'ghost',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'outline',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Sm',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Lg',
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
    orientation: {
      type: 'switch',
      displayName: 'Orientation',
      options: [
        {
          displayName: 'Horizontal',
          value: 'horizontal',
        },
        {
          displayName: 'Vertical',
          value: 'vertical',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'horizontal',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    fullWidth: {
      type: 'toggle',
      displayName: 'Full width',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
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
    onClick: {
      displayName: 'On click',
    },
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Button background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Button hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Button text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border and divider color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Selected background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Icon color',
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
    borderRadius: {
      type: 'numberInput',
      displayName: 'Group radius',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    value: '',
    values: [],
    selected: [],
    lastClicked: null,
    isValid: true,
    isMandatory: false,
  },
  actions: [
    {
      handle: 'setSelected',
      displayName: 'Set selected',
      params: [
        {
          handle: 'selected',
          displayName: 'Value (or list)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear selected',
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
      buttons: {
        value:
          "{{[{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week' }, { label: 'Month', value: 'month' }]}}",
      },
      mode: {
        value: 'single',
      },
      defaultValue: {
        value: 'week',
      },
      allowDeselect: {
        value: '{{false}}',
      },
      variant: {
        value: 'outline',
      },
      size: {
        value: 'default',
      },
      orientation: {
        value: 'horizontal',
      },
      fullWidth: {
        value: '{{false}}',
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
