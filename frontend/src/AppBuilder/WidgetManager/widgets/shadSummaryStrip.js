// GENERATED from WidgetManager/shadcnSource.sections.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadSummaryStripConfig = {
  name: 'ShadSummaryStrip',
  displayName: 'Summary strip',
  description:
    "Strip of 3 to 6 headline figures in one row with hairline separators (no card per figure), to sit above or beside a table or a chart: items [{ label, value, format, delta, deltaFormat, tone, lowerIsBetter, caption }] (at most 6 shown). value formats in the item's format, else valueFormat (auto: currency for money labels such as Revenue or Average order, a grouped number otherwise; number, currency in currency, percent, compact, date). delta: a number is signed and shown in deltaFormat (percent: 12.5 shows +12.5%; number; currency), text shows as written ('+3 this week'); its colour is the item's tone (positive, negative, neutral), else its sign (up green, down red; lowerIsBetter flips it for churn, refunds, wait times). caption is a small line under the figure ('vs last month'). appearance 'panel' (one bordered panel) or 'plain'; size sm, default or lg; align left or center. Narrow widths wrap figures into rows. Height: about 90px (sm 70px, lg 110px) a row, plus 18px with captions",
  component: 'ShadSummaryStrip',
  defaultSize: {
    width: 43,
    height: 100,
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
    items: {
      type: 'code',
      displayName: 'Figures',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ label: 'Revenue', value: 48210, delta: 12.4, caption: 'vs last month' }]",
    },
    valueFormat: {
      type: 'select',
      displayName: 'Value format',
      options: [
        {
          name: 'Auto',
          value: 'auto',
        },
        {
          name: 'Number',
          value: 'number',
        },
        {
          name: 'Currency',
          value: 'currency',
        },
        {
          name: 'Percent',
          value: 'percent',
        },
        {
          name: 'Compact',
          value: 'compact',
        },
        {
          name: 'Date',
          value: 'date',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'auto',
      },
    },
    currency: {
      type: 'code',
      displayName: 'Currency (ISO code, e.g. USD)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'USD',
      },
    },
    deltaFormat: {
      type: 'switch',
      displayName: 'Change format (numbers)',
      options: [
        {
          displayName: 'Percent',
          value: 'percent',
        },
        {
          displayName: 'Number',
          value: 'number',
        },
        {
          displayName: 'Currency',
          value: 'currency',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'percent',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    appearance: {
      type: 'switch',
      displayName: 'Appearance',
      options: [
        {
          displayName: 'Panel',
          value: 'panel',
        },
        {
          displayName: 'Plain',
          value: 'plain',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'panel',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Small',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
        {
          displayName: 'Large',
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
    align: {
      type: 'switch',
      displayName: 'Align',
      options: [
        {
          displayName: 'Left',
          value: 'left',
        },
        {
          displayName: 'Center',
          value: 'center',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
      },
      isFxNotRequired: true,
      fullWidth: true,
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
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: {
        schema: {
          type: 'boolean',
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
      displayName: 'Panel background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderColor: {
      type: 'colorSwatches',
      displayName: 'Border and separator color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Label and caption color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    valueColor: {
      type: 'colorSwatches',
      displayName: 'Figure color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    positiveColor: {
      type: 'colorSwatches',
      displayName: 'Positive change color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    negativeColor: {
      type: 'colorSwatches',
      displayName: 'Negative change color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Panel radius',
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
    valueFontFamily: {
      type: 'select',
      displayName: 'Figure typeface',
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
      items: {
        value:
          "{{[{ label: 'Revenue', value: 48210, delta: 12.4, caption: 'vs last month' }, { label: 'Orders', value: 1284, format: 'number', delta: 5.1, caption: 'vs last month' }, { label: 'Average order', value: 37.55, delta: -2.3, caption: 'vs last month' }, { label: 'Refund rate', value: 2.1, format: 'percent', delta: -0.4, deltaFormat: 'number', lowerIsBetter: true, caption: 'points' }]}}",
      },
      valueFormat: {
        value: 'auto',
      },
      currency: {
        value: 'USD',
      },
      deltaFormat: {
        value: 'percent',
      },
      appearance: {
        value: 'panel',
      },
      size: {
        value: 'default',
      },
      align: {
        value: 'left',
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
      valueFontFamily: {
        value: 'theme',
      },
    },
  },
};
