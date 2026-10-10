// GENERATED from WidgetManager/shadcnSource.actions.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadCalendarConfig = {
  name: 'ShadCalendar',
  displayName: 'Calendar',
  description:
    "shadcn/ui inline month calendar. mode single, multiple or range; defaultValue 'YYYY-MM-DD' (a list for multiple, [start, end] for range); markers [{ date, label?, color? }] draw dots under days (label on hover); minDate, maxDate, disabledDates, disabledDays ([0, 6] = weekends). Exposed value, selectedDate, selectedDates, startDate, endDate, visibleMonth ('YYYY-MM'), visibleStart, visibleEnd; events onSelect, onMonthChange. One month is about 300px tall and 250px wide (fullWidth stretches the days)",
  component: 'ShadCalendar',
  defaultSize: {
    width: 10,
    height: 300,
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
    mode: {
      type: 'switch',
      displayName: 'Selection mode',
      options: [
        {
          displayName: 'Single',
          value: 'single',
        },
        {
          displayName: 'Multiple',
          value: 'multiple',
        },
        {
          displayName: 'Range',
          value: 'range',
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
      displayName: 'Default value (YYYY-MM-DD, a list, or [start, end])',
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
    defaultMonth: {
      type: 'code',
      displayName: 'Month to show (date; default: the selection or today)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    markers: {
      type: 'code',
      displayName: 'Markers',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ date: '2026-10-12', label: 'Launch', color: '#16a34a' }]",
    },
    minDate: {
      type: 'code',
      displayName: 'Min date',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    maxDate: {
      type: 'code',
      displayName: 'Max date',
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
      placeholder: "['2026-12-25']",
    },
    disabledDays: {
      type: 'code',
      displayName: 'Disabled weekdays (0 = Sunday)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: '[0, 6]',
    },
    weekStartsOn: {
      type: 'switch',
      displayName: 'Week starts on',
      options: [
        {
          displayName: 'Sunday',
          value: 'sunday',
        },
        {
          displayName: 'Monday',
          value: 'monday',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'sunday',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    numberOfMonths: {
      type: 'code',
      displayName: 'Number of months',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    showOutsideDays: {
      type: 'toggle',
      displayName: 'Show outside days',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    fixedWeeks: {
      type: 'toggle',
      displayName: 'Always six weeks',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
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
    showBorder: {
      type: 'toggle',
      displayName: 'Show border',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
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
  events: {
    onSelect: {
      displayName: 'On select',
    },
    onMonthChange: {
      displayName: 'On month change',
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
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Day text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    headerTextColor: {
      type: 'colorSwatches',
      displayName: 'Month title color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    mutedTextColor: {
      type: 'colorSwatches',
      displayName: 'Weekday and outside day color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Selected day background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    selectedTextColor: {
      type: 'colorSwatches',
      displayName: 'Selected day text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    rangeBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Range background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    todayBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Today background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Day hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    markerColor: {
      type: 'colorSwatches',
      displayName: 'Marker dot color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Calendar radius',
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
    cellSize: {
      type: 'numberInput',
      displayName: 'Day size (px)',
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
    selectedDate: '',
    selectedDates: [],
    startDate: '',
    endDate: '',
    visibleMonth: '',
    visibleStart: '',
    visibleEnd: '',
  },
  actions: [
    {
      handle: 'selectDate',
      displayName: 'Select date',
      params: [
        {
          handle: 'date',
          displayName: 'Date (YYYY-MM-DD)',
          defaultValue: '',
        },
        {
          handle: 'endDate',
          displayName: 'End date (range)',
          defaultValue: '',
        },
      ],
    },
    {
      handle: 'clear',
      displayName: 'Clear',
    },
    {
      handle: 'setMonth',
      displayName: 'Show month',
      params: [
        {
          handle: 'date',
          displayName: 'Date in the month',
          defaultValue: '',
        },
      ],
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
      mode: {
        value: 'single',
      },
      defaultValue: {
        value: '',
      },
      defaultMonth: {
        value: '',
      },
      markers: {
        value:
          "{{[{ date: moment().format('YYYY-MM-DD'), label: 'Stand-up' }, { date: moment().add(3, 'days').format('YYYY-MM-DD'), label: 'Release', color: '#16a34a' }, { date: moment().add(8, 'days').format('YYYY-MM-DD'), label: 'Review', color: '#f59e0b' }]}}",
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
      disabledDays: {
        value: '{{[]}}',
      },
      weekStartsOn: {
        value: 'sunday',
      },
      numberOfMonths: {
        value: '{{1}}',
      },
      showOutsideDays: {
        value: '{{true}}',
      },
      fixedWeeks: {
        value: '{{false}}',
      },
      fullWidth: {
        value: '{{false}}',
      },
      showBorder: {
        value: '{{true}}',
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
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
