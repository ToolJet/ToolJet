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
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        { displayName: 'Plain text', value: 'plainText' },
        { displayName: 'Markdown', value: 'markdown' },
        { displayName: 'HTML', value: 'html' },
      ],
      isFxNotRequired: true,
      defaultValue: { value: 'plainText' },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' }, defaultValue: '' },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
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
      accordian: 'Calendar',
    },
    weekDateFormat: {
      type: 'code',
      displayName: 'Header date format on week view',
      accordian: 'Calendar',
    },
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Background',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
      accordian: 'container',
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border',
      validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-weak-border)' },
      accordian: 'container',
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Border radius',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
      accordian: 'container',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'container',
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
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltipFormat: { value: 'plainText' },
      tooltip: { value: '' },
    },
    events: [],
    styles: {
      cellSizeInViewsClassifiedByResource: { value: 'spacious' },
      weekDateFormat: { value: 'DD MMM' },
      backgroundColor: { value: 'var(--cc-surface1-surface)' },
      borderColor: { value: 'var(--cc-weak-border)' },
      borderRadius: { value: '{{6}}' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
