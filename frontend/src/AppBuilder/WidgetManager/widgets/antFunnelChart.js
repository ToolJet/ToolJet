// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antFunnelChartConfig = {
  name: 'AntFunnelChart',
  displayName: 'Funnel chart',
  description: 'Ant Design funnel (conversion through stages)',
  component: 'AntFunnelChart',
  defaultSize: {
    width: 14,
    height: 320,
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
    data: {
      type: 'code',
      displayName: 'Data',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ stage: 'Enquiries', count: 120 }]",
    },
    xField: {
      type: 'code',
      displayName: 'Stage field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'stage',
      },
    },
    yField: {
      type: 'code',
      displayName: 'Value field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'count',
      },
    },
    showLegend: {
      type: 'toggle',
      displayName: 'Legend',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showLabels: {
      type: 'toggle',
      displayName: 'Value labels',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    emptyText: {
      type: 'code',
      displayName: 'Empty message',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'No data',
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
    onClick: {
      displayName: 'On click',
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
    clickedDatum: {},
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
      data: {
        value:
          "{{[{ stage: 'Enquiries', count: 120 }, { stage: 'Quoted', count: 74 }, { stage: 'Deposit paid', count: 41 }, { stage: 'Sailed', count: 33 }]}}",
      },
      xField: {
        value: 'stage',
      },
      yField: {
        value: 'count',
      },
      showLegend: {
        value: '{{true}}',
      },
      showLabels: {
        value: '{{false}}',
      },
      emptyText: {
        value: 'No data',
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
