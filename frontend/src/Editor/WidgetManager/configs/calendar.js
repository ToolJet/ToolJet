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
  },
  events: {
    onCalendarEventSelect: { displayName: 'On Event Select' },
    onCalendarSlotSelect: { displayName: 'On Slot Select' },
    onCalendarNavigate: { displayName: 'On Date Navigate' },
    onCalendarViewChange: { displayName: 'On View Change' },
  },
  styles: {
    visibility: { type: 'toggle', displayName: 'Visibility' },
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
  },
  exposedVariables: {
    selectedEvent: {},
    selectedSlots: {},
    currentView: 'month',
    currentDate: undefined,
  },
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
          "{{[\n\t\t{\n\t\t\t title: 'Sample event',\n\t\t\t start: `${moment().startOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,\n\t\t\t end: `${moment().endOf('day').format('MM-DD-YYYY HH:mm:ss A Z')}`,\n\t\t\t allDay: false,\n\t\t\t color: '#4D72DA'\n\t\t}\n]}}",
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
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      cellSizeInViewsClassifiedByResource: { value: 'spacious' },
      weekDateFormat: { value: 'DD MMM' },
    },
  },
};
