// GENERATED from WidgetManager/shadcnSource.charts.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadLineChartConfig = {
  name: 'ShadLineChart',
  displayName: 'Line chart',
  description:
    "shadcn/ui line chart for trends: data [{ month: 'Jan', revenue: 18600, expenses: 8000 }], xField 'month', yFields 'revenue,expenses' (one line each); curve monotone/linear/step, dots, strokeWidth, dashedFields, an optional target line (referenceValue, referenceLabel) and yAxisFormat number/currency/percent/compact. Height 200-320 px; clicking a point sets clickedDatum and fires onClick.",
  component: 'ShadLineChart',
  defaultSize: {
    width: 20,
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
      placeholder: "[{ month: 'Jan', revenue: 18600, expenses: 8000 }]",
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
    yFields: {
      type: 'code',
      displayName: 'Series fields (one or many)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'array',
            },
          ],
        },
        defaultValue: 'revenue',
      },
    },
    curve: {
      type: 'switch',
      displayName: 'Curve',
      options: [
        {
          displayName: 'Monotone',
          value: 'monotone',
        },
        {
          displayName: 'Linear',
          value: 'linear',
        },
        {
          displayName: 'Step',
          value: 'step',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'monotone',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showDots: {
      type: 'toggle',
      displayName: 'Dots',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    strokeWidth: {
      type: 'code',
      displayName: 'Line width (px)',
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
        defaultValue: 2,
      },
    },
    dashedFields: {
      type: 'code',
      displayName: 'Dashed series (fields)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'array',
            },
          ],
        },
        defaultValue: '',
      },
      placeholder: "'target' or ['forecast']",
    },
    referenceValue: {
      type: 'code',
      displayName: 'Target line value',
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
        defaultValue: '',
      },
      placeholder: '25000',
    },
    referenceLabel: {
      type: 'code',
      displayName: 'Target line label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    yAxisFormat: {
      type: 'switch',
      displayName: 'Value format',
      options: [
        {
          displayName: 'Number',
          value: 'number',
        },
        {
          displayName: 'Currency',
          value: 'currency',
        },
        {
          displayName: 'Percent',
          value: 'percent',
        },
        {
          displayName: 'Compact',
          value: 'compact',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'number',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    currency: {
      type: 'code',
      displayName: 'Currency code',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'USD',
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
    animate: {
      type: 'toggle',
      displayName: 'Animate',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showGrid: {
      type: 'toggle',
      displayName: 'Grid',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showLegend: {
      type: 'toggle',
      displayName: 'Legend',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    seriesLabels: {
      type: 'code',
      displayName: 'Series labels ({ field: label })',
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: {},
      },
      placeholder: "{ food_cost_pct: 'Food cost', target_pct: 'Target' }",
    },
    colors: {
      type: 'code',
      displayName: 'Series colors (in order)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "['#0f766e', '#f59e0b']",
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
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
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
    chartColor: {
      type: 'colorSwatches',
      displayName: 'Chart color (series palette from it)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    gridColor: {
      type: 'colorSwatches',
      displayName: 'Grid line color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    axisTextColor: {
      type: 'colorSwatches',
      displayName: 'Axis label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    legendTextColor: {
      type: 'colorSwatches',
      displayName: 'Legend text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    referenceLineColor: {
      type: 'colorSwatches',
      displayName: 'Target line color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    clickedDatum: {},
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
      data: {
        value:
          "{{[{ month: 'Jan', revenue: 18600, expenses: 8000 }, { month: 'Feb', revenue: 30500, expenses: 20000 }, { month: 'Mar', revenue: 23700, expenses: 12000 }, { month: 'Apr', revenue: 7300, expenses: 19000 }, { month: 'May', revenue: 20900, expenses: 13000 }, { month: 'Jun', revenue: 21400, expenses: 14000 }]}}",
      },
      xField: {
        value: 'month',
      },
      yFields: {
        value: "{{['revenue', 'expenses']}}",
      },
      curve: {
        value: 'monotone',
      },
      showDots: {
        value: '{{false}}',
      },
      strokeWidth: {
        value: '{{2}}',
      },
      dashedFields: {
        value: '',
      },
      referenceValue: {
        value: '',
      },
      referenceLabel: {
        value: '',
      },
      yAxisFormat: {
        value: 'currency',
      },
      currency: {
        value: 'USD',
      },
      valuePrefix: {
        value: '',
      },
      valueSuffix: {
        value: '',
      },
      emptyText: {
        value: 'No data',
      },
      animate: {
        value: '{{true}}',
      },
      showGrid: {
        value: '{{true}}',
      },
      showLegend: {
        value: '{{true}}',
      },
      seriesLabels: {
        value: '{{{} }}',
      },
      colors: {
        value: '{{[]}}',
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
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
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
