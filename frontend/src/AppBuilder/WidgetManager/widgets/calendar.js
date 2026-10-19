export const calendarConfig = {
  name: 'Calendar',
  displayName: 'Calendar',
  description: 'Display calendar events',
  component: 'Calendar',
  defaultSize: {
    width: 30,
    height: 600,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    dateFormat: { type: 'code', displayName: 'Date format' },
    defaultDate: { type: 'code', displayName: 'Default date' },
    events: { type: 'code', displayName: 'Events' },
    resources: { type: 'code', displayName: 'Resources' },
    defaultView: { type: 'code', displayName: 'Default view' },
    startTime: {
      type: 'code',
      displayName: 'Start time on week and day view',
    },
    endTime: { type: 'code', displayName: 'End time on week and day view' },
    displayToolbar: { type: 'toggle', displayName: 'Show toolbar' },
    displayViewSwitcher: {
      type: 'toggle',
      displayName: 'Show view switcher',
    },
    highlightToday: { type: 'toggle', displayName: 'Highlight today' },
    showPopOverOnEventClick: {
      type: 'toggle',
      displayName: 'Show popover when event is clicked',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
  },
  events: {
    onCalendarEventSelect: { displayName: 'On Event Select' },
    onCalendarSlotSelect: { displayName: 'On Slot Select' },
    onCalendarNavigate: { displayName: 'On Date Navigate' },
    onCalendarViewChange: { displayName: 'On View Change' },
  },
  styles: {
    cellSizeInViewsClassifiedByResource: {
      type: 'select',
      displayName: 'Cell size in views classified by resource',
      options: [
        { name: 'Compact', value: 'compact' },
        { name: 'Spacious', value: 'spacious' },
      ],
    },
    weekDateFormat: {
      type: 'code',
      displayName: 'Header date format on week view',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border color',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'var(--cc-weak-border)',
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 6,
      },
    },
  },
  exposedVariables: {
    selectedEvent: {},
    selectedSlots: {},
    currentView: 'month',
    currentDate: undefined,
    isVisible: true,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      dateFormat: {
        value: 'MM-DD-YYYY HH:mm:ss A Z',
      },
      defaultDate: {
        value: '{{moment().format("MM-DD-YYYY HH:mm:ss A Z")}}',
      },
      events: {
        value:
          "{{[\n\t\t{\n\t\t\t title: 'Sample event',\n\t\t\t start: `${moment().startOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,\n\t\t\t end: `${moment().endOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,\n\t\t\t allDay: false\n\t\t}\n]}}",
      },
      resources: {
        value: '{{[]}}',
      },
      defaultView: {
        value: "{{'month'}}",
      },
      startTime: {
        value: "{{moment().startOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}}",
      },
      endTime: {
        value: "{{moment().endOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}}",
      },
      displayToolbar: {
        value: true,
      },
      displayViewSwitcher: {
        value: true,
      },
      highlightToday: {
        value: true,
      },
      showPopOverOnEventClick: {
        value: false,
      },
      visibility: { value: '{{true}}' },
      collapseWhenHidden: { value: '{{false}}' },
    },
    events: [],
    styles: {
      cellSizeInViewsClassifiedByResource: { value: 'spacious' },
      weekDateFormat: { value: 'DD MMM' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: 6 },
    },
  },
};
