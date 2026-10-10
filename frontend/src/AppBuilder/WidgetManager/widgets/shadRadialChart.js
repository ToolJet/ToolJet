// GENERATED from WidgetManager/shadcnSource.charts.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadRadialChartConfig = {
  name: 'ShadRadialChart',
  displayName: 'Radial chart',
  description:
    "shadcn/ui radial bar chart. Mode 'progress': one value against maxValue as a ring with a large centre figure (centerValue, blank = the value) and centerLabel. Mode 'categories': concentric bars from data [{ channel: 'Direct', visitors: 275 }] with categoryField and valueField, a row's fill or color wins. startAngle/endAngle in degrees (90/-270 full ring, 180/0 semicircle gauge); thickness in px. Ring 160-240 px square, gauge about twice as wide as tall.",
  component: 'ShadRadialChart',
  defaultSize: {
    width: 10,
    height: 220,
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
    mode: {
      type: 'switch',
      displayName: 'Mode',
      options: [
        {
          displayName: 'Single value',
          value: 'progress',
        },
        {
          displayName: 'Categories',
          value: 'categories',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'progress',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    value: {
      type: 'code',
      displayName: 'Value',
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
        defaultValue: 72,
      },
    },
    maxValue: {
      type: 'code',
      displayName: 'Max value',
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
        defaultValue: 100,
      },
    },
    data: {
      type: 'code',
      displayName: 'Data (categories mode)',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ channel: 'Direct', visitors: 275 }]",
    },
    categoryField: {
      type: 'code',
      displayName: 'Category field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'channel',
      },
    },
    valueField: {
      type: 'code',
      displayName: 'Value field',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'visitors',
      },
    },
    centerValue: {
      type: 'code',
      displayName: 'Center figure (blank = the value)',
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
    startAngle: {
      type: 'code',
      displayName: 'Start angle',
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
        defaultValue: 90,
      },
    },
    endAngle: {
      type: 'code',
      displayName: 'End angle',
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
        defaultValue: -270,
      },
    },
    thickness: {
      type: 'code',
      displayName: 'Ring thickness (px, blank = auto)',
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
    rounded: {
      type: 'toggle',
      displayName: 'Rounded ends',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    showTrack: {
      type: 'toggle',
      displayName: 'Track',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
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
    showLegend: {
      type: 'toggle',
      displayName: 'Legend (categories mode)',
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
    trackColor: {
      type: 'colorSwatches',
      displayName: 'Track color',
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
    centerValueColor: {
      type: 'colorSwatches',
      displayName: 'Center figure color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    centerLabelColor: {
      type: 'colorSwatches',
      displayName: 'Center caption color',
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
      mode: {
        value: 'progress',
      },
      value: {
        value: '{{72}}',
      },
      maxValue: {
        value: '{{100}}',
      },
      data: {
        value:
          "{{[{ channel: 'Direct', visitors: 275 }, { channel: 'Search', visitors: 200 }, { channel: 'Social', visitors: 187 }, { channel: 'Email', visitors: 120 }]}}",
      },
      categoryField: {
        value: 'channel',
      },
      valueField: {
        value: 'visitors',
      },
      centerValue: {
        value: '',
      },
      centerLabel: {
        value: 'Completed',
      },
      startAngle: {
        value: '{{90}}',
      },
      endAngle: {
        value: '{{-270}}',
      },
      thickness: {
        value: '',
      },
      rounded: {
        value: '{{true}}',
      },
      showTrack: {
        value: '{{true}}',
      },
      valuePrefix: {
        value: '',
      },
      valueSuffix: {
        value: '%',
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
