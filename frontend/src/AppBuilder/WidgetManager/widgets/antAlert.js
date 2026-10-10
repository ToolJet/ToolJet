// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antAlertConfig = {
  name: 'AntAlert',
  displayName: 'Alert',
  description: 'Ant Design alert banner',
  component: 'AntAlert',
  defaultSize: {
    width: 20,
    height: 60,
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
    message: {
      type: 'code',
      displayName: 'Message',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Heads up',
      },
    },
    description: {
      type: 'code',
      displayName: 'Description',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    type: {
      type: 'switch',
      displayName: 'Type',
      options: [
        {
          displayName: 'Info',
          value: 'info',
        },
        {
          displayName: 'Success',
          value: 'success',
        },
        {
          displayName: 'Warning',
          value: 'warning',
        },
        {
          displayName: 'Error',
          value: 'error',
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
    showIcon: {
      type: 'toggle',
      displayName: 'Show icon',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
  },
  events: {},
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
      message: {
        value: 'Heads up',
      },
      description: {
        value: '',
      },
      type: {
        value: 'info',
      },
      showIcon: {
        value: '{{false}}',
      },
      dynamicHeight: {
        value: '{{false}}',
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
