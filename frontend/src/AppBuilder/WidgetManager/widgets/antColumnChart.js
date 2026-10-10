// GENERATED from WidgetManager/antDesignSource.js by scripts-antd-literals.mjs. Do not edit by hand.
export const antColumnChartConfig = {
  name: 'AntColumnChart',
  displayName: 'Bar chart',
  description: 'Ant Design column or horizontal bar chart (compare categories)',
  component: 'AntColumnChart',
  defaultSize: {
    width: 20,
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
      placeholder: "[{ month: 'Jun', revenue: 182000, yacht: 'Seraphine' }]",
    },
    xField: {
      type: 'code',
      displayName: 'X field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'month',
      },
    },
    yField: {
      type: 'code',
      displayName: 'Y field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'revenue',
      },
    },
    seriesField: {
      type: 'code',
      displayName: 'Series field (optional, one line or bar per value)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    valuePrefix: {
      type: 'code',
      displayName: 'Value prefix',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    valueSuffix: {
      type: 'code',
      displayName: 'Value suffix',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    horizontal: {
      type: 'toggle',
      displayName: 'Horizontal bars',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    stack: {
      type: 'toggle',
      displayName: 'Stack series (otherwise grouped)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
          "{{[{ month: 'Jun', revenue: 182000 }, { month: 'Jul', revenue: 246000 }, { month: 'Aug', revenue: 268000 }, { month: 'Sep', revenue: 197000 }, { month: 'Oct', revenue: 121000 }]}}",
      },
      xField: {
        value: 'month',
      },
      yField: {
        value: 'revenue',
      },
      seriesField: {
        value: '',
      },
      valuePrefix: {
        value: '',
      },
      valueSuffix: {
        value: '',
      },
      horizontal: {
        value: '{{false}}',
      },
      stack: {
        value: '{{false}}',
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
