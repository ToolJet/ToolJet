// GENERATED from WidgetManager/shadcnSource.charts.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadScatterChartConfig = {
  name: 'ShadScatterChart',
  displayName: 'Scatter chart',
  description:
    "shadcn/ui scatter or bubble chart relating two measures: data [{ account: 'Globex', spend: 30, revenue: 95, seats: 120, segment: 'Enterprise' }], xField 'spend', yField 'revenue', optional sizeField (bubbles), groupField (one colour and legend entry per value), nameField (tooltip title), xLabel/yLabel axis titles, referenceX/referenceY dashed quadrant lines, x and y formats. Height 260-360 px; clicking a point sets clickedDatum to its row and fires onClick.",
  component: 'ShadScatterChart',
  defaultSize: {
    width: 16,
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
      placeholder: "[{ account: 'Globex', spend: 30, revenue: 95 }]",
    },
    xField: {
      type: 'code',
      displayName: 'X field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'spend',
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
    sizeField: {
      type: 'code',
      displayName: 'Size field (bubbles)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: 'seats',
    },
    groupField: {
      type: 'code',
      displayName: 'Group field (one colour each)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: 'segment',
    },
    nameField: {
      type: 'code',
      displayName: 'Name field (tooltip title)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
      placeholder: 'account',
    },
    xLabel: {
      type: 'code',
      displayName: 'X axis title',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    yLabel: {
      type: 'code',
      displayName: 'Y axis title',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    xAxisFormat: {
      type: 'switch',
      displayName: 'X format',
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
    yAxisFormat: {
      type: 'switch',
      displayName: 'Y format',
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
    referenceX: {
      type: 'code',
      displayName: 'Vertical line at x',
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
      placeholder: '20',
    },
    referenceY: {
      type: 'code',
      displayName: 'Horizontal line at y',
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
      placeholder: '60',
    },
    pointSize: {
      type: 'code',
      displayName: 'Point size (px)',
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
        defaultValue: 6,
      },
    },
    fillOpacity: {
      type: 'code',
      displayName: 'Fill opacity (0 to 1)',
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
      placeholder: '0.7',
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
        defaultValue: true,
      },
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
      displayName: 'Reference line color',
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
          "{{[{ account: 'Northwind', spend: 12, revenue: 48, seats: 40, segment: 'Mid-market' }, { account: 'Globex', spend: 30, revenue: 95, seats: 120, segment: 'Enterprise' }, { account: 'Initech', spend: 8, revenue: 21, seats: 15, segment: 'SMB' }, { account: 'Umbrella', spend: 26, revenue: 61, seats: 90, segment: 'Enterprise' }, { account: 'Hooli', spend: 18, revenue: 70, seats: 55, segment: 'Mid-market' }, { account: 'Vandelay', spend: 5, revenue: 14, seats: 10, segment: 'SMB' }, { account: 'Stark', spend: 34, revenue: 128, seats: 150, segment: 'Enterprise' }, { account: 'Wonka', spend: 14, revenue: 33, seats: 30, segment: 'SMB' }]}}",
      },
      xField: {
        value: 'spend',
      },
      yField: {
        value: 'revenue',
      },
      sizeField: {
        value: 'seats',
      },
      groupField: {
        value: 'segment',
      },
      nameField: {
        value: 'account',
      },
      xLabel: {
        value: 'Marketing spend ($k)',
      },
      yLabel: {
        value: 'Revenue ($k)',
      },
      xAxisFormat: {
        value: 'number',
      },
      yAxisFormat: {
        value: 'number',
      },
      currency: {
        value: 'USD',
      },
      referenceX: {
        value: '',
      },
      referenceY: {
        value: '',
      },
      pointSize: {
        value: '{{6}}',
      },
      fillOpacity: {
        value: '',
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
      colors: {
        value: '{{[]}}',
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
