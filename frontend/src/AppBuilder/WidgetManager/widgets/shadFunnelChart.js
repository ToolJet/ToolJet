// GENERATED from WidgetManager/shadcnSource.charts.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadFunnelChartConfig = {
  name: 'ShadFunnelChart',
  displayName: 'Funnel chart',
  description:
    "shadcn/ui funnel of stages in order: data [{ stage: 'Visited', count: 12480 }, { stage: 'Paid', count: 412 }], stageField 'stage', valueField 'count'; one bar per stage sized to the widest, its value, and its conversion % from the stage before (conversionBase 'previous') or from the first ('first'); align center/left, colorByStage (palette per stage, else one colour fading down), yAxisFormat for values. About 44 px per stage; clicking a stage sets clickedDatum to its row and fires onClick.",
  component: 'ShadFunnelChart',
  defaultSize: {
    width: 16,
    height: 240,
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
      placeholder: "[{ stage: 'Visited', count: 12480 }]",
    },
    stageField: {
      type: 'code',
      displayName: 'Stage field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'stage',
      },
    },
    valueField: {
      type: 'code',
      displayName: 'Value field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'count',
      },
    },
    showConversion: {
      type: 'toggle',
      displayName: 'Conversion %',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    conversionBase: {
      type: 'switch',
      displayName: 'Conversion from',
      options: [
        {
          displayName: 'Previous',
          value: 'previous',
        },
        {
          displayName: 'First',
          value: 'first',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'previous',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    align: {
      type: 'switch',
      displayName: 'Bar alignment',
      options: [
        {
          displayName: 'Center',
          value: 'center',
        },
        {
          displayName: 'Left',
          value: 'left',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'center',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    colorByStage: {
      type: 'toggle',
      displayName: 'Colour per stage',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
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
    axisTextColor: {
      type: 'colorSwatches',
      displayName: 'Stage label color',
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
          "{{[{ stage: 'Visited', count: 12480 }, { stage: 'Signed up', count: 3920 }, { stage: 'Activated', count: 2210 }, { stage: 'Trial', count: 1180 }, { stage: 'Paid', count: 412 }]}}",
      },
      stageField: {
        value: 'stage',
      },
      valueField: {
        value: 'count',
      },
      showConversion: {
        value: '{{true}}',
      },
      conversionBase: {
        value: 'previous',
      },
      align: {
        value: 'center',
      },
      colorByStage: {
        value: '{{false}}',
      },
      yAxisFormat: {
        value: 'number',
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
