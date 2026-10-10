// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antBadgeConfig = {
  name: 'AntBadge',
  displayName: 'Badge',
  description: 'Ant Design status dot with text',
  component: 'AntBadge',
  defaultSize: {
    width: 6,
    height: 30,
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
    text: {
      type: 'code',
      displayName: 'Text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Active',
      },
    },
    status: {
      type: 'switch',
      displayName: 'Status',
      options: [
        {
          displayName: 'Success',
          value: 'success',
        },
        {
          displayName: 'Processing',
          value: 'processing',
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
          displayName: 'Default',
          value: 'default',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'success',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
      text: {
        value: 'Active',
      },
      status: {
        value: 'success',
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
