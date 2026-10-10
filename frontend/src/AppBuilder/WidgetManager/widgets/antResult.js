// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antResultConfig = {
  name: 'AntResult',
  displayName: 'Result',
  description: 'Ant Design result page (success, error, 404, no access)',
  component: 'AntResult',
  defaultSize: {
    width: 20,
    height: 280,
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
    status: {
      type: 'switch',
      displayName: 'Status',
      options: [
        {
          displayName: 'Success',
          value: 'success',
        },
        {
          displayName: 'Info',
          value: 'info',
        },
        {
          displayName: 'Warning',
          value: 'warning',
        },
        {
          displayName: 'Error',
          value: 'error',
        },
        {
          displayName: '403',
          value: '403',
        },
        {
          displayName: '404',
          value: '404',
        },
        {
          displayName: '500',
          value: '500',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'info',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    title: {
      type: 'code',
      displayName: 'Title',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Booking confirmed',
      },
    },
    subTitle: {
      type: 'code',
      displayName: 'Subtitle',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    buttonLabel: {
      type: 'code',
      displayName: 'Button label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
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
  },
  events: {
    onButtonClick: {
      displayName: 'On button click',
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
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
  },
  actions: [],
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
      status: {
        value: 'info',
      },
      title: {
        value: 'Booking confirmed',
      },
      subTitle: {
        value: '',
      },
      buttonLabel: {
        value: '',
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
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
    },
  },
};
