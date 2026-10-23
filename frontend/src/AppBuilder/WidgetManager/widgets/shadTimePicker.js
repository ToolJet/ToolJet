export const shadTimePickerConfig = {
  name: 'ShadTimePicker',
  displayName: 'Time picker',
  description:
    "Time picker: a field opening hour, minute and AM/PM columns, or (pickerStyle list) one list of times; both offer a time every minuteStep minutes from midnight (with 45: 09:00, 09:45, 10:30). Exposes value as 'HH:mm' in 24-hour time ('' when empty) and formattedValue as shown ('2:30 PM' or '14:30'); defaultValue, minTime and maxTime take '14:30' or '2:30 PM'. Height: 64px with a label (label above the control), 36px without; add 24px for help text or a validation message",
  component: 'ShadTimePicker',
  defaultSize: {
    width: 10,
    height: 70,
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
          optional: true,
        },
        defaultValue: 'Time',
      },
    },
    description: {
      type: 'code',
      displayName: 'Help text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
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
          optional: true,
        },
        defaultValue: 'Pick a time',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value (HH:mm)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    timeFormat: {
      type: 'switch',
      displayName: 'Time format',
      options: [
        {
          displayName: '12-hour',
          value: '12h',
        },
        {
          displayName: '24-hour',
          value: '24h',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '12h',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    pickerStyle: {
      type: 'switch',
      displayName: 'Picker',
      options: [
        {
          displayName: 'Columns',
          value: 'columns',
        },
        {
          displayName: 'List',
          value: 'list',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'columns',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    minuteStep: {
      minValue: 1,
      maxValue: 60,
      note: '1 to 60. A number outside is taken as the nearest.',
      type: 'code',
      displayName: 'Minute step',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 15,
      },
    },
    minTime: {
      type: 'code',
      displayName: 'Earliest time (HH:mm)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    maxTime: {
      type: 'code',
      displayName: 'Latest time (HH:mm)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    showClearBtn: {
      type: 'toggle',
      displayName: 'Show clear button',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
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
    onSelect: {
      displayName: 'On select',
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
          optional: true,
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
          optional: true,
        },
      },
    },
    helpTextColor: {
      type: 'colorSwatches',
      displayName: 'Help text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Field background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Field text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    placeholderColor: {
      type: 'colorSwatches',
      displayName: 'Placeholder color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Field border color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Accent (focus ring, selection)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    errorColor: {
      type: 'colorSwatches',
      displayName: 'Error color (message and border)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
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
          optional: true,
        },
      },
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Clock icon color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    popoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Popover background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    popoverTextColor: {
      type: 'colorSwatches',
      displayName: 'Popover text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    hoverColor: {
      type: 'colorSwatches',
      displayName: 'Popover item hover background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected item text color (on the accent)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
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
    value: '',
    formattedValue: '',
    label: 'Time',
    timeFormat: '12h',
    minTime: '00:00',
    maxTime: '23:59',
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Time',
          defaultValue: '',
        },
        {
          handle: 'format',
          displayName: 'Format',
          defaultValue: 'HH:mm',
        },
      ],
    },
    {
      handle: 'clearValue',
      displayName: 'Clear value',
    },
    {
      handle: 'setMinTime',
      displayName: 'Set min time',
      params: [
        {
          handle: 'value',
          displayName: 'Time (HH:mm)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setMaxTime',
      displayName: 'Set max time',
      params: [
        {
          handle: 'value',
          displayName: 'Time (HH:mm)',
          defaultValue: '',
        },
      ],
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
        value: 'Time',
      },
      description: {
        value: '',
      },
      placeholder: {
        value: 'Pick a time',
      },
      defaultValue: {
        value: '',
      },
      timeFormat: {
        value: '12h',
      },
      pickerStyle: {
        value: 'columns',
      },
      minuteStep: {
        value: '{{15}}',
      },
      minTime: {
        value: '',
      },
      maxTime: {
        value: '',
      },
      showClearBtn: {
        value: '{{false}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
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
