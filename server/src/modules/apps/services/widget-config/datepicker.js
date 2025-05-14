export const datepickerConfig = {
  name: 'DatetimePickerLegacy',
  displayName: 'Datetime Picker (Legacy)',
  description: 'Choose date and time',
  component: 'Datepicker',
  defaultSize: {
    width: 5,
    height: 30,
  },
  validation: {
    customRule: { type: 'code', displayName: 'Custom validation' },
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: { type: 'string' },
        defaultValue: '01/01/2022',
      },
    },
    format: {
      type: 'code',
      displayName: 'Format',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'DD/MM/YYYY',
      },
    },
    enableTime: {
      type: 'toggle',
      displayName: 'Enable time selection?',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    enableDate: {
      type: 'toggle',
      displayName: 'Enable date selection?',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledDates: {
      type: 'code',
      displayName: 'Disabled dates',
      validation: {
        schema: { type: 'array', element: { type: 'string' } },
        defaultValue: "['01/01/2022']",
      },
    },
  },
  events: {
    onSelect: { displayName: 'On select' },
  },
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: { type: 'number' },
        defaultValue: 4,
      },
    },
  },
  exposedVariables: {
    value: '',
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    validation: {
      customRule: { value: '' },
    },
    properties: {
      defaultValue: { value: '01/01/2022' },
      format: { value: 'DD/MM/YYYY' },
      enableTime: { value: '{{false}}' },
      enableDate: { value: '{{true}}' },
      disabledDates: { value: '{{[]}}' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      borderRadius: { value: '{{4}}' },
    },
  },
};
