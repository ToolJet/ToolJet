// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadProgressConfig = {
  name: 'ShadProgress',
  displayName: 'Progress',
  description: 'shadcn/ui progress bar with optional label',
  component: 'ShadProgress',
  defaultSize: {
    width: 12,
    height: 36,
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
      displayName: 'Percent',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 60,
      },
    },
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    showValue: {
      type: 'toggle',
      displayName: 'Show percent',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
    barColor: {
      type: 'colorSwatches',
      displayName: 'Bar color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    trackColor: {
      type: 'colorSwatches',
      displayName: 'Track color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    valueColor: {
      type: 'colorSwatches',
      displayName: 'Percent text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    barHeight: {
      type: 'numberInput',
      displayName: 'Bar height',
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
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
  },
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
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
      value: {
        value: '{{60}}',
      },
      label: {
        value: '',
      },
      showValue: {
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
