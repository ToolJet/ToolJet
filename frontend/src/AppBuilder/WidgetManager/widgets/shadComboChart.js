export const shadComboChartConfig = {
  name: 'ShadComboChart',
  displayName: 'Combo chart',
  description:
    "Bar and line chart on one axis pair: data [{ month: 'Jan', revenue: 42000, margin: 31 }], xField 'month', barFields 'revenue' (bars), lineFields 'margin' (lines), rightAxisFields 'margin' (those series on a second, right axis with its own rightAxisFormat, e.g. percent); stackBars, curve, dots, yAxisFormat number/currency/percent/compact. Height 240-340 px; clicking sets clickedDataPoint and fires onClick.",
  component: 'ShadComboChart',
  defaultSize: {
    width: 20,
    height: 300,
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
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "[{ month: 'Jan', revenue: 42000, margin: 31 }]",
    },
    xField: {
      type: 'code',
      displayName: 'X field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'month',
      },
    },
    barFields: {
      type: 'code',
      displayName: 'Bar series (fields)',
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
          optional: true,
        },
        defaultValue: 'revenue',
      },
    },
    lineFields: {
      type: 'code',
      displayName: 'Line series (fields)',
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
          optional: true,
        },
        defaultValue: 'margin',
      },
    },
    rightAxisFields: {
      type: 'code',
      displayName: 'Right axis series (fields)',
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
          optional: true,
        },
        defaultValue: '',
      },
      placeholder: "'margin'",
    },
    stackBars: {
      type: 'toggle',
      displayName: 'Stack bars',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
    },
    curve: {
      type: 'switch',
      displayName: 'Line curve',
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
          optional: true,
        },
        defaultValue: 'monotone',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    showDots: {
      type: 'toggle',
      displayName: 'Line dots',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
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
          optional: true,
        },
        defaultValue: 2,
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
          optional: true,
        },
        defaultValue: 'number',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    rightAxisFormat: {
      type: 'switch',
      displayName: 'Right axis format',
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
          optional: true,
        },
        defaultValue: 'percent',
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
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
          optional: true,
        },
        defaultValue: true,
      },
    },
    seriesLabels: {
      type: 'code',
      displayName: 'Series labels ({ field: label })',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'object',
            },
            {
              type: 'array',
            },
          ],
          optional: true,
        },
        defaultValue: {},
      },
      placeholder: "{ revenue: 'Revenue', margin: 'Margin %' }",
    },
    colors: {
      type: 'code',
      displayName: 'Series colors (in order)',
      validation: {
        schema: {
          type: 'array',
          optional: true,
        },
        defaultValue: [],
      },
      placeholder: "['#0f766e', '#f59e0b']",
    },
    highlightClicked: {
      type: 'toggle',
      displayName: 'Highlight clicked point',
      note: 'Draws the clicked point or bar emphasised until the Clear clicked point action runs or another is clicked.',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    loadingIndicator: {
      type: 'switch',
      displayName: 'Loading look',
      options: [
        {
          displayName: 'Spinner',
          value: 'spinner',
        },
        {
          displayName: 'Skeleton',
          value: 'skeleton',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'spinner',
      },
      isFxNotRequired: true,
      fullWidth: true,
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
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
          optional: true,
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
    onDoubleClick: {
      displayName: 'On double click',
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
          optional: true,
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
          optional: true,
        },
      },
    },
    gridColor: {
      type: 'colorSwatches',
      displayName: 'Grid line color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    axisTextColor: {
      type: 'colorSwatches',
      displayName: 'Axis label color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
    legendTextColor: {
      type: 'colorSwatches',
      displayName: 'Legend text color',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    clickedDataPoint: {},
  },
  actions: [
    {
      handle: 'clearClickedPoint',
      displayName: 'Clear clicked point',
    },
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
          "{{[{ month: 'Jan', revenue: 42000, orders: 310, margin: 31 }, { month: 'Feb', revenue: 47500, orders: 342, margin: 33 }, { month: 'Mar', revenue: 45200, orders: 328, margin: 29 }, { month: 'Apr', revenue: 52800, orders: 371, margin: 34 }, { month: 'May', revenue: 58100, orders: 402, margin: 36 }, { month: 'Jun', revenue: 61400, orders: 425, margin: 35 }]}}",
      },
      xField: {
        value: 'month',
      },
      barFields: {
        value: "{{['revenue']}}",
      },
      lineFields: {
        value: "{{['margin']}}",
      },
      rightAxisFields: {
        value: "{{['margin']}}",
      },
      stackBars: {
        value: '{{false}}',
      },
      curve: {
        value: 'monotone',
      },
      showDots: {
        value: '{{true}}',
      },
      strokeWidth: {
        value: '{{2}}',
      },
      yAxisFormat: {
        value: 'number',
      },
      rightAxisFormat: {
        value: 'percent',
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
        value: "{{{ revenue: 'Revenue', margin: 'Margin' }}}",
      },
      colors: {
        value: '{{[]}}',
      },
      highlightClicked: {
        value: '{{false}}',
      },
      loadingState: {
        value: '{{false}}',
      },
      loadingIndicator: {
        value: 'spinner',
      },
      visibility: {
        value: '{{true}}',
      },
      collapseWhenHidden: {
        value: '{{false}}',
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
