export const shadRadarChartConfig = {
  name: 'ShadRadarChart',
  displayName: 'Radar chart',
  description:
    "Radar (spider) chart comparing scores across categories: data [{ skill: 'Speed', alex: 86, jordan: 65 }], categoryField 'skill' (one spoke per row), yFields 'alex,jordan' (one filled polygon each); fillOpacity, gridShape polygon/circle, dots, legend, maxValue (blank = auto). Best square, 240-320 px; clicking sets clickedDataPoint and fires onClick.",
  component: 'ShadRadarChart',
  defaultSize: {
    width: 12,
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
      placeholder: "[{ skill: 'Speed', alex: 86, jordan: 65 }]",
    },
    categoryField: {
      type: 'code',
      displayName: 'Category field',
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'skill',
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
          optional: true,
        },
        defaultValue: 'alex',
      },
    },
    maxValue: {
      type: 'code',
      displayName: 'Max value (blank = auto)',
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
        defaultValue: '',
      },
      placeholder: '100',
    },
    fillOpacity: {
      minValue: 0,
      maxValue: 1,
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
          optional: true,
        },
        defaultValue: 0.5,
      },
    },
    gridShape: {
      type: 'switch',
      displayName: 'Grid shape',
      options: [
        {
          displayName: 'Polygon',
          value: 'polygon',
        },
        {
          displayName: 'Circle',
          value: 'circle',
        },
      ],
      validation: {
        schema: {
          type: 'string',
          optional: true,
        },
        defaultValue: 'polygon',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
    showDots: {
      type: 'toggle',
      displayName: 'Dots',
      validation: {
        schema: {
          type: 'boolean',
          optional: true,
        },
        defaultValue: false,
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
      placeholder: "{ food_cost_pct: 'Food cost', target_pct: 'Target' }",
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
          "{{[{ skill: 'Speed', alex: 86, jordan: 65 }, { skill: 'Quality', alex: 72, jordan: 90 }, { skill: 'Support', alex: 64, jordan: 78 }, { skill: 'Pricing', alex: 90, jordan: 58 }, { skill: 'Reach', alex: 58, jordan: 84 }, { skill: 'Design', alex: 75, jordan: 70 }]}}",
      },
      categoryField: {
        value: 'skill',
      },
      yFields: {
        value: "{{['alex', 'jordan']}}",
      },
      maxValue: {
        value: '{{100}}',
      },
      fillOpacity: {
        value: '{{0.5}}',
      },
      gridShape: {
        value: 'polygon',
      },
      showGrid: {
        value: '{{true}}',
      },
      showDots: {
        value: '{{false}}',
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
      showLegend: {
        value: '{{true}}',
      },
      seriesLabels: {
        value: '{{{} }}',
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
