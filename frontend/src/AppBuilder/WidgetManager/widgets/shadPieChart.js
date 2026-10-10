// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadPieChartConfig = {
  name: 'ShadPieChart',
  displayName: 'Pie chart',
  description: 'shadcn/ui pie or donut chart with an optional center figure',
  component: 'ShadPieChart',
  defaultSize: {
    width: 12,
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
    data: {
      type: 'code',
      displayName: 'Data',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ type: 'Charter', value: 62 }]",
    },
    categoryField: {
      type: 'code',
      displayName: 'Category field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'type',
      },
    },
    valueField: {
      type: 'code',
      displayName: 'Value field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'value',
      },
    },
    donut: {
      type: 'toggle',
      displayName: 'Donut',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    centerValue: {
      type: 'code',
      displayName: 'Center figure',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    centerLabel: {
      type: 'code',
      displayName: 'Center caption',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
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
        value: "{{[{ type: 'Charter', value: 62 }, { type: 'Day trip', value: 24 }, { type: 'Event', value: 14 }]}}",
      },
      categoryField: {
        value: 'type',
      },
      valueField: {
        value: 'value',
      },
      donut: {
        value: '{{true}}',
      },
      centerValue: {
        value: '',
      },
      centerLabel: {
        value: '',
      },
      showLegend: {
        value: '{{true}}',
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
