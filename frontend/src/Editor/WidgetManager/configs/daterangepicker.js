export const daterangepickerConfig = {
  name: 'DateRangePicker',
  displayName: 'Range Picker',
  description: 'Choose date ranges',
  component: 'DaterangePicker',
  defaultSize: {
    width: 10,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    defaultStartDate: {
      type: 'code',
      displayName: 'Default start date',
      validation: {
        schema: {
          type: 'string',
        },
        defautlValue: '01/04/2022',
      },
    },
    defaultEndDate: {
      type: 'code',
      displayName: 'Default end date',
      validation: {
        schema: {
          type: 'string',
        },
        defautlValue: '10/04/2022',
      },
    },
    format: {
      type: 'code',
      displayName: 'Format',
      validation: {
        schema: {
          type: 'string',
        },
        defautlValue: 'DD/MM/YYYY',
      },
    },
  },
  events: {
    onSelect: { displayName: 'On select' },
  },
  styles: {
    borderRadius: {
      type: 'code',
      displayName: 'Border radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [{ type: 'number' }, { type: 'string' }],
        },
        defautlValue: 4,
      },
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defautlValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defautlValue: false,
      },
    },
  },
  exposedVariables: {
    endDate: {},
    startDate: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      defaultStartDate: { value: '01/04/2022' },
      defaultEndDate: { value: '10/04/2022' },

      format: { value: 'DD/MM/YYYY' },
    },
    events: [],
    styles: {
      borderRadius: { value: '4' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
