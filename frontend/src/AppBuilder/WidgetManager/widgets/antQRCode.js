// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antQRCodeConfig = {
  name: 'AntQRCode',
  displayName: 'QR code',
  description: 'Ant Design QR code',
  component: 'AntQRCode',
  defaultSize: {
    width: 6,
    height: 170,
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
    value: {
      type: 'code',
      displayName: 'Value',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'https://tooljet.com',
      },
    },
    bordered: {
      type: 'toggle',
      displayName: 'Bordered',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    errorLevel: {
      type: 'switch',
      displayName: 'Error correction',
      options: [
        {
          displayName: 'L',
          value: 'L',
        },
        {
          displayName: 'M',
          value: 'M',
        },
        {
          displayName: 'Q',
          value: 'Q',
        },
        {
          displayName: 'H',
          value: 'H',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'M',
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
      value: {
        value: 'https://tooljet.com',
      },
      bordered: {
        value: '{{true}}',
      },
      errorLevel: {
        value: 'M',
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
