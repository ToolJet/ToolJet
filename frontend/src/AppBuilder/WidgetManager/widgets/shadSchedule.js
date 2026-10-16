export const shadScheduleConfig = {
  name: 'ShadSchedule',
  displayName: 'Schedule',
  description:
    "Resource schedule: resources down the side (rooms, desks, people on shift or on call, vehicles, equipment) and time across, with bookings drawn as blocks. scale 'hours' shows one day (date, empty for today) from dayStart to dayEnd (hours, 0 to 24) with empty slots of slotMinutes; scale 'days' shows `days` days from date (a week of shifts, an on-call rota). resources: ['Atlas', 'Cove'] or [{ id, name, caption, avatar }] (empty: the distinct values of the bookings' resourceField). bookings: rows read through startField and endField (an ISO date-time, 'YYYY-MM-DD HH:mm', 'HH:mm' for a time on the shown day, or 'YYYY-MM-DD' for a whole day; no end lasts an hour), resourceField (a resource's id or name), titleField, subtitleField (a second line: the host, the person) and statusField (toned by its words: Confirmed green, Tentative or Pending amber, Cancelled red, Booked blue; or a tone name). Overlapping bookings of one resource stack in lanes. A now-line marks the current time on today (showNowLine). A click on a booking exposes selectedBooking (its row) and selectedBookingId and fires onBookingClicked; a click on an empty slot exposes selectedSlot { resourceId, resource, start, end (ISO), date, startTime, endTime, label } and fires onSlotClicked (open a booking form from it). hourFormat 12h or 24h; resourceTitle heads the resource column. Scrolls sideways when the hours do not fit. Height: grows with its rows (40px header plus rowHeight, default 56, per resource; more where bookings overlap)",
  component: 'ShadSchedule',
  defaultSize: {
    width: 43,
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
    resources: {
      type: 'code',
      displayName: 'Resources',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 'atlas', name: 'Atlas', caption: '8 seats' }]",
    },
    bookings: {
      type: 'code',
      displayName: 'Bookings',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ id: 1, room: 'atlas', title: 'Design review', start: '09:00', end: '10:30' }]",
    },
    resourceField: {
      type: 'code',
      displayName: "Resource field (a resource's id or name)",
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'resource',
      },
    },
    startField: {
      type: 'code',
      displayName: 'Start field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'start',
      },
    },
    endField: {
      type: 'code',
      displayName: 'End field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'end',
      },
    },
    titleField: {
      type: 'code',
      displayName: 'Title field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'title',
      },
    },
    subtitleField: {
      type: 'code',
      displayName: 'Second line field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    statusField: {
      type: 'code',
      displayName: 'Status field (toned by its words)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'status',
      },
    },
    idField: {
      type: 'code',
      displayName: 'Id field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'id',
      },
    },
    scale: {
      type: 'switch',
      displayName: 'Time across',
      options: [
        {
          displayName: 'Hours of a day',
          value: 'hours',
        },
        {
          displayName: 'Days',
          value: 'days',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'hours',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    date: {
      type: 'code',
      displayName: 'Date shown (empty for today)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    dayStart: {
      type: 'code',
      displayName: 'Day starts at (hour, or a time such as 09:00)',
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
          optional: true,
        },
        defaultValue: 8,
      },
    },
    dayEnd: {
      type: 'code',
      displayName: 'Day ends at (hour, or a time such as 18:00)',
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
          optional: true,
        },
        defaultValue: 18,
      },
    },
    slotMinutes: {
      type: 'code',
      displayName: 'Slot length (minutes)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 30,
      },
    },
    days: {
      type: 'code',
      displayName: 'Days shown',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 7,
      },
    },
    hourFormat: {
      type: 'switch',
      displayName: 'Hour format',
      options: [
        {
          displayName: '12 hour',
          value: '12h',
        },
        {
          displayName: '24 hour',
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
    resourceTitle: {
      type: 'code',
      displayName: 'Resource column title',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: '',
      },
    },
    resourceWidth: {
      type: 'code',
      displayName: 'Resource column width (px)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 168,
      },
    },
    rowHeight: {
      type: 'code',
      displayName: 'Row height (px)',
      validation: {
        schema: {
          type: 'number',
          optional: true,
        },
        defaultValue: 56,
      },
    },
    showNowLine: {
      type: 'toggle',
      displayName: 'Show the current time',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    highlightSelected: {
      type: 'toggle',
      displayName: 'Highlight the selected booking',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty text',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'No resources to schedule',
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
  events: {
    onBookingClicked: {
      displayName: 'On booking clicked',
    },
    onSlotClicked: {
      displayName: 'On slot clicked',
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Grid line color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    accentColor: {
      type: 'colorSwatches',
      displayName: 'Booking accent (bookings without a status, the selection)',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    nowColor: {
      type: 'colorSwatches',
      displayName: 'Current time line color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Radius',
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
    selectedBooking: {},
    selectedBookingId: null,
    selectedSlot: {},
  },
  actions: [
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
      resources: {
        value:
          "{{[{ id: 'atlas', name: 'Atlas', caption: '8 seats' }, { id: 'borealis', name: 'Borealis', caption: '4 seats' }, { id: 'cove', name: 'Cove', caption: '12 seats, screen' }, { id: 'dune', name: 'Dune', caption: '2 seats' }]}}",
      },
      bookings: {
        value:
          "{{[{ id: 1, room: 'atlas', title: 'Design review', start: '09:00', end: '10:30', status: 'Confirmed', host: 'Maya Chen' }, { id: 2, room: 'atlas', title: '1:1 with Owen', start: '11:00', end: '11:30', status: 'Tentative', host: 'Owen Hart' }, { id: 3, room: 'borealis', title: 'Sprint planning', start: '10:00', end: '12:00', status: 'Confirmed', host: 'Priya Nair' }, { id: 4, room: 'cove', title: 'All hands', start: '13:00', end: '14:00', status: 'Confirmed', host: 'Leo Martins' }, { id: 5, room: 'cove', title: 'Customer call', start: '15:30', end: '16:30', status: 'Pending', host: 'Maya Chen' }, { id: 6, room: 'dune', title: 'Interview', start: '14:00', end: '15:00', status: 'Cancelled', host: 'Grace Ho' }]}}",
      },
      resourceField: {
        value: 'room',
      },
      startField: {
        value: 'start',
      },
      endField: {
        value: 'end',
      },
      titleField: {
        value: 'title',
      },
      subtitleField: {
        value: '',
      },
      statusField: {
        value: 'status',
      },
      idField: {
        value: 'id',
      },
      scale: {
        value: 'hours',
      },
      date: {
        value: '',
      },
      dayStart: {
        value: '{{8}}',
      },
      dayEnd: {
        value: '{{18}}',
      },
      slotMinutes: {
        value: '{{30}}',
      },
      days: {
        value: '{{7}}',
      },
      hourFormat: {
        value: '12h',
      },
      resourceTitle: {
        value: 'Room',
      },
      resourceWidth: {
        value: '{{168}}',
      },
      rowHeight: {
        value: '{{56}}',
      },
      showNowLine: {
        value: '{{true}}',
      },
      highlightSelected: {
        value: '{{true}}',
      },
      emptyText: {
        value: 'No resources to schedule',
      },
      dynamicHeight: {
        value: '{{true}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
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
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
