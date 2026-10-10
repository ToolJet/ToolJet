// GENERATED from WidgetManager/shadcnSource.charts.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadSparklineConfig = {
  name: 'ShadSparkline',
  displayName: 'Sparkline',
  description:
    "Tiny shadcn/ui line or area trend for KPI cards, no axes or grid: data [12, 18, 15, 22] or [{ x: 'Mon', y: 12 }]; type line/area, curve, end dot, colorByTrend (last vs first value, positiveColor/negativeColor styles; lowerIsBetter flips it), optional min/max band. Height 24-64 px (40 typical), placed under a Stat; exposes trend ('up' | 'down' | 'flat') and lastValue.",
  component: 'ShadSparkline',
  defaultSize: {
    width: 8,
    height: 40,
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
      placeholder: "[12, 18, 15, 22] or [{ x: 'Mon', y: 12 }]",
    },
    type: {
      type: 'switch',
      displayName: 'Type',
      options: [
        {
          displayName: 'Line',
          value: 'line',
        },
        {
          displayName: 'Area',
          value: 'area',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'area',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
    showEndDot: {
      type: 'toggle',
      displayName: 'End dot',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    colorByTrend: {
      type: 'toggle',
      displayName: 'Color by trend',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    lowerIsBetter: {
      type: 'toggle',
      displayName: 'Lower is better',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showBand: {
      type: 'toggle',
      displayName: 'Min/max band',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    bandMin: {
      type: 'code',
      displayName: 'Band from (blank = data min)',
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
    },
    bandMax: {
      type: 'code',
      displayName: 'Band to (blank = data max)',
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
    },
    showTooltip: {
      type: 'toggle',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'boolean',
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
      displayName: 'Line color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    positiveColor: {
      type: 'colorSwatches',
      displayName: 'Color when trend is up',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    negativeColor: {
      type: 'colorSwatches',
      displayName: 'Color when trend is down',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    bandColor: {
      type: 'colorSwatches',
      displayName: 'Band color',
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
    trend: 'flat',
    lastValue: null,
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
        value: '{{[12, 18, 15, 22, 19, 26, 24, 31]}}',
      },
      type: {
        value: 'area',
      },
      curve: {
        value: 'monotone',
      },
      strokeWidth: {
        value: '{{2}}',
      },
      showEndDot: {
        value: '{{true}}',
      },
      colorByTrend: {
        value: '{{false}}',
      },
      lowerIsBetter: {
        value: '{{false}}',
      },
      showBand: {
        value: '{{false}}',
      },
      bandMin: {
        value: '',
      },
      bandMax: {
        value: '',
      },
      showTooltip: {
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
