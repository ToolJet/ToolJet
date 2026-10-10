// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadCircularProgressConfig = {
  name: 'ShadCircularProgress',
  displayName: 'Circular progress',
  description:
    "shadcn/ui circular progress ring: value 0 to 100 (clamped), size and thickness (px), lineCap ('round', 'flat'), centerText ('value' shows 63%, 'custom' shows text, 'none') with an optional label under it; barColor (default: the primary), trackColor, textColor, labelColor styles. Height: the size (96px by default)",
  component: 'ShadCircularProgress',
  defaultSize: {
    width: 5,
    height: 104,
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
    value: {
      type: 'code',
      displayName: 'Value (0 to 100)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 63,
      },
    },
    size: {
      type: 'code',
      displayName: 'Size (px)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 96,
      },
    },
    thickness: {
      type: 'code',
      displayName: 'Thickness (px)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 8,
      },
    },
    lineCap: {
      type: 'switch',
      displayName: 'Ends',
      options: [
        {
          displayName: 'Round',
          value: 'round',
        },
        {
          displayName: 'Flat',
          value: 'flat',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'round',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    centerText: {
      type: 'switch',
      displayName: 'Centre text',
      options: [
        {
          displayName: 'Value',
          value: 'value',
        },
        {
          displayName: 'Custom',
          value: 'custom',
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
        defaultValue: 'value',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    text: {
      type: 'code',
      displayName: 'Custom centre text',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    label: {
      type: 'code',
      displayName: 'Sub-label',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
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
    barColor: {
      type: 'colorSwatches',
      displayName: 'Bar color',
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
    textColor: {
      type: 'colorSwatches',
      displayName: 'Centre text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    labelColor: {
      type: 'colorSwatches',
      displayName: 'Sub-label color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    alignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
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
      value: {
        value: '{{63}}',
      },
      size: {
        value: '{{96}}',
      },
      thickness: {
        value: '{{8}}',
      },
      lineCap: {
        value: 'round',
      },
      centerText: {
        value: 'value',
      },
      text: {
        value: '',
      },
      label: {
        value: 'Complete',
      },
      dynamicHeight: {
        value: '{{true}}',
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
      alignment: {
        value: 'center',
      },
    },
  },
};
