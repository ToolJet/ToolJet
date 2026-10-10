// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antInputNumberConfig = {
  name: 'AntInputNumber',
  displayName: 'Number input',
  description: 'Ant Design number input',
  component: 'AntInputNumber',
  defaultSize: {
    width: 8,
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
    defaultValue: {
      type: 'code',
      displayName: 'Default value',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 0,
      },
    },
    min: {
      type: 'code',
      displayName: 'Minimum',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 0,
      },
    },
    max: {
      type: 'code',
      displayName: 'Maximum',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1000000,
      },
    },
    step: {
      type: 'code',
      displayName: 'Step',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    prefix: {
      type: 'code',
      displayName: 'Prefix',
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
    onChange: {
      displayName: 'On change',
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
    value: 0,
  },
  actions: [
    {
      handle: 'setValue',
      displayName: 'Set value',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{0}}',
        },
      ],
    },
  ],
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
      defaultValue: {
        value: '{{0}}',
      },
      min: {
        value: '{{0}}',
      },
      max: {
        value: '{{1000000}}',
      },
      step: {
        value: '{{1}}',
      },
      prefix: {
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
