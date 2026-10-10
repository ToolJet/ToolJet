// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadTimelineConfig = {
  name: 'ShadTimeline',
  displayName: 'Timeline',
  description:
    "shadcn/ui vertical timeline / activity feed: items [{ title, description, time, status or color, icon? }] (status words such as done, active, pending, failed take theme colours; statusColors maps your own); marker ('dot' or 'icon' with lucide names); density ('comfortable', 'compact'); newestFirst; timePosition ('right', 'top'); dateFormat for ISO times. Clicking an item sets lastClickedItem and fires onItemClick. Height: about 66px per item with a description (44px without), 50px compact",
  component: 'ShadTimeline',
  defaultSize: {
    width: 14,
    height: 224,
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
      displayName: 'Items',
      validation: {
        schema: {
          type: 'array',
        },
        defaultValue: [],
      },
      placeholder: "[{ title: 'Order placed', description: 'By Ada', time: '09:12', status: 'done' }]",
    },
    marker: {
      type: 'switch',
      displayName: 'Marker',
      options: [
        {
          displayName: 'Dot',
          value: 'dot',
        },
        {
          displayName: 'Icon',
          value: 'icon',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'dot',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    density: {
      type: 'switch',
      displayName: 'Density',
      options: [
        {
          displayName: 'Comfortable',
          value: 'comfortable',
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
        defaultValue: 'comfortable',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    newestFirst: {
      type: 'toggle',
      displayName: 'Newest first (reverse)',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    timePosition: {
      type: 'switch',
      displayName: 'Time',
      options: [
        {
          displayName: 'Beside title',
          value: 'right',
        },
        {
          displayName: 'Above title',
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
    dateFormat: {
      type: 'code',
      displayName: 'Date format for ISO times (empty: as given)',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: '',
      },
    },
    statusColors: {
      type: 'code',
      displayName: 'Colours by status',
      validation: {
        schema: {
          type: 'object',
        },
        defaultValue: {},
      },
      placeholder: "{ shipped: '#2563eb' }",
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
  events: {
    onItemClick: {
      displayName: 'On item click',
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
    markerColor: {
      type: 'colorSwatches',
      displayName: 'Marker color (items without status)',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    lineColor: {
      type: 'colorSwatches',
      displayName: 'Connecting line color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    titleColor: {
      type: 'colorSwatches',
      displayName: 'Title color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    descriptionColor: {
      type: 'colorSwatches',
      displayName: 'Description color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    timeColor: {
      type: 'colorSwatches',
      displayName: 'Time color',
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
    lastClickedItem: {},
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
          "{{[{ title: 'Order placed', description: 'Ada Lovelace placed order #1024', time: '09:12', status: 'done', icon: 'shopping-cart' }, { title: 'Payment confirmed', description: '$1,250.00 by card', time: '09:14', status: 'done', icon: 'credit-card' }, { title: 'Packed', description: 'Warehouse A, bay 4', time: '11:30', status: 'active', icon: 'package' }, { title: 'Out for delivery', time: 'Pending', status: 'pending', icon: 'truck' }]}}",
      },
      marker: {
        value: 'dot',
      },
      density: {
        value: 'comfortable',
      },
      newestFirst: {
        value: '{{false}}',
      },
      timePosition: {
        value: 'right',
      },
      dateFormat: {
        value: '',
      },
      statusColors: {
        value: '{{{}}}',
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
    },
  },
};
