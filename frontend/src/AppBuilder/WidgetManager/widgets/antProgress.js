// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antProgressConfig = {
  name: 'AntProgress',
  displayName: 'Progress',
  description: 'Ant Design progress bar or circle',
  component: 'AntProgress',
  defaultSize: {
    width: 12,
    height: 40,
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
    percent: {
      type: 'code',
      displayName: 'Percent',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 60,
      },
    },
    type: {
      type: 'switch',
      displayName: 'Type',
      options: [
        {
          displayName: 'Line',
          value: 'line',
        },
        {
          displayName: 'Circle',
          value: 'circle',
        },
        {
          displayName: 'Dashboard',
          value: 'dashboard',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'line',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    status: {
      type: 'switch',
      displayName: 'Status',
      options: [
        {
          displayName: 'Normal',
          value: 'normal',
        },
        {
          displayName: 'Active',
          value: 'active',
        },
        {
          displayName: 'Success',
          value: 'success',
        },
        {
          displayName: 'Exception',
          value: 'exception',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'normal',
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
      percent: {
        value: '{{60}}',
      },
      type: {
        value: 'line',
      },
      status: {
        value: 'normal',
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
