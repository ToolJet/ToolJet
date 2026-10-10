// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadStatConfig = {
  name: 'ShadStat',
  displayName: 'Stat',
  description: 'shadcn/ui dashboard figure: label, value, change badge and footnote',
  component: 'ShadStat',
  defaultSize: {
    width: 10,
    height: 120,
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
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Total revenue',
      },
    },
    value: {
      type: 'code',
      displayName: 'Value',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
        defaultValue: '$1,250.00',
      },
    },
    change: {
      type: 'code',
      displayName: 'Change (e.g. +12.5%)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    trend: {
      type: 'switch',
      displayName: 'Trend',
      options: [
        {
          displayName: 'Up',
          value: 'up',
        },
        {
          displayName: 'Down',
          value: 'down',
        },
        {
          displayName: 'Neutral',
          value: 'neutral',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'up',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    footnote: {
      type: 'code',
      displayName: 'Footnote',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    card: {
      type: 'toggle',
      displayName: 'Show as card',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
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
      label: {
        value: 'Total revenue',
      },
      value: {
        value: '$1,250.00',
      },
      change: {
        value: '',
      },
      trend: {
        value: 'up',
      },
      footnote: {
        value: '',
      },
      card: {
        value: '{{true}}',
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
