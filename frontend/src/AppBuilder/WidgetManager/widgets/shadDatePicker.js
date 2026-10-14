// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadDatePickerConfig = {
  name: 'ShadDatePicker',
  displayName: 'Date picker',
  description:
    'Date picker (popover calendar), single date or range. Height: 64px with a label (label above the control), 36px without; add 24px for help text',
  component: 'ShadDatePicker',
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
          optional: true,
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
          optional: true,
        },
        defaultValue: '',
      },
    },
    mode: {
      type: 'switch',
      displayName: 'Mode',
      options: [
        {
          displayName: 'Single',
          value: 'single',
        },
        {
          displayName: 'Range',
          value: 'range',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'single',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    placeholder: {
      type: 'code',
      displayName: 'Placeholder',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'Pick a date',
      },
    },
    defaultValue: {
      type: 'code',
      displayName: 'Default (YYYY-MM-DD, or [start, end] for a range)',
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
          optional: true,
        },
        defaultValue: '',
      },
    },
    format: {
      type: 'code',
      displayName: 'Display format',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'DD MMM YYYY',
      },
    },
    minDate: {
      type: 'code',
      displayName: 'Earliest date (YYYY-MM-DD)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
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
          optional: true,
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
          optional: true,
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
    onChange: {
      displayName: 'On change',
    },
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    isValid: true,
    isMandatory: false,
    value: '',
    startDate: '',
    endDate: '',
    selectedDate: '',
    unixTimestamp: null,
    displayValue: '',
    startDateInUnix: null,
    endDateInUnix: null,
    selectedDateRange: '',
    dateFormat: 'DD MMM YYYY',
    minDate: '',
    maxDate: '',
    label: '',
  },
  actions: [
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Date',
          defaultValue: '',
        },
        {
          handle: 'format',
          displayName: 'Format',
          defaultValue: 'YYYY-MM-DD',
        },
      ],
    },
    {
      handle: 'setDate',
      displayName: 'Set date',
      params: [
        {
          handle: 'date',
          displayName: 'Date',
          defaultValue: '',
        },
        {
          handle: 'format',
          displayName: 'Format',
          defaultValue: 'YYYY-MM-DD',
        },
      ],
    },
    {
      handle: 'clearValue',
      displayName: 'Clear value',
    },
    {
      handle: 'setValueInTimestamp',
      displayName: 'Set value from timestamp',
      params: [
        {
          handle: 'value',
          displayName: 'Unix timestamp (ms)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setStartDate',
      displayName: 'Set start date',
      params: [
        {
          handle: 'value',
          displayName: 'Date',
          defaultValue: '',
        },
        {
          handle: 'format',
          displayName: 'Format',
          defaultValue: 'YYYY-MM-DD',
        },
      ],
    },
    {
      handle: 'setEndDate',
      displayName: 'Set end date',
      params: [
        {
          handle: 'value',
          displayName: 'Date',
          defaultValue: '',
        },
        {
          handle: 'format',
          displayName: 'Format',
          defaultValue: 'YYYY-MM-DD',
        },
      ],
    },
    {
      handle: 'setDateRange',
      displayName: 'Set date range',
      params: [
        {
          handle: 'startDate',
          displayName: 'Start date',
          defaultValue: '',
        },
        {
          handle: 'endDate',
          displayName: 'End date',
          defaultValue: '',
        },
        {
          handle: 'format',
          displayName: 'Format',
          defaultValue: 'YYYY-MM-DD',
        },
      ],
    },
    {
      handle: 'clearStartDate',
      displayName: 'Clear start date',
    },
    {
      handle: 'clearEndDate',
      displayName: 'Clear end date',
    },
    {
      handle: 'clearDateRange',
      displayName: 'Clear date range',
    },
    {
      handle: 'setMinDate',
      displayName: 'Set min date',
      params: [
        {
          handle: 'value',
          displayName: 'Date',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setMaxDate',
      displayName: 'Set max date',
      params: [
        {
          handle: 'value',
          displayName: 'Date',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'setDisabledDates',
      displayName: 'Set disabled dates',
      params: [
        {
          handle: 'value',
          displayName: 'Dates',
          defaultValue: '{{[]}}',
        },
      ],
    },
    {
      handle: 'clearDisabledDates',
      displayName: 'Clear disabled dates',
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
        value: '',
      },
      description: {
        value: '',
      },
      mode: {
        value: 'single',
      },
      placeholder: {
        value: 'Pick a date',
      },
      defaultValue: {
        value: '',
      },
      format: {
        value: 'DD MMM YYYY',
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
