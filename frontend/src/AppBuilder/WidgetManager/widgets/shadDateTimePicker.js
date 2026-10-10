// GENERATED from WidgetManager/shadcnSource.inputs.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadDateTimePickerConfig = {
  name: 'ShadDateTimePicker',
  displayName: 'Date and time picker',
  description:
    "shadcn/ui date and time picker: a field opening a calendar with a time row (hour, minute every minuteStep, AM/PM). Exposes value as 'YYYY-MM-DDTHH:mm' (local time, '' when empty), selectedDate 'YYYY-MM-DD', selectedTime 'HH:mm', unixTimestamp (ms) and displayValue (dateFormat plus the time). defaultValue takes ISO text, 'YYYY-MM-DD HH:mm' or a unix timestamp; minDate/maxDate ('YYYY-MM-DD') and disabledDates (array) block days. Height: 64px with a label (label above the control), 36px without; add 24px for help text or a validation message",
  component: 'ShadDateTimePicker',
  defaultSize: {
    width: 12,
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
        defaultValue: 'Date and time',
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
        defaultValue: 'Pick a date and time',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default value (YYYY-MM-DD HH:mm)',
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
        defaultValue: '',
      },
    },
    dateFormat: {
      type: 'code',
      displayName: 'Date display format',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'DD MMM YYYY',
      },
      placeholder: 'DD MMM YYYY, MM/DD/YYYY',
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
        },
        defaultValue: '12h',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    minuteStep: {
      type: 'code',
      displayName: 'Minute step',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 5,
      },
    },
    minDate: {
      type: 'code',
      displayName: 'Earliest date (YYYY-MM-DD)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    maxDate: {
      type: 'code',
      displayName: 'Latest date (YYYY-MM-DD)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    disabledDates: {
      type: 'code',
      displayName: 'Disabled dates',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "['2026-12-25', '2027-01-01']",
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
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Calendar icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    popoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Popover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    popoverTextColor: {
      type: 'colorSwatches',
      displayName: 'Popover text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverColor: {
      type: 'colorSwatches',
      displayName: 'Popover item hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected item text color (on the accent)',
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
    value: '',
    selectedDate: '',
    selectedTime: '',
    unixTimestamp: null,
    displayValue: '',
  },
  actions: [
    {
      handle: 'setDate',
      displayName: 'Set date and time',
      params: [
        {
          handle: 'value',
          displayName: 'Date and time (YYYY-MM-DD HH:mm)',
          defaultValue: '',
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
        value: 'Date and time',
      },
      description: {
        value: '',
      },
      placeholder: {
        value: 'Pick a date and time',
      },
      defaultValue: {
        value: '',
      },
      dateFormat: {
        value: 'DD MMM YYYY',
      },
      timeFormat: {
        value: '12h',
      },
      minuteStep: {
        value: '{{5}}',
      },
      minDate: {
        value: '',
      },
      maxDate: {
        value: '',
      },
      disabledDates: {
        value: '{{[]}}',
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
