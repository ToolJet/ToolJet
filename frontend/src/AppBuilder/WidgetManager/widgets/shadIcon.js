// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadIconConfig = {
  name: 'ShadIcon',
  displayName: 'Icon',
  description:
    "shadcn/ui icon: icon is any lucide name ('trending-up' or 'TrendingUp'; unknown names show a neutral dashed circle), size (px), strokeWidth, tone (default, muted, primary, success, warning, destructive) or the iconColor style, chip ('none', 'circle', 'square') for the tinted icon chip of KPI cards (chipColor style, else a tint of the icon colour; chipSize, else size x 2); onClick. Height: 40px with a chip at size 20, else the icon size",
  component: 'ShadIcon',
  defaultSize: {
    width: 3,
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
    icon: {
      type: 'code',
      displayName: 'Icon name (lucide)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'trending-up',
      },
      placeholder: "'trending-up', 'users', 'shopping-cart'",
    },
    size: {
      type: 'code',
      displayName: 'Icon size (px)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 20,
      },
    },
    strokeWidth: {
      type: 'code',
      displayName: 'Stroke width',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 2,
      },
    },
    tone: {
      type: 'select',
      displayName: 'Tone (unless Icon color is set)',
      options: [
        {
          name: 'Default',
          value: 'default',
        },
        {
          name: 'Muted',
          value: 'muted',
        },
        {
          name: 'Primary',
          value: 'primary',
        },
        {
          name: 'Success',
          value: 'success',
        },
        {
          name: 'Warning',
          value: 'warning',
        },
        {
          name: 'Destructive',
          value: 'destructive',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'primary',
      },
    },
    chip: {
      type: 'switch',
      displayName: 'Background chip',
      options: [
        {
          displayName: 'None',
          value: 'none',
        },
        {
          displayName: 'Circle',
          value: 'circle',
        },
        {
          displayName: 'Rounded square',
          value: 'square',
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
    chipSize: {
      type: 'code',
      displayName: 'Chip size (px, empty: icon x 2)',
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
      displayName: 'Chip background (default: icon color tint)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    chipRadius: {
      type: 'numberInput',
      displayName: 'Chip radius (square chip)',
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
      icon: {
        value: 'trending-up',
      },
      size: {
        value: '{{20}}',
      },
      strokeWidth: {
        value: '{{2}}',
      },
      tone: {
        value: 'primary',
      },
      chip: {
        value: 'square',
      },
      chipSize: {
        value: '',
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
        value: 'left',
      },
    },
  },
};
