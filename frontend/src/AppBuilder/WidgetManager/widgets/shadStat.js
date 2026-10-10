// GENERATED from WidgetManager/shadcnSource.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadStatConfig = {
  name: 'ShadStat',
  displayName: 'Stat',
  description:
    "shadcn/ui dashboard figure, from a single number to a full KPI card: label, value, change badge (change, trend) with a context line (changeLabel, e.g. 'vs last month'), footnote; optional icon (any lucide name, iconPosition right, left or top, iconStyle square, circle or none), trendData for a small trend line under the figure (numbers or [{ x, y }]), progress (0 to 100) with progressLabel for a target bar, and size sm, default or lg. Each part shows only when set. Styles valueFontFamily ('serif', 'display', 'mono', ...), labelTextTransform ('uppercase') and labelLetterSpacing ('0.1em') set the figure's typeface and a small-caps label",
  component: 'ShadStat',
  defaultSize: {
    width: 10,
    height: 120,
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
    label: {
      type: 'code',
      displayName: 'Label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'Total revenue',
      },
    },
    value: {
      type: 'code',
      displayName: 'Value',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
        defaultValue: '$1,250.00',
      },
    },
    change: {
      type: 'code',
      displayName: 'Change (e.g. +12.5%)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    trend: {
      type: 'switch',
      displayName: 'Trend',
      options: [
        {
          displayName: 'Up',
          value: 'up',
        },
        {
          displayName: 'Down',
          value: 'down',
        },
        {
          displayName: 'Neutral',
          value: 'neutral',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'up',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    changeLabel: {
      type: 'code',
      displayName: 'Change context (e.g. vs last month)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    footnote: {
      type: 'code',
      displayName: 'Footnote',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    icon: {
      type: 'code',
      displayName: 'Icon (lucide name, e.g. wallet)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    iconPosition: {
      type: 'switch',
      displayName: 'Icon position',
      options: [
        {
          displayName: 'Right',
          value: 'right',
        },
        {
          displayName: 'Left',
          value: 'left',
        },
        {
          displayName: 'Top',
          value: 'top',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'right',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    iconStyle: {
      type: 'switch',
      displayName: 'Icon style',
      options: [
        {
          displayName: 'Square',
          value: 'square',
        },
        {
          displayName: 'Circle',
          value: 'circle',
        },
        {
          displayName: 'None',
          value: 'none',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'square',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    trendData: {
      type: 'code',
      displayName: 'Trend data (numbers or [{ x, y }])',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'array',
            },
            {
              type: 'string',
            },
          ],
        },
        defaultValue: '',
      },
    },
    sparklineType: {
      type: 'switch',
      displayName: 'Trend line',
      options: [
        {
          displayName: 'Area',
          value: 'area',
        },
        {
          displayName: 'Line',
          value: 'line',
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
    progress: {
      type: 'code',
      displayName: 'Progress (0 to 100)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'number',
            },
            {
              type: 'string',
            },
          ],
        },
        defaultValue: '',
      },
    },
    progressLabel: {
      type: 'code',
      displayName: 'Progress label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Sm',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Lg',
          value: 'lg',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    card: {
      type: 'toggle',
      displayName: 'Show as card',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
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
  events: {},
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
    backgroundColor: {
      type: 'colorSwatches',
      displayName: 'Card background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Card border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Card radius',
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
      },
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    valueColor: {
      type: 'colorSwatches',
      displayName: 'Value color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    footnoteColor: {
      type: 'colorSwatches',
      displayName: 'Footnote color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    positiveColor: {
      type: 'colorSwatches',
      displayName: 'Change color when trend is up',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    negativeColor: {
      type: 'colorSwatches',
      displayName: 'Change color when trend is down',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    iconColor: {
      type: 'colorSwatches',
      displayName: 'Icon color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    chipColor: {
      type: 'colorSwatches',
      displayName: 'Icon tile color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    sparklineColor: {
      type: 'colorSwatches',
      displayName: 'Trend line color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    progressColor: {
      type: 'colorSwatches',
      displayName: 'Progress color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    valueFontFamily: {
      type: 'select',
      displayName: 'Value typeface',
      options: [
        {
          name: 'Theme font',
          value: 'theme',
        },
        {
          name: 'Sans serif',
          value: 'sans',
        },
        {
          name: 'Serif',
          value: 'serif',
        },
        {
          name: 'Display serif',
          value: 'display',
        },
        {
          name: 'Monospace',
          value: 'mono',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'theme',
      },
    },
    labelTextTransform: {
      type: 'select',
      displayName: 'Label casing',
      options: [
        {
          name: 'As typed',
          value: 'none',
        },
        {
          name: 'UPPERCASE',
          value: 'uppercase',
        },
        {
          name: 'lowercase',
          value: 'lowercase',
        },
        {
          name: 'Capitalize',
          value: 'capitalize',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'none',
      },
    },
    labelLetterSpacing: {
      type: 'code',
      displayName: 'Label letter spacing (px, or em like 0.12em)',
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
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
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
      label: {
        value: 'Total revenue',
      },
      value: {
        value: '$1,250.00',
      },
      change: {
        value: '',
      },
      trend: {
        value: 'up',
      },
      changeLabel: {
        value: '',
      },
      footnote: {
        value: '',
      },
      icon: {
        value: '',
      },
      iconPosition: {
        value: 'right',
      },
      iconStyle: {
        value: 'square',
      },
      trendData: {
        value: '',
      },
      sparklineType: {
        value: 'area',
      },
      progress: {
        value: '',
      },
      progressLabel: {
        value: '',
      },
      size: {
        value: 'default',
      },
      card: {
        value: '{{true}}',
      },
      dynamicHeight: {
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
      valueFontFamily: {
        value: 'theme',
      },
      labelTextTransform: {
        value: 'none',
      },
    },
  },
};
